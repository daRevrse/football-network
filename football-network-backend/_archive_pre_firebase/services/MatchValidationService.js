const db = require('../config/database');
const NotificationService = require('./NotificationService');

/**
 * Service de validation unifié des scores
 * Gère la validation par les managers ET l'arbitre avec système de consensus
 */
class MatchValidationService {
  /**
   * Enregistrer une validation de score
   * @param {Object} params - Paramètres de validation
   * @returns {Object} Résultat de la validation
   */
  async submitValidation({
    matchId,
    validatorId,
    validatorRole, // 'home_manager', 'away_manager', 'referee'
    homeScore,
    awayScore,
    notes = null
  }) {
    try {
      // Vérifier que le match existe et n'est pas déjà validé
      const [matches] = await db.execute(
        `SELECT
          m.*,
          ht.id as home_team_id,
          ht.name as home_team_name,
          ht.captain_id as home_captain_id,
          at.id as away_team_id,
          at.name as away_team_name,
          at.captain_id as away_captain_id
         FROM matches m
         JOIN teams ht ON m.home_team_id = ht.id
         LEFT JOIN teams at ON m.away_team_id = at.id
         WHERE m.id = ?`,
        [matchId]
      );

      if (matches.length === 0) {
        return { success: false, error: 'Match not found' };
      }

      const match = matches[0];

      // Vérifier que le match est terminé
      if (match.status !== 'completed') {
        return { success: false, error: 'Match must be completed before validation' };
      }

      // Vérifier si l'utilisateur a déjà validé ce match
      const [existingValidations] = await db.execute(
        `SELECT id FROM match_validations
         WHERE match_id = ? AND validator_id = ? AND validator_role = ?`,
        [matchId, validatorId, validatorRole]
      );

      if (existingValidations.length > 0) {
        return { success: false, error: 'You have already validated this match' };
      }

      // Enregistrer la validation
      const [result] = await db.execute(
        `INSERT INTO match_validations
         (match_id, validator_id, validator_role, validation_type, home_score, away_score, status, notes)
         VALUES (?, ?, ?, 'score', ?, ?, 'approved', ?)`,
        [matchId, validatorId, validatorRole, homeScore, awayScore, notes]
      );

      console.log(`✅ Validation recorded: ${validatorRole} validated match ${matchId} (${homeScore}-${awayScore})`);

      // Mettre à jour les flags de validation dans la table matches
      await this.updateMatchValidationFlags(matchId, validatorRole);

      // Vérifier le consensus
      const consensusResult = await this.checkConsensus(matchId);

      if (consensusResult.hasConsensus) {
        // Consensus atteint - finaliser le match
        await this.finalizeMatch(matchId, consensusResult.agreedScore);
      } else if (consensusResult.hasDispute) {
        // Désaccord détecté
        await this.markAsDisputed(matchId, consensusResult.validations);
      }

      return {
        success: true,
        validationId: result.insertId,
        consensus: consensusResult
      };

    } catch (error) {
      console.error('Match validation error:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour les flags de validation dans la table matches
   */
  async updateMatchValidationFlags(matchId, validatorRole) {
    let updateQuery = '';

    switch (validatorRole) {
      case 'home_manager':
      case 'home_captain':
        updateQuery = `UPDATE matches
                      SET home_captain_validated = 1,
                          home_captain_validated_at = NOW()
                      WHERE id = ?`;
        break;
      case 'away_manager':
      case 'away_captain':
        updateQuery = `UPDATE matches
                      SET away_captain_validated = 1,
                          away_captain_validated_at = NOW()
                      WHERE id = ?`;
        break;
      case 'referee':
        updateQuery = `UPDATE matches
                      SET is_referee_verified = 1,
                          referee_validated_at = NOW()
                      WHERE id = ?`;
        break;
    }

    if (updateQuery) {
      await db.execute(updateQuery, [matchId]);
    }
  }

  /**
   * Vérifier le consensus entre les validations
   * Règle: Au moins 2 sur 3 (home_manager, away_manager, referee) doivent valider le même score
   */
  async checkConsensus(matchId) {
    // Récupérer toutes les validations pour ce match
    const [validations] = await db.execute(
      `SELECT validator_role, home_score, away_score, notes
       FROM match_validations
       WHERE match_id = ? AND status = 'approved'
       ORDER BY created_at ASC`,
      [matchId]
    );

    if (validations.length < 2) {
      return {
        hasConsensus: false,
        hasDispute: false,
        validationsCount: validations.length,
        validations
      };
    }

    // Grouper les validations par score
    const scoreGroups = {};
    validations.forEach(v => {
      const scoreKey = `${v.home_score}-${v.away_score}`;
      if (!scoreGroups[scoreKey]) {
        scoreGroups[scoreKey] = {
          score: { home: v.home_score, away: v.away_score },
          validators: []
        };
      }
      scoreGroups[scoreKey].validators.push(v.validator_role);
    });

    // Trouver le score avec le plus de validations
    let maxValidations = 0;
    let agreedScore = null;
    let agreedValidators = [];

    Object.values(scoreGroups).forEach(group => {
      if (group.validators.length > maxValidations) {
        maxValidations = group.validators.length;
        agreedScore = group.score;
        agreedValidators = group.validators;
      }
    });

    // Consensus atteint si au moins 2 validateurs sont d'accord
    const hasConsensus = maxValidations >= 2;

    // Dispute si 3 validations avec des scores différents
    const hasDispute = validations.length >= 3 && !hasConsensus;

    return {
      hasConsensus,
      hasDispute,
      agreedScore,
      agreedValidators,
      validationsCount: validations.length,
      validations,
      scoreGroups
    };
  }

  /**
   * Finaliser le match avec le score consensuel
   */
  async finalizeMatch(matchId, score) {
    try {
      // Mettre à jour le score final et marquer comme totalement validé
      await db.execute(
        `UPDATE matches
         SET home_score = ?,
             away_score = ?,
             home_captain_validated = 1,
             away_captain_validated = 1,
             is_referee_verified = 1,
             is_disputed = 0
         WHERE id = ?`,
        [score.home, score.away, matchId]
      );

      console.log(`✅ Match ${matchId} finalized with consensus score: ${score.home}-${score.away}`);

      // Récupérer les infos du match pour les notifications
      const [matches] = await db.execute(
        `SELECT m.*,
                ht.name as home_team_name,
                ht.captain_id as home_captain_id,
                at.name as away_team_name,
                at.captain_id as away_captain_id
         FROM matches m
         JOIN teams ht ON m.home_team_id = ht.id
         LEFT JOIN teams at ON m.away_team_id = at.id
         WHERE m.id = ?`,
        [matchId]
      );

      const match = matches[0];

      // Notifier les capitaines
      const message = `Le score du match a été validé par consensus : ${match.home_team_name} ${score.home} - ${score.away} ${match.away_team_name}`;

      await NotificationService.createNotification({
        userId: match.home_captain_id,
        type: 'match_validated',
        title: 'Score validé',
        message,
        relatedId: matchId,
        relatedType: 'match'
      });

      if (match.away_captain_id) {
        await NotificationService.createNotification({
          userId: match.away_captain_id,
          type: 'match_validated',
          title: 'Score validé',
          message,
          relatedId: matchId,
          relatedType: 'match'
        });
      }

      // Déclencher le calcul des statistiques
      const MatchStatisticsService = require('./MatchStatisticsService');
      await MatchStatisticsService.calculateMatchStatistics(matchId);

    } catch (error) {
      console.error('Finalize match error:', error);
      throw error;
    }
  }

  /**
   * Marquer le match comme disputé
   */
  async markAsDisputed(matchId, validations) {
    try {
      await db.execute(
        `UPDATE matches
         SET is_disputed = 1,
             dispute_reason = ?
         WHERE id = ?`,
        ['Score validation conflict between validators', matchId]
      );

      console.log(`⚠️ Match ${matchId} marked as disputed`);

      // Notifier les admins/capitaines
      const [matches] = await db.execute(
        `SELECT ht.captain_id as home_captain_id,
                at.captain_id as away_captain_id,
                ht.name as home_team_name,
                at.name as away_team_name
         FROM matches m
         JOIN teams ht ON m.home_team_id = ht.id
         LEFT JOIN teams at ON m.away_team_id = at.id
         WHERE m.id = ?`,
        [matchId]
      );

      const match = matches[0];

      const message = `Le score du match ${match.home_team_name} vs ${match.away_team_name} est contesté. Les validateurs ne sont pas d'accord.`;

      await NotificationService.createNotification({
        userId: match.home_captain_id,
        type: 'match_disputed',
        title: 'Score contesté',
        message,
        relatedId: matchId,
        relatedType: 'match'
      });

      if (match.away_captain_id) {
        await NotificationService.createNotification({
          userId: match.away_captain_id,
          type: 'match_disputed',
          title: 'Score contesté',
          message,
          relatedId: matchId,
          relatedType: 'match'
        });
      }

    } catch (error) {
      console.error('Mark as disputed error:', error);
      throw error;
    }
  }

  /**
   * Obtenir le statut de validation d'un match
   */
  async getValidationStatus(matchId) {
    try {
      const [validations] = await db.execute(
        `SELECT
          validator_id,
          validator_role,
          home_score,
          away_score,
          notes,
          created_at
         FROM match_validations
         WHERE match_id = ? AND status = 'approved'
         ORDER BY created_at ASC`,
        [matchId]
      );

      const consensus = await this.checkConsensus(matchId);

      return {
        validations,
        consensus
      };

    } catch (error) {
      console.error('Get validation status error:', error);
      throw error;
    }
  }
}

module.exports = new MatchValidationService();
