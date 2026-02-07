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
 * GET /api/referee/matches/:matchId/details
 * Détails complets du match pour l'arbitre assigné (incluant les rosters)
 */
router.get("/:matchId/details", authenticateToken, async (req, res) => {
  try {
    const { matchId } = req.params;

    // Vérifier que l'utilisateur est arbitre assigné
    const [refereeData] = await db.execute(
      "SELECT id FROM referees WHERE user_id = ? AND is_active = true",
      [req.user.id]
    );

    if (refereeData.length === 0) {
      return res.status(403).json({ error: "Vous n'êtes pas enregistré comme arbitre" });
    }

    const refereeId = refereeData[0].id;

    // Vérifier l'assignation
    const [assignment] = await db.execute(
      `SELECT id, role, status, fee FROM match_referee_assignments
       WHERE match_id = ? AND referee_id = ?`,
      [matchId, refereeId]
    );

    if (assignment.length === 0) {
      return res.status(403).json({ error: "Vous n'êtes pas assigné à ce match" });
    }

    // Récupérer les détails du match
    const [matches] = await db.execute(
      `SELECT
        m.*,
        ht.id as home_team_id, ht.name as home_team_name,
        at.id as away_team_id, at.name as away_team_name,
        l.name as location_name, l.address as location_address, l.city as location_city,
        home_logo.stored_filename as home_logo,
        away_logo.stored_filename as away_logo
       FROM matches m
       JOIN teams ht ON m.home_team_id = ht.id
       LEFT JOIN teams at ON m.away_team_id = at.id
       LEFT JOIN locations l ON m.location_id = l.id
       LEFT JOIN uploads home_logo ON ht.logo_id = home_logo.id
       LEFT JOIN uploads away_logo ON at.logo_id = away_logo.id
       WHERE m.id = ?`,
      [matchId]
    );

    if (matches.length === 0) {
      return res.status(404).json({ error: "Match non trouvé" });
    }

    const match = matches[0];

    // Récupérer les rosters des deux équipes avec dossards
    const [homeRoster] = await db.execute(
      `SELECT
        u.id, u.first_name, u.last_name, u.position,
        tm.jersey_number, tm.is_captain, tm.role
       FROM team_members tm
       JOIN users u ON tm.user_id = u.id
       WHERE tm.team_id = ? AND tm.is_active = true AND u.user_type = 'player'
       ORDER BY tm.jersey_number ASC, u.first_name ASC`,
      [match.home_team_id]
    );

    const [awayRoster] = await db.execute(
      `SELECT
        u.id, u.first_name, u.last_name, u.position,
        tm.jersey_number, tm.is_captain, tm.role
       FROM team_members tm
       JOIN users u ON tm.user_id = u.id
       WHERE tm.team_id = ? AND tm.is_active = true AND u.user_type = 'player'
       ORDER BY tm.jersey_number ASC, u.first_name ASC`,
      [match.away_team_id]
    );

    // Récupérer les incidents existants
    const [incidents] = await db.execute(
      `SELECT * FROM match_incidents WHERE match_id = ? ORDER BY minute_occurred ASC`,
      [matchId]
    );

    // Récupérer les buts existants
    const [goals] = await db.execute(
      `SELECT mg.*, u.first_name as scorer_first_name, u.last_name as scorer_last_name
       FROM match_goals mg
       LEFT JOIN users u ON mg.scorer_id = u.id
       WHERE mg.match_id = ?
       ORDER BY mg.minute_scored ASC`,
      [matchId]
    );

    res.json({
      success: true,
      match: {
        id: match.id,
        date: match.match_date,
        duration: match.duration_minutes,
        status: match.status,
        score: { home: match.home_score, away: match.away_score },
        location: match.location_id ? {
          name: match.location_name,
          address: match.location_address,
          city: match.location_city
        } : null
      },
      homeTeam: {
        id: match.home_team_id,
        name: match.home_team_name,
        logoUrl: match.home_logo ? `/uploads/teams/${match.home_logo}` : null,
        roster: homeRoster.map(p => ({
          id: p.id,
          firstName: p.first_name,
          lastName: p.last_name,
          position: p.position,
          jerseyNumber: p.jersey_number,
          isCaptain: p.is_captain === 1
        }))
      },
      awayTeam: match.away_team_id ? {
        id: match.away_team_id,
        name: match.away_team_name,
        logoUrl: match.away_logo ? `/uploads/teams/${match.away_logo}` : null,
        roster: awayRoster.map(p => ({
          id: p.id,
          firstName: p.first_name,
          lastName: p.last_name,
          position: p.position,
          jerseyNumber: p.jersey_number,
          isCaptain: p.is_captain === 1
        }))
      } : null,
      assignment: assignment[0],
      incidents: incidents.map(i => ({
        id: i.id,
        type: i.incident_type,
        teamId: i.team_id,
        playerId: i.player_id,
        minute: i.minute_occurred,
        description: i.description
      })),
      goals: goals.map(g => ({
        id: g.id,
        teamId: g.team_id,
        scorerId: g.scorer_id,
        scorerName: g.scorer_first_name ? `${g.scorer_first_name} ${g.scorer_last_name}` : null,
        assisterId: g.assister_id,
        minute: g.minute_scored,
        type: g.goal_type
      }))
    });
  } catch (error) {
    console.error("Get match details error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * GET /api/referee/matches/:matchId/match-sheet
 * Fiche de match imprimable avec les deux rosters
 */
router.get("/:matchId/match-sheet", authenticateToken, async (req, res) => {
  try {
    const { matchId } = req.params;

    // Vérifier que l'utilisateur est arbitre assigné
    const [refereeData] = await db.execute(
      `SELECT r.id, r.first_name, r.last_name, r.license_number, r.license_level
       FROM referees r
       WHERE r.user_id = ? AND r.is_active = true`,
      [req.user.id]
    );

    if (refereeData.length === 0) {
      return res.status(403).json({ error: "Vous n'êtes pas enregistré comme arbitre" });
    }

    const referee = refereeData[0];

    // Vérifier l'assignation
    const [assignment] = await db.execute(
      `SELECT id FROM match_referee_assignments
       WHERE match_id = ? AND referee_id = ?`,
      [matchId, referee.id]
    );

    if (assignment.length === 0) {
      return res.status(403).json({ error: "Vous n'êtes pas assigné à ce match" });
    }

    // Récupérer les détails du match
    const [matches] = await db.execute(
      `SELECT
        m.*,
        ht.id as home_team_id, ht.name as home_team_name,
        at.id as away_team_id, at.name as away_team_name,
        l.name as location_name, l.address as location_address, l.city as location_city
       FROM matches m
       JOIN teams ht ON m.home_team_id = ht.id
       LEFT JOIN teams at ON m.away_team_id = at.id
       LEFT JOIN locations l ON m.location_id = l.id
       WHERE m.id = ?`,
      [matchId]
    );

    if (matches.length === 0) {
      return res.status(404).json({ error: "Match non trouvé" });
    }

    const match = matches[0];

    // Récupérer les rosters
    const [homeRoster] = await db.execute(
      `SELECT u.first_name, u.last_name, u.position, tm.jersey_number, tm.is_captain
       FROM team_members tm
       JOIN users u ON tm.user_id = u.id
       WHERE tm.team_id = ? AND tm.is_active = true AND u.user_type = 'player'
       ORDER BY tm.jersey_number ASC`,
      [match.home_team_id]
    );

    const [awayRoster] = await db.execute(
      `SELECT u.first_name, u.last_name, u.position, tm.jersey_number, tm.is_captain
       FROM team_members tm
       JOIN users u ON tm.user_id = u.id
       WHERE tm.team_id = ? AND tm.is_active = true AND u.user_type = 'player'
       ORDER BY tm.jersey_number ASC`,
      [match.away_team_id]
    );

    // Formater pour impression
    res.json({
      success: true,
      matchSheet: {
        title: "FICHE DE MATCH",
        generatedAt: new Date().toISOString(),
        match: {
          id: match.id,
          date: match.match_date,
          location: match.location_name ? `${match.location_name}, ${match.location_address}, ${match.location_city}` : "Non défini"
        },
        referee: {
          name: `${referee.first_name} ${referee.last_name}`,
          license: referee.license_number,
          level: referee.license_level
        },
        homeTeam: {
          name: match.home_team_name,
          players: homeRoster.map(p => ({
            jerseyNumber: p.jersey_number || '-',
            name: `${p.first_name} ${p.last_name}`,
            position: p.position || '-',
            isCaptain: p.is_captain === 1
          }))
        },
        awayTeam: {
          name: match.away_team_name,
          players: awayRoster.map(p => ({
            jerseyNumber: p.jersey_number || '-',
            name: `${p.first_name} ${p.last_name}`,
            position: p.position || '-',
            isCaptain: p.is_captain === 1
          }))
        },
        scoreSection: {
          homeScore: "____",
          awayScore: "____",
          refereeSignature: "____________________",
          homeManagerSignature: "____________________",
          awayManagerSignature: "____________________"
        }
      }
    });
  } catch (error) {
    console.error("Get match sheet error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * POST /api/referee/matches/:matchId/report
 * Créer ou mettre à jour le rapport de match
 */
router.post(
  "/:matchId/report",
  [
    authenticateToken,
    body("homeScore").isInt({ min: 0 }).withMessage("Score domicile requis"),
    body("awayScore").isInt({ min: 0 }).withMessage("Score extérieur requis"),
    body("matchSummary").optional().trim().isLength({ max: 2000 }),
    body("weatherConditions").optional().trim(),
    body("pitchConditions").optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { matchId } = req.params;
      const { homeScore, awayScore, matchSummary, weatherConditions, pitchConditions } = req.body;

      // Vérifier que l'utilisateur est arbitre assigné
      const [refereeData] = await db.execute(
        "SELECT id FROM referees WHERE user_id = ? AND is_active = true",
        [req.user.id]
      );

      if (refereeData.length === 0) {
        return res.status(403).json({ error: "Vous n'êtes pas enregistré comme arbitre" });
      }

      const refereeId = refereeData[0].id;

      // Vérifier l'assignation
      const [assignment] = await db.execute(
        `SELECT id FROM match_referee_assignments
         WHERE match_id = ? AND referee_id = ? AND status = 'confirmed'`,
        [matchId, refereeId]
      );

      if (assignment.length === 0) {
        return res.status(403).json({ error: "Vous n'êtes pas assigné à ce match" });
      }

      // Vérifier si un rapport existe déjà
      const [existingReport] = await db.execute(
        "SELECT id, status FROM match_reports WHERE match_id = ?",
        [matchId]
      );

      let reportId;
      if (existingReport.length > 0) {
        if (existingReport[0].status === 'validated') {
          return res.status(400).json({ error: "Le rapport a déjà été validé et ne peut plus être modifié" });
        }
        // Mettre à jour
        await db.execute(
          `UPDATE match_reports
           SET home_score = ?, away_score = ?, match_summary = ?,
               weather_conditions = ?, pitch_conditions = ?, updated_at = NOW()
           WHERE id = ?`,
          [homeScore, awayScore, matchSummary, weatherConditions, pitchConditions, existingReport[0].id]
        );
        reportId = existingReport[0].id;
      } else {
        // Créer
        const [result] = await db.execute(
          `INSERT INTO match_reports
           (match_id, referee_id, home_score, away_score, match_summary, weather_conditions, pitch_conditions, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')`,
          [matchId, refereeId, homeScore, awayScore, matchSummary, weatherConditions, pitchConditions]
        );
        reportId = result.insertId;
      }

      res.json({
        success: true,
        message: "Rapport de match enregistré",
        reportId,
        status: "draft"
      });
    } catch (error) {
      console.error("Save match report error:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

/**
 * POST /api/referee/matches/:matchId/submit-report
 * Soumettre le rapport final (ne peut plus être modifié ensuite)
 */
router.post("/:matchId/submit-report", authenticateToken, async (req, res) => {
  try {
    const { matchId } = req.params;

    // Vérifier que l'utilisateur est arbitre assigné
    const [refereeData] = await db.execute(
      "SELECT id FROM referees WHERE user_id = ? AND is_active = true",
      [req.user.id]
    );

    if (refereeData.length === 0) {
      return res.status(403).json({ error: "Vous n'êtes pas enregistré comme arbitre" });
    }

    const refereeId = refereeData[0].id;

    // Vérifier le rapport existe
    const [report] = await db.execute(
      "SELECT id, status, home_score, away_score FROM match_reports WHERE match_id = ? AND referee_id = ?",
      [matchId, refereeId]
    );

    if (report.length === 0) {
      return res.status(404).json({ error: "Aucun rapport trouvé. Créez d'abord un rapport." });
    }

    if (report[0].status !== 'draft') {
      return res.status(400).json({ error: "Le rapport a déjà été soumis" });
    }

    // Soumettre le rapport
    await db.execute(
      `UPDATE match_reports SET status = 'submitted', submitted_at = NOW() WHERE id = ?`,
      [report[0].id]
    );

    // Mettre à jour le score du match
    await db.execute(
      `UPDATE matches SET home_score = ?, away_score = ?, is_referee_verified = true WHERE id = ?`,
      [report[0].home_score, report[0].away_score, matchId]
    );

    res.json({
      success: true,
      message: "Rapport de match soumis avec succès",
      score: { home: report[0].home_score, away: report[0].away_score }
    });
  } catch (error) {
    console.error("Submit match report error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * POST /api/referee/matches/:matchId/goals
 * Enregistrer un but
 */
router.post(
  "/:matchId/goals",
  [
    authenticateToken,
    body("teamId").isInt().withMessage("ID équipe requis"),
    body("scorerId").optional().isInt(),
    body("assisterId").optional().isInt(),
    body("minuteScored").isInt({ min: 1, max: 120 }).withMessage("Minute requise (1-120)"),
    body("goalType").optional().isIn(['regular', 'penalty', 'own_goal', 'free_kick', 'header'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { matchId } = req.params;
      const { teamId, scorerId, assisterId, minuteScored, goalType = 'regular', notes } = req.body;

      // Vérifier que l'utilisateur est arbitre assigné
      const [refereeData] = await db.execute(
        "SELECT id FROM referees WHERE user_id = ? AND is_active = true",
        [req.user.id]
      );

      if (refereeData.length === 0) {
        return res.status(403).json({ error: "Vous n'êtes pas enregistré comme arbitre" });
      }

      const refereeId = refereeData[0].id;

      // Vérifier l'assignation
      const [assignment] = await db.execute(
        `SELECT id FROM match_referee_assignments
         WHERE match_id = ? AND referee_id = ?`,
        [matchId, refereeId]
      );

      if (assignment.length === 0) {
        return res.status(403).json({ error: "Vous n'êtes pas assigné à ce match" });
      }

      // Enregistrer le but
      const [result] = await db.execute(
        `INSERT INTO match_goals
         (match_id, team_id, scorer_id, assister_id, minute_scored, goal_type, notes, recorded_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [matchId, teamId, scorerId || null, assisterId || null, minuteScored, goalType, notes || null, req.user.id]
      );

      res.status(201).json({
        success: true,
        message: "But enregistré",
        goalId: result.insertId
      });
    } catch (error) {
      console.error("Record goal error:", error);
      res.status(500).json({ error: "Erreur serveur" });
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
