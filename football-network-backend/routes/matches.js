const express = require("express");
const { body, validationResult } = require("express-validator");
const db = require("../config/database");
const { authenticateToken } = require("../middleware/auth");
const NotificationService = require("../services/NotificationService");
const { validateTeamPlayerCount, logTeamValidation } = require("../utils/teamValidation");
const { createParticipationsForMatch } = require("../utils/matchParticipation");

const router = express.Router();

// POST /api/matches/invitations - Envoyer une invitation de match (CORRIGÉE)
router.post(
  "/invitations",
  [
    authenticateToken,
    body("senderTeamId").isInt().withMessage("Sender team ID is required"),
    body("receiverTeamId").isInt().withMessage("Receiver team ID is required"),
    body("proposedDate").isISO8601().withMessage("Valid date is required"),
    body("proposedLocationId")
      .optional({ nullable: true, checkFalsy: true })
      .isInt(),
    body("venueId").optional({ nullable: true, checkFalsy: true }).isInt(),
    body("requiresReferee").optional().isBoolean(),
    body("preferredRefereeId").optional({ nullable: true, checkFalsy: true }).isInt(),
    body("verifyPlayerAvailability").optional().isBoolean(),
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
        venueId,
        requiresReferee,
        preferredRefereeId,
        verifyPlayerAvailability,
        message,
      } = req.body;

      // Vérifier que l'utilisateur est capitaine de l'équipe spécifiée (MODIFIÉ)
      const [senderTeamCheck] = await db.execute(
        'SELECT team_id FROM team_members WHERE user_id = ? AND team_id = ? AND role = "captain" AND is_active = true',
        [req.user.id, senderTeamId]
      );

      if (senderTeamCheck.length === 0) {
        return res
          .status(403)
          .json({ error: "You are not the captain of this team" });
      }

      // Si verifyPlayerAvailability = true, vérifier que l'équipe a minimum 6 joueurs
      if (verifyPlayerAvailability === true) {
        const senderValidation = await validateTeamPlayerCount(senderTeamId, 6);
        if (!senderValidation.isValid) {
          return res.status(400).json({
            error: "Insufficient players",
            message: senderValidation.message,
            playersCount: senderValidation.playersCount,
            minimumRequired: 6
          });
        }

        // Enregistrer la validation
        await logTeamValidation({
          teamId: senderTeamId,
          invitationId: null,
          validationType: 'send_invitation',
          playersCount: senderValidation.playersCount,
          minimumRequired: 6,
          isValid: true,
          validatedBy: req.user.id
        });
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
       (sender_team_id, receiver_team_id, proposed_date, proposed_location_id,
        venue_id, requires_referee, preferred_referee_id, verify_player_availability, message, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          senderTeamId,
          receiverTeamId,
          proposedDate,
          proposedLocationId || null,
          venueId || null,
          requiresReferee || false,
          preferredRefereeId || null,
          verifyPlayerAvailability || false,
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
        `SELECT mi.id, mi.sender_team_id, mi.receiver_team_id, mi.proposed_date,
                mi.proposed_location_id, mi.venue_id, mi.requires_referee,
                mi.preferred_referee_id, mi.verify_player_availability, mi.message,
                mi.status, mi.expires_at,
                rt.captain_id as receiver_captain_id,
                st.name as sender_team_name,
                rt.name as receiver_team_name
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

      // Vérifier que l'équipe receveuse a minimum 6 joueurs (si acceptation ET si verify_player_availability = true)
      if (response === 'accepted' && invitation.verify_player_availability === 1) {
        const receiverValidation = await validateTeamPlayerCount(invitation.receiver_team_id, 6);
        if (!receiverValidation.isValid) {
          return res.status(400).json({
            error: "Insufficient players",
            message: receiverValidation.message,
            playersCount: receiverValidation.playersCount,
            minimumRequired: 6
          });
        }

        // Enregistrer la validation
        await logTeamValidation({
          teamId: invitation.receiver_team_id,
          invitationId: invitationId,
          validationType: 'accept_invitation',
          playersCount: receiverValidation.playersCount,
          minimumRequired: 6,
          isValid: true,
          validatedBy: req.user.id
        });
      }

      const connection = await db.getConnection();
      await connection.beginTransaction();

      try {
        // Si acceptée, créer le match
        if (response === "accepted") {
          // Si un venueId est spécifié dans l'invitation, créer d'abord la réservation
          let venueBookingId = null;
          if (invitation.venue_id) {
            try {
              // Calculer la durée par défaut (90 minutes pour un match)
              const matchDate = new Date(invitation.proposed_date);
              const startTime = matchDate.toTimeString().substring(0, 5); // HH:MM
              const endDate = new Date(matchDate.getTime() + 90 * 60000);
              const endTime = endDate.toTimeString().substring(0, 5);

              // Déterminer le type de jeu depuis l'équipe
              const [senderTeamInfo] = await connection.execute(
                "SELECT game_type FROM teams WHERE id = ?",
                [invitation.sender_team_id]
              );
              const gameType = senderTeamInfo[0]?.game_type || '11v11';

              // Calculer le prix (simplifié - on prend le prix de base)
              const bookingDateStr = matchDate.toISOString().split('T')[0];
              const dayOfWeek = matchDate.getDay();
              const dayType = (dayOfWeek === 0 || dayOfWeek === 6) ? 'weekend' : 'weekday';

              const hour = matchDate.getHours();
              let timeSlot;
              if (hour >= 6 && hour < 12) timeSlot = 'morning';
              else if (hour >= 12 && hour < 18) timeSlot = 'afternoon';
              else if (hour >= 18 && hour < 22) timeSlot = 'evening';
              else timeSlot = 'night';

              const [pricingResults] = await connection.execute(
                `SELECT price FROM venue_pricing
                 WHERE location_id = ?
                 AND game_type = ?
                 AND duration_minutes = 90
                 AND day_type = ?
                 AND (time_slot = ? OR time_slot IS NULL)
                 AND is_active = true
                 ORDER BY time_slot DESC
                 LIMIT 1`,
                [invitation.venue_id, gameType, dayType, timeSlot]
              );

              const basePrice = pricingResults.length > 0 ? parseFloat(pricingResults[0].price) : 0;

              // Vérifier si réduction partenaire
              const [partnerCheck] = await connection.execute(
                `SELECT discount_percentage
                 FROM venue_partnerships
                 WHERE location_id = ?
                 AND is_active = true
                 AND (end_date IS NULL OR end_date >= CURDATE())`,
                [invitation.venue_id]
              );

              const discountApplied = partnerCheck.length > 0
                ? basePrice * (parseFloat(partnerCheck[0].discount_percentage) / 100)
                : 0;
              const finalPrice = basePrice - discountApplied;

              // Créer la réservation automatiquement
              const [bookingResult] = await connection.execute(
                `INSERT INTO venue_bookings
                 (location_id, team_id, booked_by, booking_date, start_time, end_time,
                  duration_minutes, game_type, base_price, discount_applied, final_price,
                  notes, status)
                 VALUES (?, ?, ?, ?, ?, ?, 90, ?, ?, ?, ?, 'Réservation automatique suite à acceptation invitation match', 'pending')`,
                [invitation.venue_id, invitation.receiver_team_id, req.user.id, bookingDateStr,
                 startTime, endTime, gameType, basePrice, discountApplied, finalPrice]
              );

              venueBookingId = bookingResult.insertId;
            } catch (bookingError) {
              console.error('Error creating automatic venue booking:', bookingError);
              // Continuer sans réservation si erreur
            }
          }

          // Déterminer le statut du match selon verify_player_availability
          // Si verify_player_availability = true → 'confirmed' (validations faites)
          // Si verify_player_availability = false → 'pending' (attente confirmations joueurs)
          const matchStatus = invitation.verify_player_availability === 1 ? 'confirmed' : 'pending';

          // Créer le match avec les infos venue et referee si fournis
          const [matchResult] = await connection.execute(
            `INSERT INTO matches
             (home_team_id, away_team_id, match_date, location_id, venue_booking_id, has_referee, status)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              invitation.receiver_team_id,
              invitation.sender_team_id,
              invitation.proposed_date,
              invitation.venue_id || invitation.proposed_location_id,
              venueBookingId,
              invitation.requires_referee || false,
              matchStatus,
            ]
          );

          const matchId = matchResult.insertId;

          // Mettre à jour la réservation avec le match_id si créée
          if (venueBookingId) {
            await connection.execute(
              "UPDATE venue_bookings SET match_id = ? WHERE id = ?",
              [matchId, venueBookingId]
            );
          }

          // Si un arbitre préféré est spécifié, créer l'assignation
          if (invitation.preferred_referee_id) {
            await connection.execute(
              `INSERT INTO match_referee_assignments (match_id, referee_id, role, assigned_by, status)
               VALUES (?, ?, 'main', ?, 'pending')`,
              [matchId, invitation.preferred_referee_id, req.user.id]
            );
          }

          // Lier l'invitation au match créé ET mettre à jour le statut en une seule requête
          await connection.execute(
            "UPDATE match_invitations SET status = 'accepted', response_message = ?, responded_at = CURRENT_TIMESTAMP, match_id = ? WHERE id = ?",
            [responseMessage || null, matchId, invitationId]
          );
        } else {
          // Si refusée, juste mettre à jour le statut
          await connection.execute(
            "UPDATE match_invitations SET status = ?, response_message = ?, responded_at = CURRENT_TIMESTAMP WHERE id = ?",
            [response, responseMessage || null, invitationId]
          );
        }

        await connection.commit();
        connection.release();

        // Créer les participations APRÈS la transaction (asynchrone, non-bloquant)
        if (response === "accepted") {
          const matchIdCreated = await db.execute(
            "SELECT match_id FROM match_invitations WHERE id = ?",
            [invitationId]
          ).then(([rows]) => rows[0]?.match_id);

          if (matchIdCreated) {
            // Créer participations en arrière-plan
            createParticipationsForMatch(
              matchIdCreated,
              invitation.receiver_team_id,
              invitation.sender_team_id
            ).catch(participationError => {
              console.error('Error creating participations (background):', participationError);
              // Erreur loggée mais n'affecte pas la réponse
            });
          }
        }

        res.json({
          message: `Invitation ${response} successfully`,
          status: response,
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        if (connection) connection.release();
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
        ht.logo_id AS home_team_logo_id,
        home_logo.stored_filename AS home_team_logo_filename,
        at.id AS away_team_id,
        at.name AS away_team_name,
        at.skill_level AS away_skill_level,
        at.logo_id AS away_team_logo_id,
        away_logo.stored_filename AS away_team_logo_filename,
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
      LEFT JOIN uploads home_logo ON ht.logo_id = home_logo.id AND home_logo.is_active = true
      LEFT JOIN teams at ON m.away_team_id = at.id
      LEFT JOIN uploads away_logo ON at.logo_id = away_logo.id AND away_logo.is_active = true
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
        logoUrl: m.home_team_logo_filename
          ? `/uploads/teams/${m.home_team_logo_filename}`
          : null,
      },
      awayTeam: m.away_team_id
        ? {
            id: m.away_team_id,
            name: m.away_team_name,
            skillLevel: m.away_skill_level,
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
              ht.logo_id as home_team_logo_id,
              home_logo.stored_filename as home_team_logo_filename,
              at.id as away_team_id, at.name as away_team_name, at.skill_level as away_skill_level,
              at.logo_id as away_team_logo_id,
              away_logo.stored_filename as away_team_logo_filename,
              l.id as location_id, l.name as location_name, l.address as location_address,
              l.city, l.field_type, l.price_per_hour, l.amenities,
              hc.first_name as home_captain_first_name, hc.last_name as home_captain_last_name, hc.id as home_captain_id,
              ac.first_name as away_captain_first_name, ac.last_name as away_captain_last_name, ac.id as away_captain_id
       FROM matches m
       JOIN teams ht ON m.home_team_id = ht.id
       LEFT JOIN uploads home_logo ON ht.logo_id = home_logo.id AND home_logo.is_active = true
       JOIN users hc ON ht.captain_id = hc.id
       LEFT JOIN teams at ON m.away_team_id = at.id
       LEFT JOIN uploads away_logo ON at.logo_id = away_logo.id AND away_logo.is_active = true
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
        logoUrl: match.home_team_logo_filename
          ? `/uploads/teams/${match.home_team_logo_filename}`
          : null,
        captain: {
          id: match.home_captain_id,
          firstName: match.home_captain_first_name,
          lastName: match.home_captain_last_name,
        },
      },
      awayTeam: match.away_team_id
        ? {
            id: match.away_team_id,
            name: match.away_team_name,
            skillLevel: match.away_skill_level,
            logoUrl: match.away_team_logo_filename
              ? `/uploads/teams/${match.away_team_logo_filename}`
              : null,
            captain: {
              id: match.away_captain_id,
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

/**
 * POST /api/matches/:id/score
 * Mettre à jour le score d'un match (MODIFIÉ avec validation)
 */
router.post(
  "/:id/validate-score",
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

      // Vérifier que le match existe et récupérer les infos
      const [matches] = await db.execute(
        `SELECT m.*, 
                ht.captain_id as home_captain_id, 
                at.captain_id as away_captain_id,
                ht.name as home_team_name,
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

      // Vérifier que l'utilisateur est capitaine d'une des équipes
      const isHomeCaptain = req.user.id === match.home_captain_id;
      const isAwayCaptain = req.user.id === match.away_captain_id;

      if (!isHomeCaptain && !isAwayCaptain) {
        return res
          .status(403)
          .json({ error: "Only team captains can update the score" });
      }

      // Déterminer le rôle du validateur
      const validatorRole = isHomeCaptain ? "home_captain" : "away_captain";

      // Vérifier si c'est la première saisie ou une validation
      const isFirstEntry =
        match.home_score === null && match.away_score === null;

      if (isFirstEntry) {
        // Première saisie du score
        await db.execute(
          `UPDATE matches 
           SET home_score = ?, 
               away_score = ?, 
               status = 'completed',
               ${
                 isHomeCaptain
                   ? "home_captain_validated = 1, home_captain_validated_at = NOW()"
                   : "away_captain_validated = 1, away_captain_validated_at = NOW()"
               }
           WHERE id = ?`,
          [homeScore, awayScore, matchId]
        );

        // Enregistrer dans l'historique
        try {
          await db.execute(
            `INSERT INTO match_validations 
           (match_id, validator_id, validator_role, validation_type, home_score, away_score, status)
           VALUES (?, ?, ?, 'score', ?, ?, 'approved')`,
            [matchId, req.user.id, validatorRole, homeScore, awayScore]
          );
          console.log("✅ Validation inserted successfully");
        } catch (error) {
          console.error("❌ ERROR inserting validation:", error);
        }

        // Notifier l'autre capitaine
        const otherCaptainId = isHomeCaptain
          ? match.away_captain_id
          : match.home_captain_id;
        const otherTeamName = isHomeCaptain
          ? match.away_team_name
          : match.home_team_name;

        if (otherCaptainId) {
          await NotificationService.createNotification({
            userId: otherCaptainId,
            type: "match_validation_needed",
            title: "Validation de score requise",
            message: `Le score du match contre ${
              isHomeCaptain ? match.away_team_name : match.home_team_name
            } a été saisi. Veuillez le valider.`,
            relatedId: matchId,
            relatedType: "match",
          });
        }

        return res.json({
          message:
            "Score entered successfully. Waiting for opponent validation.",
          match: {
            id: matchId,
            homeScore,
            awayScore,
            validatedBy: validatorRole,
            needsValidation: true,
          },
        });
      } else {
        // Validation du score existant
        const scoresMatch =
          match.home_score === homeScore && match.away_score === awayScore;

        if (scoresMatch) {
          // Les scores correspondent - validation réussie
          await db.execute(
            `UPDATE matches 
             SET ${
               isHomeCaptain
                 ? "home_captain_validated = 1, home_captain_validated_at = NOW()"
                 : "away_captain_validated = 1, away_captain_validated_at = NOW()"
             }
             WHERE id = ?`,
            [matchId]
          );

          // Enregistrer la validation
          try {
            await db.execute(
              `INSERT INTO match_validations 
             (match_id, validator_id, validator_role, validation_type, home_score, away_score, status)
             VALUES (?, ?, ?, 'score', ?, ?, 'approved')`,
              [matchId, req.user.id, validatorRole, homeScore, awayScore]
            );
            console.log("✅ Validation inserted successfully");
          } catch (error) {
            console.error("❌ ERROR inserting validation:", error);
          }

          // Vérifier si les deux capitaines ont validé
          const [updated] = await db.execute(
            "SELECT home_captain_validated, away_captain_validated FROM matches WHERE id = ?",
            [matchId]
          );

          const fullyValidated =
            updated[0].home_captain_validated &&
            updated[0].away_captain_validated;

          if (fullyValidated) {
            // Notifier les deux capitaines
            await NotificationService.createNotification({
              userId: match.home_captain_id,
              type: "match_validated",
              title: "Match validé",
              message: `Le score du match a été confirmé par les deux équipes.`,
              relatedId: matchId,
              relatedType: "match",
            });

            if (match.away_captain_id) {
              await NotificationService.createNotification({
                userId: match.away_captain_id,
                type: "match_validated",
                title: "Match validé",
                message: `Le score du match a été confirmé par les deux équipes.`,
                relatedId: matchId,
                relatedType: "match",
              });
            }
          }

          return res.json({
            message: fullyValidated
              ? "Match fully validated!"
              : "Score validated successfully",
            match: {
              id: matchId,
              homeScore,
              awayScore,
              fullyValidated,
            },
          });
        } else {
          // Les scores ne correspondent pas - ouvrir une contestation
          return res.status(409).json({
            error: "Score mismatch",
            message:
              "The scores you entered do not match. Please review or open a dispute.",
            existingScore: {
              home: match.home_score,
              away: match.away_score,
            },
            yourScore: {
              home: homeScore,
              away: awayScore,
            },
          });
        }
      }
    } catch (error) {
      console.error("Update score error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * POST /api/matches/:id/dispute
 * Ouvrir une contestation sur un match
 */
router.post(
  "/:id/dispute",
  [
    authenticateToken,
    body("reason")
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage("Reason must be between 10 and 1000 characters"),
    body("proposedHomeScore").optional().isInt({ min: 0 }),
    body("proposedAwayScore").optional().isInt({ min: 0 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const matchId = req.params.id;
      const { reason, proposedHomeScore, proposedAwayScore } = req.body;

      // Vérifier que le match existe
      const [matches] = await db.execute(
        `SELECT m.*, 
                ht.captain_id as home_captain_id, 
                at.captain_id as away_captain_id,
                ht.name as home_team_name,
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

      // Vérifier que l'utilisateur est capitaine
      const isHomeCaptain = req.user.id === match.home_captain_id;
      const isAwayCaptain = req.user.id === match.away_captain_id;

      if (!isHomeCaptain && !isAwayCaptain) {
        return res
          .status(403)
          .json({ error: "Only captains can open disputes" });
      }

      // Vérifier qu'il n'y a pas déjà une contestation ouverte
      if (match.is_disputed) {
        return res
          .status(400)
          .json({ error: "A dispute is already open for this match" });
      }

      const disputeRole = isHomeCaptain ? "home_captain" : "away_captain";

      // Créer la contestation
      const [disputeResult] = await db.execute(
        `INSERT INTO match_disputes 
         (match_id, opened_by, opened_by_role, reason, proposed_home_score, proposed_away_score, status)
         VALUES (?, ?, ?, ?, ?, ?, 'open')`,
        [
          matchId,
          req.user.id,
          disputeRole,
          reason,
          proposedHomeScore || null,
          proposedAwayScore || null,
        ]
      );

      // Marquer le match comme contesté
      await db.execute(
        `UPDATE matches 
         SET is_disputed = TRUE, 
             dispute_reason = ?, 
             dispute_opened_at = NOW(),
             dispute_opened_by = ?
         WHERE id = ?`,
        [reason, req.user.id, matchId]
      );

      // Notifier l'autre capitaine
      const otherCaptainId = isHomeCaptain
        ? match.away_captain_id
        : match.home_captain_id;
      await NotificationService.createNotification({
        userId: otherCaptainId,
        type: "match_disputed",
        title: "Contestation de match",
        message: `${
          isHomeCaptain ? match.home_team_name : match.away_team_name
        } a ouvert une contestation sur le match.`,
        relatedId: matchId,
        relatedType: "match",
      });

      res.json({
        message: "Dispute opened successfully",
        disputeId: disputeResult.insertId,
      });
    } catch (error) {
      console.error("Open dispute error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * GET /api/matches/:id/validation-status
 * Obtenir le statut de validation d'un match
 */
router.get("/:id/validation-status", authenticateToken, async (req, res) => {
  try {
    const matchId = req.params.id;

    const [matches] = await db.execute(
      `SELECT 
        m.id,
        m.home_score,
        m.away_score,
        m.home_captain_validated,
        m.away_captain_validated,
        m.home_captain_validated_at,
        m.away_captain_validated_at,
        m.is_disputed,
        m.dispute_reason,
        m.is_referee_verified,
        ht.captain_id as home_captain_id,
        ht.id as home_team_id,
        at.captain_id as away_captain_id,
        at.id as away_team_id,
        ht.name as home_team_name,
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

    // Vérifier que l'utilisateur est capitaine d'une des équipes
    const isHomeCaptain = req.user.id === match.home_captain_id;
    const isAwayCaptain = req.user.id === match.away_captain_id;

    if (!isHomeCaptain && !isAwayCaptain) {
      // Vérifier si l'utilisateur est membre d'une des équipes
      const [membership] = await db.execute(
        `SELECT team_id FROM team_members 
         WHERE user_id = ? AND is_active = true 
         AND (team_id = ? OR team_id = ?)`,
        [req.user.id, match.home_team_id, match.away_team_id || 0]
      );

      if (membership.length === 0) {
        return res
          .status(403)
          .json({ error: "Not authorized to view this match validation" });
      }
    }

    // Récupérer l'historique des validations
    const [validations] = await db.execute(
      `SELECT v.*, u.first_name, u.last_name
       FROM match_validations v
       JOIN users u ON v.validator_id = u.id
       WHERE v.match_id = ?
       ORDER BY v.validated_at DESC`,
      [matchId]
    );

    // Récupérer les contestations actives
    const [disputes] = await db.execute(
      `SELECT d.*, u.first_name, u.last_name
       FROM match_disputes d
       JOIN users u ON d.opened_by = u.id
       WHERE d.match_id = ? AND d.status = 'open'`,
      [matchId]
    );

    // Déterminer le rôle de l'utilisateur
    let userRole = null;
    if (isHomeCaptain) {
      userRole = "home_captain";
    } else if (isAwayCaptain) {
      userRole = "away_captain";
    }

    res.json({
      match: {
        id: match.id,
        homeScore: match.home_score,
        awayScore: match.away_score,
        homeTeamName: match.home_team_name,
        awayTeamName: match.away_team_name,
      },
      validation: {
        homeCaptainValidated: Boolean(match.home_captain_validated),
        awayCaptainValidated: Boolean(match.away_captain_validated),
        homeCaptainValidatedAt: match.home_captain_validated_at,
        awayCaptainValidatedAt: match.away_captain_validated_at,
        fullyValidated: Boolean(
          match.home_captain_validated && match.away_captain_validated
        ),
        isDisputed: Boolean(match.is_disputed),
        disputeReason: match.dispute_reason,
        isRefereeVerified: Boolean(match.is_referee_verified),
      },
      validations: validations.map((v) => ({
        id: v.id,
        validatorName: `${v.first_name} ${v.last_name}`,
        role: v.validator_role,
        homeScore: v.home_score,
        awayScore: v.away_score,
        validatedAt: v.validated_at,
        status: v.status,
      })),
      disputes: disputes.map((d) => ({
        id: d.id,
        openedBy: `${d.first_name} ${d.last_name}`,
        role: d.opened_by_role,
        reason: d.reason,
        proposedHomeScore: d.proposed_home_score,
        proposedAwayScore: d.proposed_away_score,
        status: d.status,
        createdAt: d.created_at,
      })),
      userRole: userRole,
    });
  } catch (error) {
    console.error("Get validation status error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/matches/pending-validation
 * Obtenir tous les matchs en attente de validation pour l'utilisateur
 */
router.get("/pending-validation/list", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [matches] = await db.execute(
      `SELECT 
        m.id,
        m.match_date,
        m.home_score,
        m.away_score,
        m.home_captain_validated,
        m.away_captain_validated,
        m.is_disputed,
        ht.id as home_team_id,
        ht.name as home_team_name,
        ht.captain_id as home_captain_id,
        at.id as away_team_id,
        at.name as away_team_name,
        at.captain_id as away_captain_id,
        CASE 
          WHEN ht.captain_id = ? THEN 'home_captain'
          WHEN at.captain_id = ? THEN 'away_captain'
          ELSE NULL
        END as user_role
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      LEFT JOIN teams at ON m.away_team_id = at.id
      WHERE m.status = 'completed'
        AND (ht.captain_id = ? OR at.captain_id = ?)
        AND (
          (ht.captain_id = ? AND m.home_captain_validated = FALSE) OR
          (at.captain_id = ? AND m.away_captain_validated = FALSE) OR
          m.is_disputed = TRUE
        )
      ORDER BY m.match_date DESC`,
      [userId, userId, userId, userId, userId, userId]
    );

    res.json({
      count: matches.length,
      matches: matches.map((m) => ({
        id: m.id,
        matchDate: m.match_date,
        homeTeam: {
          id: m.home_team_id,
          name: m.home_team_name,
        },
        awayTeam: {
          id: m.away_team_id,
          name: m.away_team_name,
        },
        score: {
          home: m.home_score,
          away: m.away_score,
        },
        validation: {
          homeCaptainValidated: m.home_captain_validated,
          awayCaptainValidated: m.away_captain_validated,
          needsYourValidation:
            (m.user_role === "home_captain" && !m.home_captain_validated) ||
            (m.user_role === "away_captain" && !m.away_captain_validated),
        },
        isDisputed: m.is_disputed,
        userRole: m.user_role,
      })),
    });
  } catch (error) {
    console.error("Get pending validations error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PUT /api/matches/:id
 * Modifier un match existant
 */
router.put(
  "/:id",
  [
    authenticateToken,
    body("matchDate").isISO8601().withMessage("Invalid date format"),
    body("durationMinutes").optional().isInt({ min: 30, max: 180 }),
    // body("locationId").optional().isInt(),
    body("refereeContact").optional().trim().isLength({ max: 200 }),
    body("notes").optional().trim().isLength({ max: 1000 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const matchId = req.params.id;
      const { matchDate, durationMinutes, locationId, refereeContact, notes } =
        req.body;

      // Vérifier que le match existe et que l'utilisateur est le capitaine domicile
      const [matches] = await db.execute(
        `SELECT m.*, ht.captain_id as home_captain_id
         FROM matches m
         JOIN teams ht ON m.home_team_id = ht.id
         WHERE m.id = ?`,
        [matchId]
      );

      if (matches.length === 0) {
        return res.status(404).json({ error: "Match not found" });
      }

      const match = matches[0];

      if (req.user.id !== match.home_captain_id) {
        return res.status(403).json({
          error: "Only the home team captain can edit the match",
        });
      }

      // Ne pas permettre l'édition d'un match terminé ou annulé
      if (match.status === "completed" || match.status === "cancelled") {
        return res.status(400).json({
          error: "Cannot edit a completed or cancelled match",
        });
      }

      // Vérifier que la nouvelle date est dans le futur
      if (new Date(matchDate) < new Date()) {
        return res.status(400).json({
          error: "Match date must be in the future",
        });
      }

      // Mettre à jour le match
      await db.execute(
        `UPDATE matches 
         SET match_date = ?, 
             duration_minutes = ?, 
             location_id = ?, 
             referee_contact = ?, 
             notes = ?
         WHERE id = ?`,
        [
          matchDate,
          durationMinutes || 90,
          locationId || null,
          refereeContact || null,
          notes || null,
          matchId,
        ]
      );

      // Notifier l'équipe adverse si elle existe
      if (match.away_team_id) {
        const [awayTeam] = await db.execute(
          "SELECT captain_id FROM teams WHERE id = ?",
          [match.away_team_id]
        );

        if (awayTeam.length > 0) {
          await NotificationService.createNotification({
            userId: awayTeam[0].captain_id,
            type: "match_updated",
            title: "Match modifié",
            message: `Le match a été modifié. Veuillez vérifier les nouveaux détails.`,
            relatedId: matchId,
            relatedType: "match",
          });
        }
      }

      res.json({
        success: true,
        message: "Match updated successfully",
      });
    } catch (error) {
      console.error("Update match error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * PATCH /api/matches/:id/confirm
 * Confirmer un match (passage de pending à confirmed)
 */
router.patch("/:id/confirm", authenticateToken, async (req, res) => {
  try {
    const matchId = req.params.id;

    // Vérifier que le match existe et que l'utilisateur est le capitaine domicile
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

    if (req.user.id !== match.home_captain_id) {
      return res.status(403).json({
        error: "Only the home team captain can confirm the match",
      });
    }

    if (match.status !== "pending") {
      return res.status(400).json({
        error: "Only pending matches can be confirmed",
      });
    }

    // Mettre à jour le statut
    await db.execute("UPDATE matches SET status = ? WHERE id = ?", [
      "confirmed",
      matchId,
    ]);

    // Notifier l'équipe adverse
    if (match.away_captain_id) {
      await NotificationService.createNotification({
        userId: match.away_captain_id,
        type: "match_confirmed",
        title: "Match confirmé",
        message: `Le match a été confirmé par l'équipe adverse.`,
        relatedId: matchId,
        relatedType: "match",
      });
    }

    res.json({
      success: true,
      message: "Match confirmed successfully",
    });
  } catch (error) {
    console.error("Confirm match error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /api/matches/:id/cancel
 * Annuler un match
 */
router.patch(
  "/:id/cancel",
  [authenticateToken, body("reason").optional().trim().isLength({ max: 500 })],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const matchId = req.params.id;
      const { reason } = req.body;

      // Vérifier que le match existe
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

      // Vérifier que l'utilisateur est l'un des deux capitaines
      const isHomeCaptain = req.user.id === match.home_captain_id;
      const isAwayCaptain = req.user.id === match.away_captain_id;

      if (!isHomeCaptain && !isAwayCaptain) {
        return res.status(403).json({
          error: "Only team captains can cancel the match",
        });
      }

      // Ne pas permettre l'annulation d'un match déjà terminé
      if (match.status === "completed") {
        return res.status(400).json({
          error: "Cannot cancel a completed match",
        });
      }

      // Mettre à jour le statut
      await db.execute(
        "UPDATE matches SET status = ?, notes = ? WHERE id = ?",
        ["cancelled", reason || "Annulé par un capitaine", matchId]
      );

      // Notifier l'autre capitaine
      const otherCaptainId = isHomeCaptain
        ? match.away_captain_id
        : match.home_captain_id;

      if (otherCaptainId) {
        await NotificationService.createNotification({
          userId: otherCaptainId,
          type: "match_cancelled",
          title: "Match annulé",
          message: `Le match a été annulé. ${
            reason ? `Raison: ${reason}` : ""
          }`,
          relatedId: matchId,
          relatedType: "match",
        });
      }

      res.json({
        success: true,
        message: "Match cancelled successfully",
      });
    } catch (error) {
      console.error("Cancel match error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * DELETE /api/matches/:id
 * Supprimer un match
 */
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const matchId = req.params.id;

    // Vérifier que le match existe et que l'utilisateur est le capitaine domicile
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

    if (req.user.id !== match.home_captain_id) {
      return res.status(403).json({
        error: "Only the home team captain can delete the match",
      });
    }

    // Ne permettre la suppression que si le match est en attente ou annulé
    if (match.status === "completed" || match.status === "confirmed") {
      return res.status(400).json({
        error: "Cannot delete a confirmed or completed match. Cancel it first.",
      });
    }

    // Notifier l'équipe adverse avant suppression
    if (match.away_captain_id) {
      await NotificationService.createNotification({
        userId: match.away_captain_id,
        type: "match_deleted",
        title: "Match supprimé",
        message: `Le match a été supprimé par l'équipe organisatrice.`,
        relatedId: matchId,
        relatedType: "match",
      });
    }

    // Supprimer le match (CASCADE supprimera les données liées)
    await db.execute("DELETE FROM matches WHERE id = ?", [matchId]);

    res.json({
      success: true,
      message: "Match deleted successfully",
    });
  } catch (error) {
    console.error("Delete match error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /api/matches/:id/start
 * Marquer un match comme "en cours"
 */
router.patch("/:id/start", authenticateToken, async (req, res) => {
  try {
    const matchId = req.params.id;

    // Vérifier que le match existe
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

    // Vérifier que l'utilisateur est l'un des capitaines
    const isHomeCaptain = req.user.id === match.home_captain_id;
    const isAwayCaptain = req.user.id === match.away_captain_id;

    if (!isHomeCaptain && !isAwayCaptain) {
      return res.status(403).json({
        error: "Only team captains can start the match",
      });
    }

    if (match.status !== "confirmed") {
      return res.status(400).json({
        error: "Match must be confirmed before starting",
      });
    }

    // Mettre à jour le statut
    await db.execute("UPDATE matches SET status = ? WHERE id = ?", [
      "in_progress",
      matchId,
    ]);

    // Notifier l'autre capitaine
    const otherCaptainId = isHomeCaptain
      ? match.away_captain_id
      : match.home_captain_id;

    if (otherCaptainId) {
      await NotificationService.createNotification({
        userId: otherCaptainId,
        type: "match_started",
        title: "Match démarré",
        message: `Le match a été marqué comme en cours.`,
        relatedId: matchId,
        relatedType: "match",
      });
    }

    res.json({
      success: true,
      message: "Match started successfully",
    });
  } catch (error) {
    console.error("Start match error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /api/matches/:id/complete
 * Marquer un match comme "terminé" sans score (score sera saisi après)
 */
router.patch("/:id/complete", authenticateToken, async (req, res) => {
  try {
    const matchId = req.params.id;

    // Vérifier que le match existe
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

    // Vérifier que l'utilisateur est l'un des capitaines
    const isHomeCaptain = req.user.id === match.home_captain_id;
    const isAwayCaptain = req.user.id === match.away_captain_id;

    if (!isHomeCaptain && !isAwayCaptain) {
      return res.status(403).json({
        error: "Only team captains can complete the match",
      });
    }

    if (match.status === "completed") {
      return res.status(400).json({
        error: "Match is already completed",
      });
    }

    // Mettre à jour le statut
    await db.execute("UPDATE matches SET status = ? WHERE id = ?", [
      "completed",
      matchId,
    ]);

    // Notifier les deux capitaines pour saisir le score
    await NotificationService.createNotification({
      userId: match.home_captain_id,
      type: "match_completed",
      title: "Match terminé",
      message: `Le match est terminé. Veuillez saisir le score final.`,
      relatedId: matchId,
      relatedType: "match",
    });

    if (match.away_captain_id) {
      await NotificationService.createNotification({
        userId: match.away_captain_id,
        type: "match_completed",
        title: "Match terminé",
        message: `Le match est terminé. Veuillez saisir le score final.`,
        relatedId: matchId,
        relatedType: "match",
      });
    }

    res.json({
      success: true,
      message: "Match marked as completed. Please enter the score.",
    });
  } catch (error) {
    console.error("Complete match error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

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

/**
 * POST /api/matches/:matchId/book-venue
 * Créer une réservation de terrain pour un match existant
 * Accessible uniquement aux capitaines des équipes du match
 */
router.post(
  "/:matchId/book-venue",
  [
    authenticateToken,
    body("venueId").isInt().withMessage("Venue ID is required"),
    body("durationMinutes").optional().isInt({ min: 30, max: 180 }).withMessage("Duration must be between 30 and 180 minutes"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { matchId } = req.params;
      const { venueId, durationMinutes = 90 } = req.body;

      // Récupérer les détails du match et vérifier permissions
      const [matches] = await db.execute(
        `SELECT m.*,
                ht.captain_id as home_captain_id,
                at.captain_id as away_captain_id
         FROM matches m
         JOIN teams ht ON m.home_team_id = ht.id
         JOIN teams at ON m.away_team_id = at.id
         WHERE m.id = ?`,
        [matchId]
      );

      if (matches.length === 0) {
        return res.status(404).json({ error: "Match not found" });
      }

      const match = matches[0];

      // Vérifier que l'utilisateur est capitaine d'une des équipes
      if (req.user.id !== match.home_captain_id && req.user.id !== match.away_captain_id) {
        return res.status(403).json({ error: "Only team captains can book a venue for this match" });
      }

      // Vérifier que le match n'a pas déjà une réservation
      if (match.venue_booking_id) {
        return res.status(400).json({ error: "This match already has a venue booking" });
      }

      // Vérifier que le terrain existe
      const [venues] = await db.execute(
        "SELECT id FROM locations WHERE id = ? AND is_active = true",
        [venueId]
      );

      if (venues.length === 0) {
        return res.status(404).json({ error: "Venue not found or inactive" });
      }

      // Calculer les horaires
      const matchDate = new Date(match.match_date);
      const bookingDateStr = matchDate.toISOString().split('T')[0];
      const startTime = matchDate.toTimeString().substring(0, 5); // HH:MM
      const endDate = new Date(matchDate.getTime() + durationMinutes * 60000);
      const endTime = endDate.toTimeString().substring(0, 5);

      // Déterminer le type de jeu - par défaut 11v11 (la colonne game_type n'existe pas dans teams)
      const gameType = '11v11';
      const dayOfWeek = matchDate.getDay();
      const dayType = (dayOfWeek === 0 || dayOfWeek === 6) ? 'weekend' : 'weekday';

      const hour = matchDate.getHours();
      let timeSlot;
      if (hour >= 6 && hour < 12) timeSlot = 'morning';
      else if (hour >= 12 && hour < 18) timeSlot = 'afternoon';
      else if (hour >= 18 && hour < 22) timeSlot = 'evening';
      else timeSlot = 'night';

      // Récupérer le prix
      const [pricingResults] = await db.execute(
        `SELECT price FROM venue_pricing
         WHERE location_id = ?
         AND game_type = ?
         AND duration_minutes = ?
         AND day_type = ?
         AND (time_slot = ? OR time_slot IS NULL)
         AND is_active = true
         ORDER BY time_slot DESC
         LIMIT 1`,
        [venueId, gameType, durationMinutes, dayType, timeSlot]
      );

      const basePrice = pricingResults.length > 0 ? parseFloat(pricingResults[0].price) : 0;

      // Vérifier si réduction partenaire
      const [partnerCheck] = await db.execute(
        `SELECT discount_percentage
         FROM venue_partnerships
         WHERE location_id = ?
         AND is_active = true
         AND (end_date IS NULL OR end_date >= CURDATE())`,
        [venueId]
      );

      const discountApplied = partnerCheck.length > 0
        ? basePrice * (parseFloat(partnerCheck[0].discount_percentage) / 100)
        : 0;
      const finalPrice = basePrice - discountApplied;

      // Déterminer l'équipe qui réserve (celle du capitaine qui fait la demande)
      const bookingTeamId = req.user.id === match.home_captain_id
        ? match.home_team_id
        : match.away_team_id;

      // Créer la réservation
      const [bookingResult] = await db.execute(
        `INSERT INTO venue_bookings
         (location_id, team_id, booked_by, booking_date, start_time, end_time,
          duration_minutes, game_type, base_price, discount_applied, final_price,
          notes, status, match_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Réservation manuelle depuis match', 'pending', ?)`,
        [venueId, bookingTeamId, req.user.id, bookingDateStr, startTime, endTime,
         durationMinutes, gameType, basePrice, discountApplied, finalPrice, matchId]
      );

      const venueBookingId = bookingResult.insertId;

      // Lier la réservation au match
      await db.execute(
        "UPDATE matches SET venue_booking_id = ?, location_id = ? WHERE id = ?",
        [venueBookingId, venueId, matchId]
      );

      // Récupérer les détails de la réservation créée
      const [newBooking] = await db.execute(
        `SELECT vb.*, l.name as venue_name, l.city, l.address
         FROM venue_bookings vb
         JOIN locations l ON vb.location_id = l.id
         WHERE vb.id = ?`,
        [venueBookingId]
      );

      res.status(201).json({
        message: "Venue booking created successfully",
        booking: newBooking[0]
      });

    } catch (error) {
      console.error("Error creating venue booking:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

module.exports = router;
