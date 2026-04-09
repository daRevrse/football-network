let socketManager = null;

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
  static TYPES = {
    PLAYER_INVITATION: "player_invitation",
    PLAYER_INVITATION_RESPONSE: "player_invitation_response",
    MATCH_INVITATION: "match_invitation",
    MATCH_INVITATION_RESPONSE: "match_invitation_response",
    MATCH_UPDATED: "match_updated",
    MATCH_CONFIRMED: "match_confirmed",
    MATCH_CANCELLED: "match_cancelled",
    MATCH_DELETED: "match_deleted",
    MATCH_STARTED: "match_started",
    MATCH_COMPLETED: "match_completed",
    MATCH_VALIDATION_NEEDED: "match_validation_needed",
    MATCH_VALIDATED: "match_validated",
    MATCH_DISPUTED: "match_disputed",
    TEAM_JOIN: "team_join",
    TEAM_LEAVE: "team_leave",
    GENERAL: "general",
  };

  /**
   * NOUVELLE MÉTHODE GÉNÉRIQUE
   */
  static async createNotification({
    userId,
    type,
    title,
    message,
    relatedId = null,
    relatedType = null,
    data = {},
  }) {
    try {
      const notification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: type || this.TYPES.GENERAL,
        title: title,
        message: message,
        data: {
          ...data,
          relatedId: relatedId,
          relatedType: relatedType,
        },
        timestamp: new Date().toISOString(),
        read: false,
      };

      const sm = getSocketManager();
      if (sm && userId) {
        const sent = sm.sendToUser(userId, "notification", notification);
        console.log(
          `📨 Notification sent to user ${userId}: ${
            sent ? "SUCCESS" : "QUEUED"
          }`
        );
      }

      return notification;
    } catch (error) {
      console.error("❌ Error creating notification:", error);
      return null;
    }
  }

  static async createNotificationForMultipleUsers(userIds, notificationData) {
    try {
      const promises = userIds.map((userId) =>
        this.createNotification({
          userId,
          ...notificationData,
        })
      );

      await Promise.allSettled(promises);
      console.log(`📨 Notifications sent to ${userIds.length} users`);
    } catch (error) {
      console.error("❌ Error creating multiple notifications:", error);
    }
  }

  // Méthodes spécifiques existantes (garder pour compatibilité)
  static async notifyPlayerInvitation(userId, invitationData) {
    return this.createNotification({
      userId,
      type: this.TYPES.PLAYER_INVITATION,
      title: "Nouvelle invitation d'équipe",
      message: `L'équipe "${invitationData.teamName}" vous invite à rejoindre leur équipe`,
      relatedId: invitationData.invitationId,
      relatedType: "invitation",
      data: invitationData,
    });
  }

  static async notifyPlayerInvitationResponse(captainId, responseData) {
    return this.createNotification({
      userId: captainId,
      type: this.TYPES.PLAYER_INVITATION_RESPONSE,
      title:
        responseData.response === "accepted"
          ? "Invitation acceptée !"
          : "Invitation refusée",
      message: `${responseData.playerName} a ${
        responseData.response === "accepted" ? "accepté" : "refusé"
      } votre invitation pour l'équipe "${responseData.teamName}"`,
      relatedId: responseData.invitationId,
      relatedType: "invitation",
      data: responseData,
    });
  }

  static async notifyMatchInvitation(captainId, matchData) {
    return this.createNotification({
      userId: captainId,
      type: this.TYPES.MATCH_INVITATION,
      title: "Nouvelle invitation de match",
      message: `L'équipe "${matchData.senderTeamName}" vous défie pour un match`,
      relatedId: matchData.invitationId,
      relatedType: "match",
      data: matchData,
    });
  }

  static async notifyTeamJoin(teamMembers, playerData) {
    try {
      const notification = {
        type: this.TYPES.TEAM_JOIN,
        title: "Nouveau membre !",
        message: `${playerData.playerName} a rejoint l'équipe "${playerData.teamName}"`,
        relatedId: playerData.teamId,
        relatedType: "team",
        data: playerData,
      };

      const sm = getSocketManager();
      if (sm) {
        let sentCount = 0;
        teamMembers.forEach((memberId) => {
          if (memberId !== playerData.playerId) {
            const sent = sm.sendToUser(memberId, "notification", {
              ...notification,
              id: `notif-${Date.now()}-${memberId}`,
              timestamp: new Date().toISOString(),
              read: false,
            });
            if (sent) sentCount++;
          }
        });
        console.log(
          `📨 Team join notification sent to ${sentCount}/${
            teamMembers.length - 1
          } members`
        );
      }
    } catch (error) {
      console.error("❌ Error sending team join notification:", error);
    }
  }

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
    }
  }

  static async notifyAll(notification) {
    try {
      const sm = getSocketManager();
      if (sm) {
        sm.broadcast("notification", notification);
        console.log("📢 Global notification broadcasted");
      }
    } catch (error) {
      console.error("❌ Error broadcasting notification:", error);
    }
  }

  static isAvailable() {
    const sm = getSocketManager();
    return sm !== null;
  }

  // Dans NotificationService.js (si manquant)
  async notifyTeamRoleChange(userId, teamId, newRole) {
    return this.createNotification({
      userId,
      type: "role_change",
      title: "Changement de rôle",
      message: `Votre rôle dans l'équipe a changé : vous êtes maintenant ${newRole}.`,
      relatedId: teamId,
      relatedType: "team",
    });
  }
}

module.exports = NotificationService;
