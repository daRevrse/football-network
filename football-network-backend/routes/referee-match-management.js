const express = require("express");
const { body, validationResult } = require("express-validator");
const db = require("../config/database");
const { authenticateToken } = require("../middleware/auth");
const NotificationService = require("../services/NotificationService");
const MatchValidationService = require("../services/MatchValidationService");

const router = express.Router();

/**
 * GET /api/referee/my-matches
 * Récupérer les matchs assignés à l'arbitre connecté
 */
router.get("/my-matches", authenticateToken, async (req, res) => {
  try {
    const { status, upcoming = false, limit = 20, offset = 0 } = req.query;

    // Récupérer l'ID arbitre de l'utilisateur
    const [refereeData] = await db.execute(
      "SELECT id FROM referees WHERE user_id = ? AND is_active = true",
      [req.user.id]
    );

    if (refereeData.length === 0) {
      return res.status(403).json({ error: "You are not registered as a referee" });
    }

    const refereeId = refereeData[0].id;

    let query = `
      SELECT
        m.id,
        m.match_date,
        m.duration_minutes,
        m.status,
        m.home_score,
        m.away_score,
        m.is_referee_verified,
        ht.id as home_team_id,
        ht.name as home_team_name,
        ht.logo_id as home_team_logo_id,
        home_logo.stored_filename as home_team_logo_filename,
        at.id as away_team_id,
        at.name as away_team_name,
        at.logo_id as away_team_logo_id,
        away_logo.stored_filename as away_team_logo_filename,
        l.id as location_id,
        l.name as location_name,
        l.address as location_address,
        l.city,
        ra.id as assignment_id,
        ra.role as referee_role,
        ra.status as assignment_status,
        ra.fee
      FROM match_referee_assignments ra
      JOIN matches m ON ra.match_id = m.id
      JOIN teams ht ON m.home_team_id = ht.id
      LEFT JOIN uploads home_logo ON ht.logo_id = home_logo.id AND home_logo.is_active = true
      LEFT JOIN teams at ON m.away_team_id = at.id
      LEFT JOIN uploads away_logo ON at.logo_id = away_logo.id AND away_logo.is_active = true
      LEFT JOIN locations l ON m.location_id = l.id
      WHERE ra.referee_id = ?
    `;

    const queryParams = [refereeId];

    if (status) {
      query += " AND m.status = ?";
      queryParams.push(status);
    }

    if (upcoming === "true") {
      query += " AND m.match_date > NOW()";
    }

    query += " ORDER BY m.match_date ASC LIMIT ? OFFSET ?";
    queryParams.push(parseInt(limit), parseInt(offset));

    const [matches] = await db.execute(query, queryParams);

    const formattedMatches = matches.map((m) => ({
      id: m.id,
      matchDate: m.match_date,
      duration: m.duration_minutes,
      status: m.status,
      score: {
        home: m.home_score,
        away: m.away_score,
      },
      isRefereeVerified: !!m.is_referee_verified,
      homeTeam: {
        id: m.home_team_id,
        name: m.home_team_name,
        logoUrl: m.home_team_logo_filename
          ? `/uploads/teams/${m.home_team_logo_filename}`
          : null,
      },
      awayTeam: m.away_team_id
        ? {
            id: m.away_team_id,
            name: m.away_team_name,
            logoUrl: m.away_team_logo_filename
              ? `/uploads/teams/${m.away_team_logo_filename}`
              : null,
          }
        : null,
      location: m.location_id
        ? {
            id: m.location_id,
            name: m.location_name,
            address: m.location_address,
            city: m.city,
          }
        : null,
      assignment: {
        id: m.assignment_id,
        role: m.referee_role,
        status: m.assignment_status,
        fee: m.fee,
      },
    }));

    res.json({ success: true, matches: formattedMatches });
  } catch (error) {
    console.error("Get referee matches error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/referee/matches/:matchId/start
 * L'arbitre démarre le match
 */
router.post("/:matchId/start", authenticateToken, async (req, res) => {
  try {
    const { matchId } = req.params;

    // Vérifier que l'utilisateur est arbitre assigné au match
    const [refereeData] = await db.execute(
      "SELECT id FROM referees WHERE user_id = ? AND is_active = true",
      [req.user.id]
    );

    if (refereeData.length === 0) {
      return res.status(403).json({ error: "You are not registered as a referee" });
    }

    const refereeId = refereeData[0].id;

    // Vérifier l'assignation
    const [assignment] = await db.execute(
      `SELECT id FROM match_referee_assignments
       WHERE match_id = ? AND referee_id = ? AND status = 'confirmed'`,
      [matchId, refereeId]
    );

    if (assignment.length === 0) {
      return res.status(403).json({ error: "You are not assigned to this match" });
    }

    // Vérifier le statut du match
    const [matches] = await db.execute(
      "SELECT status FROM matches WHERE id = ?",
      [matchId]
    );

    if (matches.length === 0) {
      return res.status(404).json({ error: "Match not found" });
    }

    if (matches[0].status !== "confirmed") {
      return res.status(400).json({ error: "Match must be confirmed before starting" });
    }

    // Démarrer le match
    await db.execute(
      `UPDATE matches
       SET status = 'in_progress',
           started_at = NOW(),
           started_by_referee = true
       WHERE id = ?`,
      [matchId]
    );

    res.json({
      success: true,
      message: "Match started successfully by referee",
    });
  } catch (error) {
    console.error("Referee start match error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/referee/matches/:matchId/validate-score
 * L'arbitre valide et certifie le score final
 */
router.post(
  "/:matchId/validate-score",
  [
    authenticateToken,
    body("homeScore").isInt({ min: 0 }).withMessage("Home score required"),
    body("awayScore").isInt({ min: 0 }).withMessage("Away score required"),
    body("notes").optional().trim().isLength({ max: 1000 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { matchId } = req.params;
      const { homeScore, awayScore, notes } = req.body;

      // Vérifier que l'utilisateur est arbitre assigné au match
      const [refereeData] = await db.execute(
        "SELECT id FROM referees WHERE user_id = ? AND is_active = true",
        [req.user.id]
      );

      if (refereeData.length === 0) {
        return res.status(403).json({ error: "You are not registered as a referee" });
      }

      const refereeId = refereeData[0].id;

      // Vérifier l'assignation
      const [assignment] = await db.execute(
        `SELECT id FROM match_referee_assignments
         WHERE match_id = ? AND referee_id = ? AND status = 'confirmed'`,
        [matchId, refereeId]
      );

      if (assignment.length === 0) {
        return res.status(403).json({ error: "You are not assigned to this match" });
      }

      // Récupérer le match
      const [matches] = await db.execute(
        `SELECT m.*,
                ht.captain_id as home_captain_id,
                ht.name as home_team_name,
                at.captain_id as away_captain_id,
                at.name as away_team_name
         FROM matches m
         JOIN teams ht ON m.home_team_id = ht.id
         LEFT JOIN teams at ON m.away_team_id = at.id
         WHERE m.id = ?`,
        [matchId]
      );

      if (matches.length === 0) {
        return res.status(404).json({ error: "Match not found" });
      }

      const match = matches[0];

      // Soumettre la validation via le service unifié
      const result = await MatchValidationService.submitValidation({
        matchId,
        validatorId: req.user.id,
        validatorRole: 'referee',
        homeScore,
        awayScore,
        notes
      });

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      // Retourner le résultat avec info sur le consensus
      res.json({
        success: true,
        message: result.consensus.hasConsensus
          ? "Score validated and certified by referee. Match finalized with consensus."
          : result.consensus.hasDispute
          ? "Your validation has been recorded. The match is disputed due to conflicting scores."
          : "Your validation has been recorded. Waiting for team managers to validate.",
        validationId: result.validationId,
        score: { home: homeScore, away: awayScore },
        consensus: {
          hasConsensus: result.consensus.hasConsensus,
          hasDispute: result.consensus.hasDispute,
          validationsCount: result.consensus.validationsCount,
          agreedScore: result.consensus.agreedScore
        }
      });
    } catch (error) {
      console.error("Referee validate score error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * POST /api/referee/matches/:matchId/report-incident
 * L'arbitre rapporte un incident pendant le match
 */
router.post(
  "/:matchId/report-incident",
  [
    authenticateToken,
    body("incidentType")
      .isIn(["yellow_card", "red_card", "injury", "misconduct", "other"])
      .withMessage("Invalid incident type"),
    body("teamId").isInt().withMessage("Team ID required"),
    body("playerId").optional().isInt(),
    body("description").trim().isLength({ min: 10, max: 1000 }),
    body("minuteOccurred").optional().isInt({ min: 0, max: 180 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { matchId } = req.params;
      const { incidentType, teamId, playerId, description, minuteOccurred } = req.body;

      // Vérifier que l'utilisateur est arbitre assigné
      const [refereeData] = await db.execute(
        "SELECT id FROM referees WHERE user_id = ? AND is_active = true",
        [req.user.id]
      );

      if (refereeData.length === 0) {
        return res.status(403).json({ error: "You are not registered as a referee" });
      }

      const refereeId = refereeData[0].id;

      // Vérifier l'assignation
      const [assignment] = await db.execute(
        `SELECT id FROM match_referee_assignments
         WHERE match_id = ? AND referee_id = ? AND status = 'confirmed'`,
        [matchId, refereeId]
      );

      if (assignment.length === 0) {
        return res.status(403).json({ error: "You are not assigned to this match" });
      }

      // Créer le rapport d'incident
      const [result] = await db.execute(
        `INSERT INTO match_incidents
         (match_id, referee_id, team_id, player_id, incident_type, description, minute_occurred, reported_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [matchId, refereeId, teamId, playerId || null, incidentType, description, minuteOccurred || null]
      );

      res.status(201).json({
        success: true,
        message: "Incident reported successfully",
        incidentId: result.insertId,
      });
    } catch (error) {
      console.error("Report incident error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

module.exports = router;
