// football-network-backend/routes/player-invitations.js - VERSION CORRIGÉE DUPLICATE ENTRY
const express = require("express");
const { body, validationResult } = require("express-validator");
const db = require("../config/database");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// GET /api/player-invitations - Récupérer mes invitations reçues
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { status = "pending", limit = 20, offset = 0 } = req.query;

    let query = `
      SELECT pi.id, pi.team_id, pi.message, pi.status, pi.sent_at, pi.expires_at,
             pi.response_message, pi.responded_at,
             t.name as team_name, t.description as team_description, 
             t.skill_level as team_skill_level, t.location_city as team_location_city,
             u.first_name as inviter_first_name, u.last_name as inviter_last_name,
             COUNT(tm.user_id) as current_members, t.max_players
      FROM player_invitations pi
      JOIN teams t ON pi.team_id = t.id
      JOIN users u ON pi.invited_by = u.id
      LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.is_active = true
      WHERE pi.user_id = ?`;

    const queryParams = [req.user.id];

    if (status && status !== "all") {
      query += " AND pi.status = ?";
      queryParams.push(status);
    }

    query += ` GROUP BY pi.id, pi.team_id, pi.message, pi.status, pi.sent_at, pi.expires_at,
                      pi.response_message, pi.responded_at, t.name, t.description, 
                      t.skill_level, t.location_city, u.first_name, u.last_name, t.max_players
               ORDER BY pi.sent_at DESC 
               LIMIT ? OFFSET ?`;

    queryParams.push(parseInt(limit), parseInt(offset));

    const [invitations] = await db.execute(query, queryParams);

    const formattedInvitations = invitations.map((inv) => ({
      id: inv.id,
      status: inv.status,
      message: inv.message,
      sentAt: inv.sent_at,
      expiresAt: inv.expires_at,
      responseMessage: inv.response_message,
      respondedAt: inv.responded_at,
      team: {
        id: inv.team_id,
        name: inv.team_name,
        description: inv.team_description,
        skillLevel: inv.team_skill_level,
        locationCity: inv.team_location_city,
        currentMembers: inv.current_members,
        maxPlayers: inv.max_players,
      },
      inviter: {
        firstName: inv.inviter_first_name,
        lastName: inv.inviter_last_name,
      },
      isExpired: inv.expires_at && new Date() > new Date(inv.expires_at),
    }));

    res.json(formattedInvitations);
  } catch (error) {
    console.error("Get player invitations error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/player-invitations/:id/respond - Répondre à une invitation
router.patch(
  "/:id/respond",
  [
    authenticateToken,
    body("response")
      .isIn(["accepted", "declined"])
      .withMessage("Response must be accepted or declined"),
    body("responseMessage")
      .optional({ nullable: true, checkFalsy: true })
      .isLength({ max: 500 })
      .withMessage("Response message too long"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const invitationId = req.params.id;
      const { response, responseMessage } = req.body;

      // Récupérer l'invitation avec toutes les informations nécessaires
      const [invitations] = await db.execute(
        `SELECT pi.id, pi.team_id, pi.user_id, pi.status, pi.expires_at, pi.invited_by,
                t.name as team_name, t.max_players, t.captain_id,
                u.first_name as player_first_name, u.last_name as player_last_name
         FROM player_invitations pi
         JOIN teams t ON pi.team_id = t.id
         JOIN users u ON pi.user_id = u.id
         WHERE pi.id = ? AND pi.user_id = ?`,
        [invitationId, req.user.id]
      );

      if (invitations.length === 0) {
        return res.status(404).json({ error: "Invitation not found" });
      }

      const invitation = invitations[0];

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
          'UPDATE player_invitations SET status = "expired" WHERE id = ?',
          [invitationId]
        );
        return res.status(400).json({ error: "Invitation has expired" });
      }

      const connection = await db.getConnection();
      await connection.beginTransaction();

      try {
        // CORRECTION MAJEURE : Si on accepte, on supprime les anciennes invitations 'accepted'
        // pour cette équipe et ce joueur afin d'éviter l'erreur 'Duplicate entry'
        if (response === "accepted") {
          await connection.execute(
            `DELETE FROM player_invitations 
             WHERE team_id = ? AND user_id = ? AND status = 'accepted' AND id != ?`,
            [invitation.team_id, req.user.id, invitationId]
          );
        }

        // Mettre à jour l'invitation actuelle
        await connection.execute(
          "UPDATE player_invitations SET status = ?, response_message = ?, responded_at = CURRENT_TIMESTAMP WHERE id = ?",
          [response, responseMessage || null, invitationId]
        );

        let teamMemberIds = [];

        // Si acceptée, ajouter le joueur à l'équipe
        if (response === "accepted") {
          // Vérifier que l'équipe a encore de la place
          const [memberCount] = await connection.execute(
            "SELECT COUNT(*) as count FROM team_members WHERE team_id = ? AND is_active = true",
            [invitation.team_id]
          );

          if (memberCount[0].count >= invitation.max_players) {
            throw new Error("Team is full");
          }

          // Vérifier si l'utilisateur a déjà un enregistrement pour cette équipe
          const [existingMember] = await connection.execute(
            "SELECT id, is_active FROM team_members WHERE team_id = ? AND user_id = ?",
            [invitation.team_id, req.user.id]
          );

          if (existingMember.length > 0) {
            if (existingMember[0].is_active) {
              // Déjà actif, rien à faire (ou erreur si on veut être strict)
              // throw new Error("Already a member of this team");
            } else {
              // Réactiver le membership existant
              await connection.execute(
                "UPDATE team_members SET is_active = true, joined_at = CURRENT_TIMESTAMP, role = 'player' WHERE team_id = ? AND user_id = ?",
                [invitation.team_id, req.user.id]
              );
            }
          } else {
            // Créer un nouvel enregistrement
            await connection.execute(
              "INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)",
              [invitation.team_id, req.user.id, "player"]
            );
          }

          // Récupérer les membres de l'équipe pour les notifications
          const [teamMembers] = await connection.execute(
            "SELECT user_id FROM team_members WHERE team_id = ? AND is_active = true",
            [invitation.team_id]
          );

          teamMemberIds = teamMembers.map((m) => m.user_id);
        }

        await connection.commit();

        // Gestion des notifications (Hors transaction)
        if (req.notificationService) {
          try {
            // Notifier le capitaine
            if (req.notificationService.notifyPlayerInvitationResponse) {
              await req.notificationService.notifyPlayerInvitationResponse(
                invitation.captain_id,
                {
                  invitationId: invitationId,
                  playerId: req.user.id,
                  playerName: `${invitation.player_first_name} ${invitation.player_last_name}`,
                  teamId: invitation.team_id,
                  teamName: invitation.team_name,
                  response: response,
                  responseMessage: responseMessage,
                }
              );
            }

            // Si acceptée, notifier les coéquipiers
            if (response === "accepted" && teamMemberIds.length > 0) {
              if (req.notificationService.notifyTeamJoin) {
                await req.notificationService.notifyTeamJoin(teamMemberIds, {
                  playerId: req.user.id,
                  playerName: `${invitation.player_first_name} ${invitation.player_last_name}`,
                  teamId: invitation.team_id,
                  teamName: invitation.team_name,
                });
              }
            }

            // Mettre à jour les compteurs en temps réel
            if (req.notificationService.notifyInvitationStatusUpdate) {
              await req.notificationService.notifyInvitationStatusUpdate(
                req.user.id
              );
              await req.notificationService.notifyInvitationStatusUpdate(
                invitation.captain_id
              );
            }
          } catch (notifError) {
            console.error("⚠️ Failed to send notifications:", notifError);
          }
        }

        res.json({
          message: `Invitation ${
            response === "accepted" ? "accepted" : "declined"
          } successfully`,
          teamName: invitation.team_name,
          response: response,
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        if (connection) connection.release();
      }
    } catch (error) {
      console.error("Respond to invitation error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  }
);

module.exports = router;
