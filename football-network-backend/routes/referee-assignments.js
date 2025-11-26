const express = require("express");
const { body, validationResult } = require("express-validator");
const db = require("../config/database");
const { authenticateToken, requireManager } = require("../middleware/auth");
const NotificationService = require("../services/NotificationService");

const router = express.Router();

/**
 * POST /api/referee-assignments
 * Assigner un arbitre à un match
 */
router.post(
  "/",
  [
    authenticateToken,
    requireManager,
    body("matchId").isInt().withMessage("Match ID required"),
    body("refereeId").isInt().withMessage("Referee ID required"),
    body("role").optional().isIn(['main', 'assistant_1', 'assistant_2', 'fourth_official']),
    body("fee").optional().isFloat({ min: 0 }),
    body("notes").optional().trim().isLength({ max: 500 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { matchId, refereeId, role = 'main', fee, notes } = req.body;

      // Vérifier que le match existe et que l'utilisateur est capitaine
      const [matches] = await db.execute(
        `SELECT m.*, ht.captain_id as home_captain_id, at.captain_id as away_captain_id
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

      if (match.home_captain_id !== req.user.id && match.away_captain_id !== req.user.id) {
        return res.status(403).json({ error: "Only team captains can assign referees" });
      }

      // Vérifier que l'arbitre existe et est disponible
      const [referees] = await db.execute(
        "SELECT id, user_id, is_available FROM referees WHERE id = ? AND is_active = true",
        [refereeId]
      );

      if (referees.length === 0) {
        return res.status(404).json({ error: "Referee not found" });
      }

      if (!referees[0].is_available) {
        return res.status(400).json({ error: "Referee is not available" });
      }

      // Vérifier qu'il n'y a pas déjà une assignation pour ce rôle
      const [existing] = await db.execute(
        `SELECT id FROM match_referee_assignments
         WHERE match_id = ? AND role = ? AND status IN ('pending', 'confirmed')`,
        [matchId, role]
      );

      if (existing.length > 0) {
        return res.status(409).json({ error: `A referee is already assigned as ${role} for this match` });
      }

      // Vérifier la disponibilité de l'arbitre pour cette date
      const matchDate = new Date(match.match_date).toISOString().split('T')[0];
      const [availability] = await db.execute(
        `SELECT is_available FROM referee_availability
         WHERE referee_id = ? AND date = ?`,
        [refereeId, matchDate]
      );

      if (availability.length > 0 && !availability[0].is_available) {
        return res.status(400).json({ error: "Referee is not available on this date" });
      }

      // Créer l'assignation
      const [result] = await db.execute(
        `INSERT INTO match_referee_assignments
         (match_id, referee_id, role, assigned_by, fee, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [matchId, refereeId, role, req.user.id, fee || null, notes || null]
      );

      // Mettre à jour le match
      await db.execute(
        "UPDATE matches SET has_referee = true WHERE id = ?",
        [matchId]
      );

      // Notifier l'arbitre
      if (referees[0].user_id) {
        await NotificationService.createNotification({
          userId: referees[0].user_id,
          type: "referee_assignment",
          title: "Nouvelle assignation",
          message: `Vous avez été assigné comme ${role} pour un match`,
          relatedId: matchId,
          relatedType: "match"
        });
      }

      res.status(201).json({
        success: true,
        message: "Referee assigned successfully",
        assignmentId: result.insertId
      });
    } catch (error) {
      console.error("Assign referee error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * GET /api/referee-assignments/match/:matchId
 * Récupérer les arbitres assignés à un match
 */
router.get("/match/:matchId", authenticateToken, async (req, res) => {
  try {
    const matchId = req.params.matchId;

    const [assignments] = await db.execute(
      `SELECT
        mra.*,
        r.first_name,
        r.last_name,
        r.email,
        r.phone,
        r.license_level,
        r.rating,
        photo.stored_filename as photo_filename
      FROM match_referee_assignments mra
      JOIN referees r ON mra.referee_id = r.id
      LEFT JOIN uploads photo ON r.profile_picture_id = photo.id AND photo.is_active = true
      WHERE mra.match_id = ?
      ORDER BY
        CASE mra.role
          WHEN 'main' THEN 1
          WHEN 'assistant_1' THEN 2
          WHEN 'assistant_2' THEN 3
          WHEN 'fourth_official' THEN 4
        END`,
      [matchId]
    );

    const formattedAssignments = assignments.map(a => ({
      id: a.id,
      referee: {
        id: a.referee_id,
        firstName: a.first_name,
        lastName: a.last_name,
        email: a.email,
        phone: a.phone,
        licenseLevel: a.license_level,
        rating: parseFloat(a.rating) || 0,
        photoUrl: a.photo_filename ? `/uploads/referees/${a.photo_filename}` : null
      },
      role: a.role,
      status: a.status,
      assignedAt: a.assigned_at,
      confirmedAt: a.confirmed_at,
      declinedAt: a.declined_at,
      declineReason: a.decline_reason,
      fee: a.fee ? parseFloat(a.fee) : null,
      paymentStatus: a.payment_status,
      notes: a.notes
    }));

    res.json({
      success: true,
      assignments: formattedAssignments
    });
  } catch (error) {
    console.error("Get match referees error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/referee-assignments/referee/:refereeId
 * Récupérer les assignations d'un arbitre
 */
router.get("/referee/:refereeId", async (req, res) => {
  try {
    const refereeId = req.params.refereeId;
    const { status, upcoming, limit = 20, offset = 0 } = req.query;

    let query = `
      SELECT
        mra.*,
        m.match_date,
        m.status as match_status,
        ht.name as home_team_name,
        at.name as away_team_name,
        l.name as location_name,
        l.city as location_city
      FROM match_referee_assignments mra
      JOIN matches m ON mra.match_id = m.id
      JOIN teams ht ON m.home_team_id = ht.id
      LEFT JOIN teams at ON m.away_team_id = at.id
      LEFT JOIN locations l ON m.location_id = l.id
      WHERE mra.referee_id = ?
    `;

    const queryParams = [refereeId];

    if (status) {
      query += " AND mra.status = ?";
      queryParams.push(status);
    }

    if (upcoming === 'true') {
      query += " AND m.match_date >= CURDATE()";
    }

    query += " ORDER BY m.match_date DESC LIMIT ? OFFSET ?";
    queryParams.push(parseInt(limit), parseInt(offset));

    const [assignments] = await db.execute(query, queryParams);

    const formattedAssignments = assignments.map(a => ({
      id: a.id,
      match: {
        id: a.match_id,
        date: a.match_date,
        status: a.match_status,
        homeTeam: a.home_team_name,
        awayTeam: a.away_team_name,
        location: a.location_name ? {
          name: a.location_name,
          city: a.location_city
        } : null
      },
      role: a.role,
      status: a.status,
      assignedAt: a.assigned_at,
      confirmedAt: a.confirmed_at,
      declinedAt: a.declined_at,
      declineReason: a.decline_reason,
      fee: a.fee ? parseFloat(a.fee) : null,
      paymentStatus: a.payment_status
    }));

    res.json({
      success: true,
      count: formattedAssignments.length,
      assignments: formattedAssignments
    });
  } catch (error) {
    console.error("Get referee assignments error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /api/referee-assignments/:id/confirm
 * Arbitre confirme son assignation
 */
router.patch("/:id/confirm", authenticateToken, async (req, res) => {
  try {
    const assignmentId = req.params.id;

    // Vérifier que l'assignation existe et appartient à l'utilisateur
    const [assignments] = await db.execute(
      `SELECT mra.*, r.user_id
       FROM match_referee_assignments mra
       JOIN referees r ON mra.referee_id = r.id
       WHERE mra.id = ?`,
      [assignmentId]
    );

    if (assignments.length === 0) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    const assignment = assignments[0];

    if (assignment.user_id !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (assignment.status !== 'pending') {
      return res.status(400).json({ error: "Only pending assignments can be confirmed" });
    }

    await db.execute(
      `UPDATE match_referee_assignments
       SET status = 'confirmed', confirmed_at = NOW()
       WHERE id = ?`,
      [assignmentId]
    );

    // Notifier les capitaines
    const [match] = await db.execute(
      `SELECT m.id, ht.captain_id as home_captain_id, at.captain_id as away_captain_id
       FROM matches m
       JOIN teams ht ON m.home_team_id = ht.id
       LEFT JOIN teams at ON m.away_team_id = at.id
       WHERE m.id = ?`,
      [assignment.match_id]
    );

    if (match.length > 0) {
      await NotificationService.createNotification({
        userId: match[0].home_captain_id,
        type: "referee_confirmed",
        title: "Arbitre confirmé",
        message: "L'arbitre a confirmé sa présence pour le match",
        relatedId: assignment.match_id,
        relatedType: "match"
      });

      if (match[0].away_captain_id) {
        await NotificationService.createNotification({
          userId: match[0].away_captain_id,
          type: "referee_confirmed",
          title: "Arbitre confirmé",
          message: "L'arbitre a confirmé sa présence pour le match",
          relatedId: assignment.match_id,
          relatedType: "match"
        });
      }
    }

    res.json({
      success: true,
      message: "Assignment confirmed successfully"
    });
  } catch (error) {
    console.error("Confirm assignment error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /api/referee-assignments/:id/decline
 * Arbitre décline son assignation
 */
router.patch(
  "/:id/decline",
  [
    authenticateToken,
    body("reason").trim().isLength({ min: 10, max: 500 }).withMessage("Decline reason required")
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const assignmentId = req.params.id;
      const { reason } = req.body;

      // Vérifier que l'assignation existe et appartient à l'utilisateur
      const [assignments] = await db.execute(
        `SELECT mra.*, r.user_id
         FROM match_referee_assignments mra
         JOIN referees r ON mra.referee_id = r.id
         WHERE mra.id = ?`,
        [assignmentId]
      );

      if (assignments.length === 0) {
        return res.status(404).json({ error: "Assignment not found" });
      }

      const assignment = assignments[0];

      if (assignment.user_id !== req.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (assignment.status === 'completed') {
        return res.status(400).json({ error: "Cannot decline completed assignment" });
      }

      await db.execute(
        `UPDATE match_referee_assignments
         SET status = 'declined', declined_at = NOW(), decline_reason = ?
         WHERE id = ?`,
        [reason, assignmentId]
      );

      // Vérifier s'il n'y a plus d'arbitres confirmés pour ce match
      const [remainingReferees] = await db.execute(
        `SELECT COUNT(*) as count
         FROM match_referee_assignments
         WHERE match_id = ? AND status IN ('pending', 'confirmed')`,
        [assignment.match_id]
      );

      if (remainingReferees[0].count === 0) {
        await db.execute(
          "UPDATE matches SET has_referee = false WHERE id = ?",
          [assignment.match_id]
        );
      }

      // Notifier les capitaines
      const [match] = await db.execute(
        `SELECT m.id, ht.captain_id as home_captain_id, at.captain_id as away_captain_id
         FROM matches m
         JOIN teams ht ON m.home_team_id = ht.id
         LEFT JOIN teams at ON m.away_team_id = at.id
         WHERE m.id = ?`,
        [assignment.match_id]
      );

      if (match.length > 0) {
        await NotificationService.createNotification({
          userId: match[0].home_captain_id,
          type: "referee_declined",
          title: "Arbitre indisponible",
          message: `L'arbitre a décliné l'assignation. Raison: ${reason}`,
          relatedId: assignment.match_id,
          relatedType: "match"
        });

        if (match[0].away_captain_id) {
          await NotificationService.createNotification({
            userId: match[0].away_captain_id,
            type: "referee_declined",
            title: "Arbitre indisponible",
            message: `L'arbitre a décliné l'assignation. Raison: ${reason}`,
            relatedId: assignment.match_id,
            relatedType: "match"
          });
        }
      }

      res.json({
        success: true,
        message: "Assignment declined"
      });
    } catch (error) {
      console.error("Decline assignment error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * POST /api/referee-assignments/:id/rate
 * Noter un arbitre après un match
 */
router.post(
  "/:id/rate",
  [
    authenticateToken,
    requireManager,
    body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
    body("fairnessRating").optional().isInt({ min: 1, max: 5 }),
    body("communicationRating").optional().isInt({ min: 1, max: 5 }),
    body("professionalismRating").optional().isInt({ min: 1, max: 5 }),
    body("comment").optional().trim().isLength({ max: 1000 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const assignmentId = req.params.id;
      const {
        rating,
        fairnessRating,
        communicationRating,
        professionalismRating,
        comment
      } = req.body;

      // Vérifier que l'assignation existe et est terminée
      const [assignments] = await db.execute(
        `SELECT mra.*, m.home_team_id, m.away_team_id, ht.captain_id as home_captain_id, at.captain_id as away_captain_id
         FROM match_referee_assignments mra
         JOIN matches m ON mra.match_id = m.id
         JOIN teams ht ON m.home_team_id = ht.id
         LEFT JOIN teams at ON m.away_team_id = at.id
         WHERE mra.id = ?`,
        [assignmentId]
      );

      if (assignments.length === 0) {
        return res.status(404).json({ error: "Assignment not found" });
      }

      const assignment = assignments[0];

      if (assignment.status !== 'completed') {
        return res.status(400).json({ error: "Can only rate completed assignments" });
      }

      // Vérifier que l'utilisateur est capitaine d'une des équipes
      const isHomeCaptain = assignment.home_captain_id === req.user.id;
      const isAwayCaptain = assignment.away_captain_id === req.user.id;

      if (!isHomeCaptain && !isAwayCaptain) {
        return res.status(403).json({ error: "Only team captains can rate referees" });
      }

      const teamId = isHomeCaptain ? assignment.home_team_id : assignment.away_team_id;

      // Vérifier si déjà noté
      const [existing] = await db.execute(
        `SELECT id FROM referee_ratings WHERE assignment_id = ? AND team_id = ?`,
        [assignmentId, teamId]
      );

      if (existing.length > 0) {
        return res.status(400).json({ error: "You have already rated this referee" });
      }

      // Créer la notation
      await db.execute(
        `INSERT INTO referee_ratings
         (referee_id, match_id, assignment_id, rated_by, team_id, rating,
          fairness_rating, communication_rating, professionalism_rating, comment)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          assignment.referee_id,
          assignment.match_id,
          assignmentId,
          req.user.id,
          teamId,
          rating,
          fairnessRating || null,
          communicationRating || null,
          professionalismRating || null,
          comment || null
        ]
      );

      // Mettre à jour la note moyenne de l'arbitre
      const [avgRating] = await db.execute(
        `SELECT AVG(rating) as avg_rating, COUNT(*) as total
         FROM referee_ratings
         WHERE referee_id = ?`,
        [assignment.referee_id]
      );

      await db.execute(
        "UPDATE referees SET rating = ?, total_ratings = ? WHERE id = ?",
        [avgRating[0].avg_rating, avgRating[0].total, assignment.referee_id]
      );

      res.json({
        success: true,
        message: "Referee rated successfully",
        refereeNewRating: parseFloat(avgRating[0].avg_rating).toFixed(2)
      });
    } catch (error) {
      console.error("Rate referee error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * PATCH /api/referee-assignments/:id/complete
 * Marquer une assignation comme terminée
 */
router.patch("/:id/complete", authenticateToken, async (req, res) => {
  try {
    const assignmentId = req.params.id;

    const [assignments] = await db.execute(
      `SELECT mra.*, r.user_id, m.status as match_status
       FROM match_referee_assignments mra
       JOIN referees r ON mra.referee_id = r.id
       JOIN matches m ON mra.match_id = m.id
       WHERE mra.id = ?`,
      [assignmentId]
    );

    if (assignments.length === 0) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    const assignment = assignments[0];

    // Seul l'arbitre peut marquer comme terminé
    if (assignment.user_id !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (assignment.status !== 'confirmed') {
      return res.status(400).json({ error: "Only confirmed assignments can be completed" });
    }

    if (assignment.match_status !== 'completed') {
      return res.status(400).json({ error: "Match must be completed first" });
    }

    await db.execute(
      "UPDATE match_referee_assignments SET status = 'completed' WHERE id = ?",
      [assignmentId]
    );

    // Incrémenter le compteur de matchs de l'arbitre
    await db.execute(
      "UPDATE referees SET total_matches = total_matches + 1 WHERE id = ?",
      [assignment.referee_id]
    );

    res.json({
      success: true,
      message: "Assignment marked as completed"
    });
  } catch (error) {
    console.error("Complete assignment error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
