const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const {
  getPendingParticipationsForUser,
  updateParticipation,
  getMatchParticipations,
  getMatchParticipationStatus,
  validateMatchParticipation
} = require('../utils/matchParticipation');
const { canManageMatch, isMatchTeamManager } = require('../utils/matchPermissions');
const NotificationService = require('../services/NotificationService');
const db = require('../config/database');

const router = express.Router();

/**
 * GET /api/participations/my-pending
 * Récupère toutes les confirmations en attente pour l'utilisateur connecté
 */
router.get('/my-pending', authenticateToken, async (req, res) => {
  try {
    const participations = await getPendingParticipationsForUser(req.user.id);

    res.json({
      count: participations.length,
      participations
    });
  } catch (error) {
    console.error('Error fetching pending participations:', error);
    res.status(500).json({ error: 'Failed to fetch participations' });
  }
});

/**
 * PUT /api/participations/:id
 * Met à jour la participation d'un joueur (confirmer/décliner)
 */
router.put(
  '/:id',
  [
    authenticateToken,
    body('status')
      .isIn(['confirmed', 'declined', 'maybe'])
      .withMessage('Status must be confirmed, declined, or maybe'),
    body('note').optional().isLength({ max: 500 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { status, note } = req.body;

      // Vérifier que la participation appartient bien à l'utilisateur
      const db = require('../config/database');
      const [participation] = await db.execute(
        'SELECT * FROM match_participations WHERE id = ? AND user_id = ?',
        [id, req.user.id]
      );

      if (participation.length === 0) {
        return res.status(404).json({ error: 'Participation not found or unauthorized' });
      }

      // Mettre à jour la participation
      await updateParticipation(id, status, note || null);

      // Récupérer les nouvelles statistiques du match
      const matchStatus = await getMatchParticipationStatus(participation[0].match_id);

      res.json({
        message: 'Participation updated successfully',
        status,
        matchStatus
      });
    } catch (error) {
      console.error('Error updating participation:', error);
      res.status(500).json({ error: 'Failed to update participation' });
    }
  }
);

/**
 * GET /api/participations/match/:matchId
 * Récupère toutes les participations pour un match spécifique
 */
router.get('/match/:matchId', authenticateToken, async (req, res) => {
  try {
    const { matchId } = req.params;

    // Vérifier que l'utilisateur a accès à ce match (membre d'une des équipes ou admin)
    const db = require('../config/database');
    const [match] = await db.execute(
      `SELECT m.*,
        EXISTS(
          SELECT 1 FROM team_members tm
          WHERE tm.user_id = ?
          AND tm.team_id IN (m.home_team_id, m.away_team_id)
          AND tm.is_active = true
        ) as is_team_member
       FROM matches m
       WHERE m.id = ?`,
      [req.user.id, matchId]
    );

    if (match.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Les admins ont toujours accès, sinon vérifier membership
    if (req.user.userType !== 'superadmin' && !match[0].is_team_member) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const participations = await getMatchParticipations(matchId);
    const status = await getMatchParticipationStatus(matchId);

    res.json({
      match: {
        id: match[0].id,
        homeTeamId: match[0].home_team_id,
        awayTeamId: match[0].away_team_id,
        matchDate: match[0].match_date,
        status: match[0].status,
        participationValidated: match[0].participation_validated
      },
      participations,
      summary: status
    });
  } catch (error) {
    console.error('Error fetching match participations:', error);
    res.status(500).json({ error: 'Failed to fetch match participations' });
  }
});

/**
 * GET /api/participations/match/:matchId/status
 * Récupère uniquement le statut des confirmations pour un match
 */
router.get('/match/:matchId/status', authenticateToken, async (req, res) => {
  try {
    const { matchId } = req.params;
    const status = await getMatchParticipationStatus(matchId);

    res.json(status);
  } catch (error) {
    console.error('Error fetching participation status:', error);
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

/**
 * POST /api/participations/match/:matchId/validate
 * Déclenche manuellement une validation du match (capitaines et admins seulement)
 */
router.post('/match/:matchId/validate', authenticateToken, async (req, res) => {
  try {
    const { matchId } = req.params;

    // Vérifier que l'utilisateur est capitaine d'une des équipes ou admin
    const [match] = await db.execute(
      `SELECT m.*,
        EXISTS(
          SELECT 1 FROM team_members tm
          WHERE tm.user_id = ?
          AND tm.team_id IN (m.home_team_id, m.away_team_id)
          AND tm.role = 'manager'
          AND tm.is_active = true
        ) as is_manager
       FROM matches m
       WHERE m.id = ?`,
      [req.user.id, matchId]
    );

    if (match.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    if (req.user.userType !== 'superadmin' && !match[0].is_manager) {
      return res.status(403).json({ error: 'Only managers or admins can validate' });
    }

    const result = await validateMatchParticipation(matchId);

    res.json({
      message: 'Match validation completed',
      ...result
    });
  } catch (error) {
    console.error('Error validating match:', error);
    res.status(500).json({ error: 'Failed to validate match' });
  }
});

/**
 * GET /api/participations/match/:matchId/manager-view
 * Vue détaillée des participations pour les managers d'équipe
 */
router.get('/match/:matchId/manager-view', authenticateToken, async (req, res) => {
  try {
    const { matchId } = req.params;

    // Vérifier que l'utilisateur est manager d'une des équipes
    const permission = await isMatchTeamManager(req.user.id, matchId);
    if (!permission.isManager) {
      return res.status(403).json({ error: 'Only team managers can view this information' });
    }

    const match = permission.match;

    // Récupérer toutes les participations avec détails des joueurs
    const [participations] = await db.execute(
      `SELECT
        mp.id as participation_id,
        mp.user_id,
        mp.team_id,
        mp.status as participation_status,
        mp.response_note,
        mp.responded_at,
        mp.notified_at,
        mp.created_at,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        t.name as team_name,
        tm.role as team_role,
        tm.position
      FROM match_participations mp
      JOIN users u ON mp.user_id = u.id
      JOIN teams t ON mp.team_id = t.id
      JOIN team_members tm ON (tm.user_id = mp.user_id AND tm.team_id = mp.team_id AND tm.is_active = true)
      WHERE mp.match_id = ?
      ORDER BY t.id, mp.status, u.last_name`,
      [matchId]
    );

    // Grouper par équipe et par statut
    const homeTeamParticipations = participations.filter(p => p.team_id === match.home_team_id);
    const awayTeamParticipations = participations.filter(p => p.team_id === match.away_team_id);

    const groupByStatus = (participations) => {
      return {
        confirmed: participations.filter(p => p.participation_status === 'confirmed'),
        pending: participations.filter(p => p.participation_status === 'pending'),
        declined: participations.filter(p => p.participation_status === 'declined'),
        maybe: participations.filter(p => p.participation_status === 'maybe'),
      };
    };

    const formatParticipation = (p) => ({
      participationId: p.participation_id,
      userId: p.user_id,
      firstName: p.first_name,
      lastName: p.last_name,
      email: p.email,
      phone: p.phone,
      teamRole: p.team_role,
      position: p.position,
      status: p.participation_status,
      responseNote: p.response_note,
      respondedAt: p.responded_at,
      notifiedAt: p.notified_at,
      createdAt: p.created_at,
    });

    const homeTeamStatus = groupByStatus(homeTeamParticipations);
    const awayTeamStatus = groupByStatus(awayTeamParticipations);

    res.json({
      success: true,
      match: {
        id: match.id,
        matchDate: match.match_date,
        status: match.status,
        homeTeamId: match.home_team_id,
        awayTeamId: match.away_team_id,
      },
      userTeamId: permission.teamId,
      homeTeam: {
        teamId: match.home_team_id,
        total: homeTeamParticipations.length,
        confirmed: homeTeamStatus.confirmed.length,
        pending: homeTeamStatus.pending.length,
        declined: homeTeamStatus.declined.length,
        maybe: homeTeamStatus.maybe.length,
        participations: {
          confirmed: homeTeamStatus.confirmed.map(formatParticipation),
          pending: homeTeamStatus.pending.map(formatParticipation),
          declined: homeTeamStatus.declined.map(formatParticipation),
          maybe: homeTeamStatus.maybe.map(formatParticipation),
        }
      },
      awayTeam: {
        teamId: match.away_team_id,
        total: awayTeamParticipations.length,
        confirmed: awayTeamStatus.confirmed.length,
        pending: awayTeamStatus.pending.length,
        declined: awayTeamStatus.declined.length,
        maybe: awayTeamStatus.maybe.length,
        participations: {
          confirmed: awayTeamStatus.confirmed.map(formatParticipation),
          pending: awayTeamStatus.pending.map(formatParticipation),
          declined: awayTeamStatus.declined.map(formatParticipation),
          maybe: awayTeamStatus.maybe.map(formatParticipation),
        }
      }
    });
  } catch (error) {
    console.error('Error fetching manager view:', error);
    res.status(500).json({ error: 'Failed to fetch manager view' });
  }
});

/**
 * POST /api/participations/match/:matchId/remind
 * Envoyer une relance aux joueurs qui n'ont pas encore confirmé
 */
router.post(
  '/match/:matchId/remind',
  [
    authenticateToken,
    body('userIds').optional().isArray().withMessage('userIds must be an array'),
    body('message').optional().trim().isLength({ max: 500 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { matchId } = req.params;
      const { userIds, message } = req.body;

      // Vérifier que l'utilisateur est manager d'une des équipes
      const permission = await isMatchTeamManager(req.user.id, matchId);
      if (!permission.isManager) {
        return res.status(403).json({ error: 'Only team managers can send reminders' });
      }

      const match = permission.match;

      // Si userIds est fourni, relancer uniquement ces joueurs, sinon tous les pending de l'équipe du manager
      let query = `
        SELECT mp.id, mp.user_id, mp.team_id, mp.notified_at,
               u.first_name, u.last_name, u.email,
               t.name as team_name
        FROM match_participations mp
        JOIN users u ON mp.user_id = u.id
        JOIN teams t ON mp.team_id = t.id
        WHERE mp.match_id = ?
        AND mp.status = 'pending'
        AND mp.team_id = ?
      `;

      const queryParams = [matchId, permission.teamId];

      if (userIds && userIds.length > 0) {
        const placeholders = userIds.map(() => '?').join(',');
        query += ` AND mp.user_id IN (${placeholders})`;
        queryParams.push(...userIds);
      }

      const [pendingParticipations] = await db.execute(query, queryParams);

      if (pendingParticipations.length === 0) {
        return res.json({
          success: true,
          message: 'No pending confirmations to remind',
          remindedCount: 0
        });
      }

      // Envoyer les notifications
      const customMessage = message || `Merci de confirmer votre participation au match du ${new Date(match.match_date).toLocaleString('fr-FR')}`;

      for (const participation of pendingParticipations) {
        await NotificationService.createNotification({
          userId: participation.user_id,
          type: 'match_participation_reminder',
          title: 'Rappel : Confirmez votre participation',
          message: customMessage,
          relatedId: matchId,
          relatedType: 'match',
        });

        // Mettre à jour la date de dernière notification
        await db.execute(
          'UPDATE match_participations SET notified_at = NOW() WHERE id = ?',
          [participation.id]
        );
      }

      res.json({
        success: true,
        message: `Reminder sent to ${pendingParticipations.length} player(s)`,
        remindedCount: pendingParticipations.length,
        remindedPlayers: pendingParticipations.map(p => ({
          userId: p.user_id,
          firstName: p.first_name,
          lastName: p.last_name,
        }))
      });
    } catch (error) {
      console.error('Error sending reminders:', error);
      res.status(500).json({ error: 'Failed to send reminders' });
    }
  }
);

module.exports = router;
