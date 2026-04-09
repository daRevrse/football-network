const db = require("../config/database");
const NotificationService = require("./NotificationService");

/**
 * Service pour gérer automatiquement les statuts des matchs
 * - Passe un match à "in_progress" quand l'heure de début est atteinte
 * - Passe un match à "completed" après 120 minutes s'il n'a pas été complété manuellement
 */
class MatchStatusService {
  constructor() {
    this.checkInterval = null;
    this.MATCH_DURATION = 120; // 120 minutes (90 min + mi-temps + temps additionnel)
  }

  /**
   * Démarre le service de vérification automatique des statuts
   * @param {number} intervalMinutes - Intervalle de vérification en minutes (défaut: 1)
   */
  start(intervalMinutes = 1) {
    if (this.checkInterval) {
      console.log("⚠️ MatchStatusService is already running");
      return;
    }

    console.log(`✅ Starting MatchStatusService (checking every ${intervalMinutes} minute(s))`);

    // Vérification immédiate au démarrage
    this.checkMatchStatuses().catch(err => {
      console.error("❌ Error during initial match status check:", err);
    });

    // Puis vérification périodique
    this.checkInterval = setInterval(() => {
      this.checkMatchStatuses().catch(err => {
        console.error("❌ Error during periodic match status check:", err);
      });
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Arrête le service de vérification automatique
   */
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log("🛑 MatchStatusService stopped");
    }
  }

  /**
   * Vérifie et met à jour les statuts de tous les matchs qui nécessitent un changement
   */
  async checkMatchStatuses() {
    try {
      const now = new Date();
      console.log(`🔍 Checking match statuses at ${now.toISOString()}`);

      // 1. Vérifier les matchs qui doivent passer à "in_progress"
      await this.checkMatchesToStart();

      // 2. Vérifier les matchs qui doivent passer à "completed"
      await this.checkMatchesToComplete();

    } catch (error) {
      console.error("❌ Error in checkMatchStatuses:", error);
      throw error;
    }
  }

  /**
   * Vérifie et démarre automatiquement les matchs dont l'heure de début est atteinte
   * Utilise des transactions avec verrouillage pour éviter les race conditions
   */
  async checkMatchesToStart() {
    const connection = await db.getConnection();
    try {
      const now = new Date();

      // Récupérer les matchs confirmés dont l'heure de début est passée
      const [matchesToStart] = await connection.execute(
        `SELECT m.id, m.match_date,
                ht.name as home_team_name, ht.captain_id as home_captain_id,
                at.name as away_team_name, at.captain_id as away_captain_id
         FROM matches m
         JOIN teams ht ON m.home_team_id = ht.id
         LEFT JOIN teams at ON m.away_team_id = at.id
         WHERE m.status = 'confirmed'
         AND m.match_date <= ?
         ORDER BY m.match_date ASC`,
        [now]
      );

      if (matchesToStart.length === 0) {
        return;
      }

      console.log(`🎯 Found ${matchesToStart.length} match(es) to start`);

      for (const match of matchesToStart) {
        try {
          await connection.beginTransaction();

          // Verrouiller la ligne pour éviter les mises à jour concurrentes
          const [lockedMatch] = await connection.execute(
            `SELECT id, status FROM matches WHERE id = ? AND status = 'confirmed' FOR UPDATE`,
            [match.id]
          );

          // Vérifier que le match est toujours en status 'confirmed' (pas modifié entre-temps)
          if (lockedMatch.length === 0) {
            await connection.rollback();
            continue; // Le match a déjà été traité par un autre processus
          }

          // Mettre à jour le statut
          await connection.execute(
            `UPDATE matches
             SET status = 'in_progress',
                 started_at = NOW(),
                 updated_at = NOW()
             WHERE id = ? AND status = 'confirmed'`,
            [match.id]
          );

          await connection.commit();

          console.log(`✅ Match ${match.id} started automatically: ${match.home_team_name} vs ${match.away_team_name}`);

          // Notifier les managers (en dehors de la transaction)
          await this.notifyCaptains(
            match.home_captain_id,
            match.away_captain_id,
            match.id,
            "match_started",
            "Match démarré",
            `Le match ${match.home_team_name} vs ${match.away_team_name} a démarré automatiquement.`
          );

        } catch (error) {
          await connection.rollback();
          console.error(`❌ Error starting match ${match.id}:`, error);
        }
      }

    } catch (error) {
      console.error("❌ Error in checkMatchesToStart:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Vérifie et complète automatiquement les matchs qui ont dépassé 120 minutes
   * Utilise des transactions avec verrouillage pour éviter les race conditions
   */
  async checkMatchesToComplete() {
    const connection = await db.getConnection();
    try {
      const now = new Date();
      const completionTime = new Date(now.getTime() - this.MATCH_DURATION * 60 * 1000);

      // Récupérer les matchs en cours qui ont dépassé 120 minutes
      const [matchesToComplete] = await connection.execute(
        `SELECT m.id, m.match_date, m.started_at,
                ht.name as home_team_name, ht.captain_id as home_captain_id,
                at.name as away_team_name, at.captain_id as away_captain_id
         FROM matches m
         JOIN teams ht ON m.home_team_id = ht.id
         LEFT JOIN teams at ON m.away_team_id = at.id
         WHERE m.status = 'in_progress'
         AND (
           (m.started_at IS NOT NULL AND m.started_at <= ?) OR
           (m.started_at IS NULL AND m.match_date <= ?)
         )
         ORDER BY m.match_date ASC`,
        [completionTime, completionTime]
      );

      if (matchesToComplete.length === 0) {
        return;
      }

      console.log(`🏁 Found ${matchesToComplete.length} match(es) to complete`);

      for (const match of matchesToComplete) {
        try {
          await connection.beginTransaction();

          // Verrouiller la ligne pour éviter les mises à jour concurrentes
          const [lockedMatch] = await connection.execute(
            `SELECT id, status FROM matches WHERE id = ? AND status = 'in_progress' FOR UPDATE`,
            [match.id]
          );

          // Vérifier que le match est toujours en status 'in_progress'
          if (lockedMatch.length === 0) {
            await connection.rollback();
            continue; // Le match a déjà été traité par un autre processus
          }

          // Mettre à jour le statut
          await connection.execute(
            `UPDATE matches
             SET status = 'completed',
                 completed_at = NOW(),
                 updated_at = NOW()
             WHERE id = ? AND status = 'in_progress'`,
            [match.id]
          );

          await connection.commit();

          console.log(`✅ Match ${match.id} completed automatically: ${match.home_team_name} vs ${match.away_team_name}`);

          // Notifier les managers pour qu'ils saisissent le score (en dehors de la transaction)
          await this.notifyCaptains(
            match.home_captain_id,
            match.away_captain_id,
            match.id,
            "match_completed",
            "Match terminé",
            `Le match ${match.home_team_name} vs ${match.away_team_name} est terminé. Veuillez saisir le score final.`
          );

        } catch (error) {
          await connection.rollback();
          console.error(`❌ Error completing match ${match.id}:`, error);
        }
      }

    } catch (error) {
      console.error("❌ Error in checkMatchesToComplete:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Notifie les deux managers d'équipe
   */
  async notifyCaptains(homeCaptainId, awayCaptainId, matchId, type, title, message) {
    try {
      // Notifier le manager domicile
      if (homeCaptainId) {
        await NotificationService.createNotification({
          userId: homeCaptainId,
          type: type,
          title: title,
          message: message,
          relatedId: matchId,
          relatedType: "match",
        });
      }

      // Notifier le manager extérieur
      if (awayCaptainId) {
        await NotificationService.createNotification({
          userId: awayCaptainId,
          type: type,
          title: title,
          message: message,
          relatedId: matchId,
          relatedType: "match",
        });
      }
    } catch (error) {
      console.error("❌ Error notifying managers:", error);
    }
  }

  /**
   * Vérifie manuellement un match spécifique et met à jour son statut si nécessaire
   * @param {number} matchId - ID du match à vérifier
   * @returns {Object} Résultat de la vérification
   */
  async checkSingleMatch(matchId) {
    try {
      const [matches] = await db.execute(
        `SELECT m.id, m.match_date, m.started_at, m.status,
                ht.name as home_team_name, ht.captain_id as home_captain_id,
                at.name as away_team_name, at.captain_id as away_captain_id
         FROM matches m
         JOIN teams ht ON m.home_team_id = ht.id
         LEFT JOIN teams at ON m.away_team_id = at.id
         WHERE m.id = ?`,
        [matchId]
      );

      if (matches.length === 0) {
        return { success: false, error: "Match not found" };
      }

      const match = matches[0];
      const now = new Date();
      const matchDate = new Date(match.match_date);
      const startedAt = match.started_at ? new Date(match.started_at) : null;

      let updated = false;
      let newStatus = match.status;

      // Vérifier si le match doit être démarré
      if (match.status === 'confirmed' && matchDate <= now) {
        await db.execute(
          `UPDATE matches SET status = 'in_progress', started_at = NOW() WHERE id = ?`,
          [matchId]
        );
        newStatus = 'in_progress';
        updated = true;

        await this.notifyCaptains(
          match.home_captain_id,
          match.away_captain_id,
          match.id,
          "match_started",
          "Match démarré",
          `Le match ${match.home_team_name} vs ${match.away_team_name} a démarré.`
        );
      }

      // Vérifier si le match doit être complété
      if (match.status === 'in_progress') {
        const referenceTime = startedAt || matchDate;
        const elapsedMinutes = (now - referenceTime) / (60 * 1000);

        if (elapsedMinutes >= this.MATCH_DURATION) {
          await db.execute(
            `UPDATE matches SET status = 'completed', completed_at = NOW() WHERE id = ?`,
            [matchId]
          );
          newStatus = 'completed';
          updated = true;

          await this.notifyCaptains(
            match.home_captain_id,
            match.away_captain_id,
            match.id,
            "match_completed",
            "Match terminé",
            `Le match ${match.home_team_name} vs ${match.away_team_name} est terminé. Veuillez saisir le score final.`
          );
        }
      }

      return {
        success: true,
        matchId: match.id,
        previousStatus: match.status,
        currentStatus: newStatus,
        updated: updated
      };

    } catch (error) {
      console.error(`❌ Error checking single match ${matchId}:`, error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton
module.exports = new MatchStatusService();
