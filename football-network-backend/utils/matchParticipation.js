const db = require('../config/database');

/**
 * Crée automatiquement les participations pour tous les joueurs actifs des deux équipes
 * @param {number} matchId - ID du match
 * @param {number} homeTeamId - ID équipe domicile
 * @param {number} awayTeamId - ID équipe extérieure
 * @returns {Promise<{success: boolean, homeCount: number, awayCount: number}>}
 */
async function createParticipationsForMatch(matchId, homeTeamId, awayTeamId) {
  try {
    // Récupérer tous les joueurs actifs des deux équipes
    const [homeTeamPlayers] = await db.execute(
      `SELECT DISTINCT tm.user_id, tm.team_id
       FROM team_members tm
       WHERE tm.team_id = ? AND tm.is_active = true`,
      [homeTeamId]
    );

    const [awayTeamPlayers] = await db.execute(
      `SELECT DISTINCT tm.user_id, tm.team_id
       FROM team_members tm
       WHERE tm.team_id = ? AND tm.is_active = true`,
      [awayTeamId]
    );

    // Créer les participations pour l'équipe domicile
    for (const player of homeTeamPlayers) {
      await db.execute(
        `INSERT INTO match_participations (match_id, team_id, user_id, status)
         VALUES (?, ?, ?, 'pending')
         ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP`,
        [matchId, player.team_id, player.user_id]
      );
    }

    // Créer les participations pour l'équipe extérieure
    for (const player of awayTeamPlayers) {
      await db.execute(
        `INSERT INTO match_participations (match_id, team_id, user_id, status)
         VALUES (?, ?, ?, 'pending')
         ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP`,
        [matchId, player.team_id, player.user_id]
      );
    }

    return {
      success: true,
      homeCount: homeTeamPlayers.length,
      awayCount: awayTeamPlayers.length
    };
  } catch (error) {
    console.error('Error creating match participations:', error);
    throw error;
  }
}

/**
 * Vérifie le nombre de confirmations pour un match
 * @param {number} matchId - ID du match
 * @returns {Promise<{homeConfirmed: number, awayConfirmed: number, homeTotal: number, awayTotal: number, isValid: boolean}>}
 */
async function getMatchParticipationStatus(matchId) {
  try {
    // Récupérer les IDs des équipes
    const [matchInfo] = await db.execute(
      'SELECT home_team_id, away_team_id FROM matches WHERE id = ?',
      [matchId]
    );

    if (matchInfo.length === 0) {
      throw new Error('Match not found');
    }

    const { home_team_id, away_team_id } = matchInfo[0];

    // Compter les confirmations équipe domicile
    const [homeStats] = await db.execute(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed
       FROM match_participations
       WHERE match_id = ? AND team_id = ?`,
      [matchId, home_team_id]
    );

    // Compter les confirmations équipe extérieure
    const [awayStats] = await db.execute(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed
       FROM match_participations
       WHERE match_id = ? AND team_id = ?`,
      [matchId, away_team_id]
    );

    const homeConfirmed = parseInt(homeStats[0].confirmed) || 0;
    const awayConfirmed = parseInt(awayStats[0].confirmed) || 0;
    const homeTotal = parseInt(homeStats[0].total) || 0;
    const awayTotal = parseInt(awayStats[0].total) || 0;

    // Le match est valide si chaque équipe a au moins 6 confirmations
    const isValid = homeConfirmed >= 6 && awayConfirmed >= 6;

    return {
      homeConfirmed,
      awayConfirmed,
      homeTotal,
      awayTotal,
      isValid,
      homeTeamId: home_team_id,
      awayTeamId: away_team_id
    };
  } catch (error) {
    console.error('Error checking participation status:', error);
    throw error;
  }
}

/**
 * Valide automatiquement un match si conditions remplies
 * @param {number} matchId - ID du match
 * @returns {Promise<{validated: boolean, status: object}>}
 */
