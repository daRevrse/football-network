const express = require("express");
const { body, validationResult } = require("express-validator");
const db = require("../config/database");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// POST /api/matches/invitations - Envoyer une invitation de match (CORRIGÉE)
router.post(
  "/invitations",
  [
    authenticateToken,
    body("senderTeamId").isInt().withMessage("Sender team ID is required"), // AJOUTÉ
    body("receiverTeamId").isInt().withMessage("Receiver team ID is required"),
    body("proposedDate").isISO8601().withMessage("Valid date is required"),
    body("proposedLocationId")
      .optional({ nullable: true, checkFalsy: true })
      .isInt(),
    body("message")
      .optional({ nullable: true, checkFalsy: true })
      .isLength({ max: 500 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        senderTeamId,
        receiverTeamId,
        proposedDate,
        proposedLocationId,
        message,
      } = req.body; // MODIFIÉ

      // Vérifier que l'utilisateur est capitaine de l'équipe spécifiée (MODIFIÉ)
      const [senderTeamCheck] = await db.execute(
        'SELECT team_id FROM team_members WHERE user_id = ? AND team_id = ? AND role = "captain" AND is_active = true',
        [req.user.id, senderTeamId]
      );

      if (senderTeamCheck.length === 0) {
        return res
          .status(403)
          .json({ error: "You are not the captain of this team" }); // MODIFIÉ
      }

      // Vérifier que l'équipe receveuse existe
      const [receiverTeams] = await db.execute(
        "SELECT id FROM teams WHERE id = ? AND is_active = true",
        [receiverTeamId]
      );

      if (receiverTeams.length === 0) {
        return res.status(404).json({ error: "Receiver team not found" });
      }

      // Vérifier qu'on n'envoie pas une invitation à sa propre équipe
      if (parseInt(senderTeamId) === parseInt(receiverTeamId)) {
        // MODIFIÉ
        return res.status(400).json({ error: "Cannot invite your own team" });
      }

      // Vérifier qu'il n'y a pas déjà une invitation en attente pour cette date
      const proposedDateTime = new Date(proposedDate);
      const dayStart = new Date(proposedDateTime);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(proposedDateTime);
      dayEnd.setHours(23, 59, 59, 999);

      const [existingInvitations] = await db.execute(
        `SELECT id FROM match_invitations 
       WHERE sender_team_id = ? AND receiver_team_id = ? 
       AND proposed_date BETWEEN ? AND ? 
       AND status = 'pending'`,
        [senderTeamId, receiverTeamId, dayStart, dayEnd] // MODIFIÉ
      );

      if (existingInvitations.length > 0) {
        return res
          .status(400)
          .json({ error: "Invitation already sent for this date" });
      }

      // Créer l'expiration (7 jours par défaut)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Créer l'invitation
      const [result] = await db.execute(
        `INSERT INTO match_invitations 
       (sender_team_id, receiver_team_id, proposed_date, proposed_location_id, message, expires_at) 
       VALUES (?, ?, ?, ?, ?, ?)`,
        [
          senderTeamId, // MODIFIÉ - utilise senderTeamId du formulaire
          receiverTeamId,
          proposedDate,
          proposedLocationId || null,
          message || null,
          expiresAt,
        ]
      );

      res.status(201).json({
        message: "Match invitation sent successfully",
        invitationId: result.insertId,
        senderTeamId: senderTeamId, // AJOUTÉ pour confirmation
      });
    } catch (error) {
      console.error("Send invitation error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/matches/invitations/received - Récupérer les invitations reçues
router.get("/invitations/received", authenticateToken, async (req, res) => {
  try {
    const { status = "pending", limit = 20, offset = 0 } = req.query;

    // Récupérer les équipes où l'utilisateur est capitaine
    const [captainTeams] = await db.execute(
      'SELECT team_id FROM team_members WHERE user_id = ? AND role = "captain" AND is_active = true',
      [req.user.id]
    );

    if (captainTeams.length === 0) {
      return res.json([]);
    }

    const teamIds = captainTeams.map((team) => team.team_id);
    const placeholders = teamIds.map(() => "?").join(",");

    const [invitations] = await db.execute(
      `SELECT mi.id, mi.proposed_date, mi.message, mi.status, mi.sent_at, mi.expires_at,
              st.id as sender_team_id, st.name as sender_team_name, st.skill_level as sender_skill_level,
              rt.id as receiver_team_id, rt.name as receiver_team_name,
              l.id as location_id, l.name as location_name, l.address as location_address,
              u.first_name as sender_captain_first_name, u.last_name as sender_captain_last_name
       FROM match_invitations mi
       JOIN teams st ON mi.sender_team_id = st.id
       JOIN teams rt ON mi.receiver_team_id = rt.id
       JOIN users u ON st.captain_id = u.id
       LEFT JOIN locations l ON mi.proposed_location_id = l.id
       WHERE mi.receiver_team_id IN (${placeholders}) AND mi.status = ?
       ORDER BY mi.sent_at DESC
       LIMIT ? OFFSET ?`,
      [...teamIds, status, parseInt(limit), parseInt(offset)]
    );

    const formattedInvitations = invitations.map((inv) => ({
      id: inv.id,
      proposedDate: inv.proposed_date,
      message: inv.message,
      status: inv.status,
      sentAt: inv.sent_at,
      expiresAt: inv.expires_at,
      senderTeam: {
        id: inv.sender_team_id,
        name: inv.sender_team_name,
        skillLevel: inv.sender_skill_level,
        captain: {
          firstName: inv.sender_captain_first_name,
          lastName: inv.sender_captain_last_name,
        },
      },
      receiverTeam: {
        id: inv.receiver_team_id,
        name: inv.receiver_team_name,
      },
      location: inv.location_id
        ? {
            id: inv.location_id,
            name: inv.location_name,
            address: inv.location_address,
          }
        : null,
    }));

    res.json(formattedInvitations);
  } catch (error) {
    console.error("Get received invitations error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/matches/invitations/sent - Récupérer les invitations envoyées
router.get("/invitations/sent", authenticateToken, async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;

    // Récupérer les équipes où l'utilisateur est capitaine
    const [captainTeams] = await db.execute(
      'SELECT team_id FROM team_members WHERE user_id = ? AND role = "captain" AND is_active = true',
      [req.user.id]
    );

    if (captainTeams.length === 0) {
      return res.json([]);
    }

    const teamIds = captainTeams.map((team) => team.team_id);
    const placeholders = teamIds.map(() => "?").join(",");

    let query = `
      SELECT mi.id, mi.proposed_date, mi.message, mi.status, mi.sent_at, mi.expires_at, mi.response_message,
             st.id as sender_team_id, st.name as sender_team_name,
             rt.id as receiver_team_id, rt.name as receiver_team_name, rt.skill_level as receiver_skill_level,
             l.id as location_id, l.name as location_name, l.address as location_address,
             u.first_name as receiver_captain_first_name, u.last_name as receiver_captain_last_name
      FROM match_invitations mi
      JOIN teams st ON mi.sender_team_id = st.id
      JOIN teams rt ON mi.receiver_team_id = rt.id
      JOIN users u ON rt.captain_id = u.id
      LEFT JOIN locations l ON mi.proposed_location_id = l.id
      WHERE mi.sender_team_id IN (${placeholders})
    `;

    const queryParams = [...teamIds];

    if (status) {
      query += " AND mi.status = ?";
      queryParams.push(status);
    }

    query += " ORDER BY mi.sent_at DESC LIMIT ? OFFSET ?";
    queryParams.push(parseInt(limit), parseInt(offset));

    const [invitations] = await db.execute(query, queryParams);

    const formattedInvitations = invitations.map((inv) => ({
      id: inv.id,
      proposedDate: inv.proposed_date,
      message: inv.message,
      status: inv.status,
      sentAt: inv.sent_at,
      expiresAt: inv.expires_at,
      responseMessage: inv.response_message,
      senderTeam: {
        id: inv.sender_team_id,
        name: inv.sender_team_name,
      },
      receiverTeam: {
        id: inv.receiver_team_id,
        name: inv.receiver_team_name,
        skillLevel: inv.receiver_skill_level,
        captain: {
          firstName: inv.receiver_captain_first_name,
          lastName: inv.receiver_captain_last_name,
        },
      },
      location: inv.location_id
        ? {
            id: inv.location_id,
            name: inv.location_name,
            address: inv.location_address,
          }
        : null,
    }));

    res.json(formattedInvitations);
  } catch (error) {
    console.error("Get sent invitations error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/matches/invitations/:id/respond - Répondre à une invitation
router.patch(
  "/invitations/:id/respond",
  [
    authenticateToken,
    body("response")
      .isIn(["accepted", "declined"])
      .withMessage("Response must be accepted or declined"),
    body("responseMessage").optional().isLength({ max: 500 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const invitationId = req.params.id;
      const { response, responseMessage } = req.body;

      // Récupérer l'invitation et vérifier les permissions
      const [invitations] = await db.execute(
        `SELECT mi.*, rt.captain_id as receiver_captain_id, st.name as sender_team_name, rt.name as receiver_team_name
       FROM match_invitations mi
       JOIN teams rt ON mi.receiver_team_id = rt.id
       JOIN teams st ON mi.sender_team_id = st.id
       WHERE mi.id = ?`,
        [invitationId]
      );

      if (invitations.length === 0) {
        return res.status(404).json({ error: "Invitation not found" });
      }

      const invitation = invitations[0];

      // Vérifier que l'utilisateur est le capitaine de l'équipe receveuse
      if (invitation.receiver_captain_id !== req.user.id) {
        return res
          .status(403)
          .json({ error: "Only the receiver team captain can respond" });
      }

      // Vérifier que l'invitation est encore en attente
      if (invitation.status !== "pending") {
        return res
          .status(400)
          .json({ error: "Invitation already responded to" });
      }

      // Vérifier que l'invitation n'a pas expiré
      if (
        invitation.expires_at &&
        new Date() > new Date(invitation.expires_at)
      ) {
        await db.execute(
          'UPDATE match_invitations SET status = "expired" WHERE id = ?',
          [invitationId]
        );
        return res.status(400).json({ error: "Invitation has expired" });
      }

      const connection = await db.getConnection();
      await connection.beginTransaction();

      try {
        // Mettre à jour l'invitation
        await connection.execute(
          "UPDATE match_invitations SET status = ?, response_message = ?, responded_at = CURRENT_TIMESTAMP WHERE id = ?",
          [response, responseMessage || null, invitationId]
        );

        // Si acceptée, créer le match
        if (response === "accepted") {
          const [matchResult] = await connection.execute(
            `INSERT INTO matches (home_team_id, away_team_id, match_date, location_id, status) 
           VALUES (?, ?, ?, ?, 'confirmed')`,
            [
              invitation.receiver_team_id,
              invitation.sender_team_id,
              invitation.proposed_date,
              invitation.proposed_location_id,
            ]
          );

          // Lier l'invitation au match créé
          await connection.execute(
            "UPDATE match_invitations SET match_id = ? WHERE id = ?",
            [matchResult.insertId, invitationId]
          );
        }

        await connection.commit();

        res.json({
          message: `Invitation ${response} successfully`,
          status: response,
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("Respond to invitation error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/matches - Récupérer les matchs d'une équipe
router.get("/", authenticateToken, async (req, res) => {
  try {
    const {
      teamId,
      status,
      upcoming = false,
      limit = 20,
      offset = 0,
    } = req.query;

    // Si teamId n'est pas fourni, récupérer les matchs de toutes les équipes de l'utilisateur
    let userTeamIds = [];
    if (teamId) {
      // Vérifier que l'utilisateur fait partie de cette équipe
      const [membership] = await db.execute(
        "SELECT team_id FROM team_members WHERE team_id = ? AND user_id = ? AND is_active = true",
        [teamId, req.user.id]
      );
      if (membership.length === 0) {
        return res.status(403).json({ error: "Not a member of this team" });
      }
      userTeamIds = [parseInt(teamId)];
    } else {
      // Récupérer toutes les équipes de l'utilisateur
      const [userTeams] = await db.execute(
        "SELECT team_id FROM team_members WHERE user_id = ? AND is_active = true",
        [req.user.id]
      );
      userTeamIds = userTeams.map((team) => team.team_id);
    }

    if (userTeamIds.length === 0) {
      return res.json([]);
    }

    const placeholders = userTeamIds.map(() => "?").join(",");
    let query = `
      SELECT m.id, m.match_date, m.duration_minutes, m.match_type, m.status,
             m.home_score, m.away_score, m.referee_contact, m.notes, m.created_at,
             ht.id as home_team_id, ht.name as home_team_name, ht.skill_level as home_skill_level,
             at.id as away_team_id, at.name as away_team_name, at.skill_level as away_skill_level,
             l.id as location_id, l.name as location_name, l.address as location_address,
             l.field_type, l.price_per_hour
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      LEFT JOIN teams at ON m.away_team_id = at.id
      LEFT JOIN locations l ON m.location_id = l.id
      WHERE (m.home_team_id IN (${placeholders}) OR m.away_team_id IN (${placeholders}))
    `;

    const queryParams = [...userTeamIds, ...userTeamIds];

    if (status) {
      query += " AND m.status = ?";
      queryParams.push(status);
    }

    if (upcoming === "true") {
      query += " AND m.match_date > NOW()";
    }

    query += " ORDER BY m.match_date DESC LIMIT ? OFFSET ?";
    queryParams.push(parseInt(limit), parseInt(offset));

    const [matches] = await db.execute(query, queryParams);

    const formattedMatches = matches.map((match) => ({
      id: match.id,
      matchDate: match.match_date,
      duration: match.duration_minutes,
      type: match.match_type,
      status: match.status,
      score: {
        home: match.home_score,
        away: match.away_score,
      },
      homeTeam: {
        id: match.home_team_id,
        name: match.home_team_name,
        skillLevel: match.home_skill_level,
      },
      awayTeam: match.away_team_id
        ? {
            id: match.away_team_id,
            name: match.away_team_name,
            skillLevel: match.away_skill_level,
          }
        : null,
      location: match.location_id
        ? {
            id: match.location_id,
            name: match.location_name,
            address: match.location_address,
            fieldType: match.field_type,
            pricePerHour: match.price_per_hour,
          }
        : null,
      refereeContact: match.referee_contact,
      notes: match.notes,
      createdAt: match.created_at,
    }));

    res.json(formattedMatches);
  } catch (error) {
    console.error("Get matches error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/matches/my-matches
 * Récupérer tous les matchs où l'utilisateur est impliqué
 */
router.get("/my-matches", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, limit = 50, offset = 0 } = req.query;

    // Récupérer les équipes actives de l'utilisateur
    const [userTeams] = await db.execute(
      "SELECT team_id FROM team_members WHERE user_id = ? AND is_active = true",
      [userId]
    );

    if (userTeams.length === 0) {
      return res.json({ success: true, matches: [] });
    }

    const teamIds = userTeams.map((t) => t.team_id);
    const placeholders = teamIds.map(() => "?").join(",");

    let query = `
      SELECT DISTINCT
        m.id,
        m.match_date,
        m.match_type,
        m.status,
        m.home_score,
        m.away_score,
        m.created_at,
        ht.id AS home_team_id,
        ht.name AS home_team_name,
        ht.skill_level AS home_skill_level,
        at.id AS away_team_id,
        at.name AS away_team_name,
        at.skill_level AS away_skill_level,
        l.id AS location_id,
        l.name AS location_name,
        l.address AS location_address,
        CASE 
          WHEN ht.captain_id = ? THEN true 
          WHEN at.captain_id = ? THEN true 
          ELSE false 
        END AS is_organizer
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      LEFT JOIN teams at ON m.away_team_id = at.id
      LEFT JOIN locations l ON m.location_id = l.id
      WHERE (m.home_team_id IN (${placeholders}) OR m.away_team_id IN (${placeholders}))
    `;

    const queryParams = [userId, userId, ...teamIds, ...teamIds];

    if (status && status !== "all") {
      query += " AND m.status = ?";
      queryParams.push(status);
    }

    query += " ORDER BY m.match_date DESC LIMIT ? OFFSET ?";
    queryParams.push(parseInt(limit), parseInt(offset));

    const [matches] = await db.execute(query, queryParams);

    const formattedMatches = matches.map((m) => ({
      id: m.id,
      matchDate: m.match_date,
      type: m.match_type,
      status: m.status,
      score: { home: m.home_score, away: m.away_score },
      homeTeam: {
        id: m.home_team_id,
        name: m.home_team_name,
        skillLevel: m.home_skill_level,
      },
      awayTeam: m.away_team_id
        ? {
            id: m.away_team_id,
            name: m.away_team_name,
            skillLevel: m.away_skill_level,
          }
        : null,
      location: m.location_id
        ? {
            id: m.location_id,
            name: m.location_name,
            address: m.location_address,
          }
        : null,
      isOrganizer: !!m.is_organizer,
      createdAt: m.created_at,
    }));

    res.json({ success: true, matches: formattedMatches });
  } catch (error) {
    console.error("Get my matches error:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des matchs",
    });
  }
});

// GET /api/matches/:id - Récupérer les détails d'un match
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const matchId = req.params.id;

    const [matches] = await db.execute(
      `SELECT m.id, m.match_date, m.duration_minutes, m.match_type, m.status,
              m.home_score, m.away_score, m.referee_contact, m.notes, m.created_at,
              ht.id as home_team_id, ht.name as home_team_name, ht.skill_level as home_skill_level,
              at.id as away_team_id, at.name as away_team_name, at.skill_level as away_skill_level,
              l.id as location_id, l.name as location_name, l.address as location_address,
              l.city, l.field_type, l.price_per_hour, l.amenities,
              hc.first_name as home_captain_first_name, hc.last_name as home_captain_last_name,
              ac.first_name as away_captain_first_name, ac.last_name as away_captain_last_name
       FROM matches m
       JOIN teams ht ON m.home_team_id = ht.id
       JOIN users hc ON ht.captain_id = hc.id
       LEFT JOIN teams at ON m.away_team_id = at.id
       LEFT JOIN users ac ON at.captain_id = ac.id
       LEFT JOIN locations l ON m.location_id = l.id
       WHERE m.id = ?`,
      [matchId]
    );

    if (matches.length === 0) {
      return res.status(404).json({ error: "Match not found" });
    }

    const match = matches[0];

    // Vérifier que l'utilisateur fait partie d'une des équipes
    const [membership] = await db.execute(
      `SELECT tm.team_id, tm.role 
       FROM team_members tm 
       WHERE tm.user_id = ? AND tm.is_active = true 
       AND (tm.team_id = ? OR tm.team_id = ?)`,
      [req.user.id, match.home_team_id, match.away_team_id || 0]
    );

    if (membership.length === 0) {
      return res
        .status(403)
        .json({ error: "Not authorized to view this match" });
    }

    // Récupérer les messages du match
    const [messages] = await db.execute(
      `SELECT msg.id, msg.content, msg.message_type, msg.sent_at,
              u.first_name, u.last_name, tm.team_id
       FROM messages msg
       JOIN users u ON msg.sender_id = u.id
       JOIN team_members tm ON (u.id = tm.user_id AND tm.is_active = true 
                               AND (tm.team_id = ? OR tm.team_id = ?))
       WHERE msg.match_id = ?
       ORDER BY msg.sent_at ASC`,
      [match.home_team_id, match.away_team_id || 0, matchId]
    );

    res.json({
      id: match.id,
      matchDate: match.match_date,
      duration: match.duration_minutes,
      type: match.match_type,
      status: match.status,
      score: {
        home: match.home_score,
        away: match.away_score,
      },
      homeTeam: {
        id: match.home_team_id,
        name: match.home_team_name,
        skillLevel: match.home_skill_level,
        captain: {
          firstName: match.home_captain_first_name,
          lastName: match.home_captain_last_name,
        },
      },
      awayTeam: match.away_team_id
        ? {
            id: match.away_team_id,
            name: match.away_team_name,
            skillLevel: match.away_skill_level,
            captain: {
              firstName: match.away_captain_first_name,
              lastName: match.away_captain_last_name,
            },
          }
        : null,
      location: match.location_id
        ? {
            id: match.location_id,
            name: match.location_name,
            address: match.location_address,
            city: match.city,
            fieldType: match.field_type,
            pricePerHour: match.price_per_hour,
            amenities: match.amenities ? JSON.parse(match.amenities) : null,
          }
        : null,
      refereeContact: match.referee_contact,
      notes: match.notes,
      messages: messages.map((msg) => ({
        id: msg.id,
        content: msg.content,
        type: msg.message_type,
        sentAt: msg.sent_at,
        sender: {
          firstName: msg.first_name,
          lastName: msg.last_name,
          teamId: msg.team_id,
        },
      })),
      userTeamId: membership[0].team_id,
      userRole: membership[0].role,
      createdAt: match.created_at,
    });
  } catch (error) {
    console.error("Get match details error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/matches/:id/score - Mettre à jour le score d'un match
router.post(
  "/:id/score",
  [
    authenticateToken,
    body("homeScore")
      .isInt({ min: 0 })
      .withMessage("Home score must be a positive integer"),
    body("awayScore")
      .isInt({ min: 0 })
      .withMessage("Away score must be a positive integer"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const matchId = req.params.id;
      const { homeScore, awayScore } = req.body;

      // Vérifier que le match existe et que l'utilisateur est capitaine d'une des équipes
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

      // Vérifier que l'utilisateur est capitaine d'une des équipes
      if (
        req.user.id !== match.home_captain_id &&
        req.user.id !== match.away_captain_id
      ) {
        return res
          .status(403)
          .json({ error: "Only team captains can update the score" });
      }

      // Mettre à jour le score et le statut
      await db.execute(
        'UPDATE matches SET home_score = ?, away_score = ?, status = "completed" WHERE id = ?',
        [homeScore, awayScore, matchId]
      );

      // Mettre à jour les statistiques des équipes
      await updateTeamStats(match.home_team_id, homeScore, awayScore);
      if (match.away_team_id) {
        await updateTeamStats(match.away_team_id, awayScore, homeScore);
      }

      res.json({
        message: "Score updated successfully",
        score: { home: homeScore, away: awayScore },
      });
    } catch (error) {
      console.error("Update score error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /api/matches/:id/messages - Envoyer un message dans le chat du match
router.post(
  "/:id/messages",
  [
    authenticateToken,
    body("content")
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage("Message content is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const matchId = req.params.id;
      const { content } = req.body;

      // Vérifier que l'utilisateur fait partie d'une des équipes du match
      const [membership] = await db.execute(
        `SELECT tm.team_id 
       FROM team_members tm
       JOIN matches m ON (tm.team_id = m.home_team_id OR tm.team_id = m.away_team_id)
       WHERE tm.user_id = ? AND tm.is_active = true AND m.id = ?`,
        [req.user.id, matchId]
      );

      if (membership.length === 0) {
        return res
          .status(403)
          .json({ error: "Not authorized to send messages in this match" });
      }

      // Envoyer le message
      const [result] = await db.execute(
        "INSERT INTO messages (match_id, sender_id, content) VALUES (?, ?, ?)",
        [matchId, req.user.id, content]
      );

      res.status(201).json({
        message: "Message sent successfully",
        messageId: result.insertId,
      });
    } catch (error) {
      console.error("Send message error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Fonction utilitaire pour mettre à jour les statistiques d'équipe
async function updateTeamStats(teamId, goalsFor, goalsAgainst) {
  const matchResult =
    goalsFor > goalsAgainst
      ? "won"
      : goalsFor < goalsAgainst
      ? "lost"
      : "drawn";

  await db.execute(
    `UPDATE team_stats 
     SET matches_played = matches_played + 1,
         matches_${matchResult} = matches_${matchResult} + 1,
         goals_scored = goals_scored + ?,
         goals_conceded = goals_conceded + ?
     WHERE team_id = ?`,
    [goalsFor, goalsAgainst, teamId]
  );
}

module.exports = router;
