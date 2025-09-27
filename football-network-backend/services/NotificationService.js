// football-network-backend/services/NotificationService.js - VERSION SÉCURISÉE
let socketManager = null;

// Import dynamique pour éviter les dépendances circulaires
const getSocketManager = () => {
  if (!socketManager) {
    try {
      socketManager = require("./SocketManager");
    } catch (error) {
      console.error("❌ Failed to load SocketManager:", error.message);
      return null;
    }
  }
  return socketManager;
};

class NotificationService {
  // Types de notifications
  static TYPES = {
    PLAYER_INVITATION: "player_invitation",
    PLAYER_INVITATION_RESPONSE: "player_invitation_response",
    MATCH_INVITATION: "match_invitation",
    MATCH_INVITATION_RESPONSE: "match_invitation_response",
    TEAM_JOIN: "team_join",
    TEAM_LEAVE: "team_leave",
    MATCH_UPDATE: "match_update",
    GENERAL: "general",
  };

  // Envoyer une notification d'invitation de joueur
  static async notifyPlayerInvitation(userId, invitationData) {
    try {
      const notification = {
        id: `notif-${Date.now()}`,
        type: this.TYPES.PLAYER_INVITATION,
        title: "Nouvelle invitation d'équipe",
        message: `L'équipe "${invitationData.teamName}" vous invite à rejoindre leur équipe`,
        data: {
          invitationId: invitationData.invitationId,
          teamId: invitationData.teamId,
          teamName: invitationData.teamName,
          inviterName: invitationData.inviterName,
        },
        timestamp: new Date().toISOString(),
        read: false,
      };

      // Envoyer via WebSocket si possible
      const sm = getSocketManager();
      if (sm) {
        const sent = sm.sendToUser(userId, "notification", notification);
        console.log(
          `📨 Player invitation notification sent: ${
            sent ? "SUCCESS" : "QUEUED"
          }`
        );
      } else {
        console.log("⚠️ Socket manager not available, notification not sent");
      }

      // TODO: Sauvegarder en base de données pour les notifications persistantes
      // TODO: Envoyer un email si l'utilisateur n'est pas en ligne

      return notification;
    } catch (error) {
      console.error("❌ Error sending player invitation notification:", error);
      throw error;
    }
  }

  // Envoyer une notification de réponse d'invitation
  static async notifyPlayerInvitationResponse(captainId, responseData) {
    try {
      const notification = {
        id: `notif-${Date.now()}`,
        type: this.TYPES.PLAYER_INVITATION_RESPONSE,
        title:
          responseData.response === "accepted"
            ? "Invitation acceptée !"
            : "Invitation refusée",
        message: `${responseData.playerName} a ${
          responseData.response === "accepted" ? "accepté" : "refusé"
        } votre invitation pour l'équipe "${responseData.teamName}"`,
        data: {
          invitationId: responseData.invitationId,
          playerId: responseData.playerId,
          playerName: responseData.playerName,
          teamId: responseData.teamId,
          teamName: responseData.teamName,
          response: responseData.response,
          responseMessage: responseData.responseMessage,
        },
        timestamp: new Date().toISOString(),
        read: false,
      };

      const sm = getSocketManager();
      if (sm) {
        const sent = sm.sendToUser(captainId, "notification", notification);
        console.log(
          `📨 Invitation response notification sent: ${
            sent ? "SUCCESS" : "QUEUED"
          }`
        );
      }

      return notification;
    } catch (error) {
      console.error(
        "❌ Error sending invitation response notification:",
        error
      );
      throw error;
    }
  }

  // Envoyer une notification d'invitation de match
  static async notifyMatchInvitation(captainId, matchData) {
    try {
      const notification = {
        id: `notif-${Date.now()}`,
        type: this.TYPES.MATCH_INVITATION,
        title: "Nouvelle invitation de match",
        message: `L'équipe "${matchData.senderTeamName}" vous défie pour un match`,
        data: {
          invitationId: matchData.invitationId,
          senderTeamId: matchData.senderTeamId,
          senderTeamName: matchData.senderTeamName,
          receiverTeamId: matchData.receiverTeamId,
          proposedDate: matchData.proposedDate,
          location: matchData.location,
        },
        timestamp: new Date().toISOString(),
        read: false,
      };

      const sm = getSocketManager();
      if (sm) {
        const sent = sm.sendToUser(captainId, "notification", notification);
        console.log(
          `📨 Match invitation notification sent: ${
            sent ? "SUCCESS" : "QUEUED"
          }`
        );
      }

      return notification;
    } catch (error) {
      console.error("❌ Error sending match invitation notification:", error);
      throw error;
    }
  }

  // Notifier qu'un joueur a rejoint l'équipe
  static async notifyTeamJoin(teamMembers, playerData) {
    try {
      const notification = {
        id: `notif-${Date.now()}`,
        type: this.TYPES.TEAM_JOIN,
        title: "Nouveau membre !",
        message: `${playerData.playerName} a rejoint l'équipe "${playerData.teamName}"`,
        data: {
          playerId: playerData.playerId,
          playerName: playerData.playerName,
          teamId: playerData.teamId,
          teamName: playerData.teamName,
        },
        timestamp: new Date().toISOString(),
        read: false,
      };

      const sm = getSocketManager();
      if (sm) {
        // Envoyer à tous les membres de l'équipe sauf le nouveau membre
        let sentCount = 0;
        teamMembers.forEach((memberId) => {
          if (memberId !== playerData.playerId) {
            const sent = sm.sendToUser(memberId, "notification", notification);
            if (sent) sentCount++;
          }
        });
        console.log(
          `📨 Team join notification sent to ${sentCount}/${
            teamMembers.length - 1
          } members`
        );
      }

      return notification;
    } catch (error) {
      console.error("❌ Error sending team join notification:", error);
      throw error;
    }
  }

  // Notifier les changements de statut des invitations en masse
  static async notifyInvitationStatusUpdate(userId) {
    try {
      const sm = getSocketManager();
      if (sm) {
        const sent = sm.sendToUser(userId, "invitations_updated", {
          timestamp: new Date().toISOString(),
        });
        console.log(
          `🔄 Invitation status update sent: ${sent ? "SUCCESS" : "QUEUED"}`
        );
      }
    } catch (error) {
      console.error("❌ Error sending invitation status update:", error);
      // Ne pas faire échouer pour cette notification
    }
  }

  // Notifier tous les utilisateurs connectés (pour les annonces globales)
  static async notifyAll(notification) {
    try {
      const sm = getSocketManager();
      if (sm) {
        sm.broadcast("notification", notification);
        console.log("📢 Global notification broadcasted");
      }
    } catch (error) {
      console.error("❌ Error broadcasting notification:", error);
      throw error;
    }
  }

  // Méthode utilitaire pour vérifier la disponibilité
  static isAvailable() {
    const sm = getSocketManager();
    return sm !== null;
  }
}

module.exports = NotificationService;
