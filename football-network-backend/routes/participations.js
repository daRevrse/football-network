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
    const db = require('../config/database');
    const [match] = await db.execute(
      `SELECT m.*,
        EXISTS(
          SELECT 1 FROM team_members tm
          WHERE tm.user_id = ?
          AND tm.team_id IN (m.home_team_id, m.away_team_id)
          AND tm.role = 'captain'
          AND tm.is_active = true
        ) as is_captain
       FROM matches m
       WHERE m.id = ?`,
      [req.user.id, matchId]
    );

    if (match.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    if (req.user.userType !== 'superadmin' && !match[0].is_captain) {
      return res.status(403).json({ error: 'Only captains or admins can validate' });
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

module.exports = router;