async function validateMatchParticipation(matchId) {
  try {
    const status = await getMatchParticipationStatus(matchId);

    // Déterminer le statut de validation
    let validationStatus = 'critical';
    if (status.homeConfirmed >= 6 && status.awayConfirmed >= 6) {
      validationStatus = 'validated';
    } else if (status.homeConfirmed >= 4 && status.awayConfirmed >= 4) {
      validationStatus = 'warning';
    }

    // Enregistrer l'historique de validation
    await db.execute(
      `INSERT INTO match_validation_history
       (match_id, validation_type, home_team_confirmed, away_team_confirmed, is_valid, validation_status)
       VALUES (?, 'auto_check', ?, ?, ?, ?)`,
      [matchId, status.homeConfirmed, status.awayConfirmed, status.isValid, validationStatus]
    );

    // Mettre à jour le match
    await db.execute(
      `UPDATE matches
       SET participation_validated = ?,
           last_validation_check = CURRENT_TIMESTAMP,
           validation_warnings = validation_warnings + ?
       WHERE id = ?`,
      [status.isValid, validationStatus === 'warning' ? 1 : 0, matchId]
    );

    return {
      validated: status.isValid,
      status: {
        ...status,
        validationStatus
      }
    };
  } catch (error) {
    console.error('Error validating match participation:', error);
    throw error;
  }
}

/**
 * Récupère toutes les participations pour un match avec détails des joueurs
 * @param {number} matchId - ID du match
 * @returns {Promise<Array>}
 */
async function getMatchParticipations(matchId) {
  try {
    const [participations] = await db.execute(
      `SELECT
        mp.*,
        u.first_name,
        u.last_name,
        u.email,
        u.preferred_position,
        t.name as team_name
       FROM match_participations mp
       JOIN users u ON mp.user_id = u.id
       JOIN teams t ON mp.team_id = t.id
       WHERE mp.match_id = ?
       ORDER BY mp.team_id, mp.status, u.last_name`,
      [matchId]
    );

    return participations;
  } catch (error) {
    console.error('Error fetching match participations:', error);
    throw error;
  }
}

/**
 * Met à jour la participation d'un joueur
 * @param {number} participationId - ID de la participation
 * @param {string} status - Nouveau statut (confirmed/declined/maybe)
 * @param {string} note - Note optionnelle
 * @returns {Promise<boolean>}
 */
async function updateParticipation(participationId, status, note = null) {
  try {
    await db.execute(
      `UPDATE match_participations
       SET status = ?,
           response_note = ?,
           responded_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, note, participationId]
    );

    // Récupérer le match_id pour déclencher la validation
    const [participation] = await db.execute(
      'SELECT match_id FROM match_participations WHERE id = ?',
      [participationId]
    );

    if (participation.length > 0) {
      // Validation automatique après chaque mise à jour
      await validateMatchParticipation(participation[0].match_id);
    }

    return true;
  } catch (error) {
    console.error('Error updating participation:', error);
    throw error;
  }
}

/**
 * Récupère les participations en attente pour un utilisateur
 * @param {number} userId - ID de l'utilisateur
 * @returns {Promise<Array>}
 */
async function getPendingParticipationsForUser(userId) {
  try {
    const [participations] = await db.execute(
      `SELECT
        mp.*,
        m.match_date,
        m.status as match_status,
        ht.name as home_team_name,
        ht.logo_url as home_team_logo,
        at.name as away_team_name,
        at.logo_url as away_team_logo,
        l.city as location_city,
        l.address as location_address
       FROM match_participations mp
       JOIN matches m ON mp.match_id = m.id
       JOIN teams ht ON m.home_team_id = ht.id
       JOIN teams at ON m.away_team_id = at.id
       LEFT JOIN locations l ON m.location_id = l.id
       WHERE mp.user_id = ?
         AND mp.status = 'pending'
         AND m.match_date > NOW()
       ORDER BY m.match_date ASC`,
      [userId]
    );

    return participations;
  } catch (error) {
    console.error('Error fetching pending participations:', error);
    throw error;
  }
}

module.exports = {
  createParticipationsForMatch,
  getMatchParticipationStatus,
  validateMatchParticipation,
  getMatchParticipations,
  updateParticipation,
  getPendingParticipationsForUser
};
