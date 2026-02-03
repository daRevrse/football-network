// football-network-backend/services/SocketManager.js
const pool = require("../config/database");

class SocketManager {
  constructor() {
    this.io = null;
    this.userSockets = new Map(); // userId -> Set of socket IDs
    this.socketUsers = new Map(); // socket ID -> userId
  }

  // Vérifier si un utilisateur a le droit de rejoindre un match
  async canUserJoinMatch(userId, matchId) {
    try {
      const [rows] = await pool.query(
        `SELECT 1 FROM matches m
         LEFT JOIN team_members tm_home ON tm_home.team_id = m.home_team_id AND tm_home.user_id = ? AND tm_home.is_active = true
         LEFT JOIN team_members tm_away ON tm_away.team_id = m.away_team_id AND tm_away.user_id = ? AND tm_away.is_active = true
         LEFT JOIN match_referee_assignments mra ON mra.match_id = m.id AND mra.referee_id = (SELECT id FROM referees WHERE user_id = ?)
         WHERE m.id = ? AND (tm_home.id IS NOT NULL OR tm_away.id IS NOT NULL OR mra.id IS NOT NULL)
         LIMIT 1`,
        [userId, userId, userId, matchId]
      );
      return rows.length > 0;
    } catch (error) {
      console.error("Error checking match permission:", error);
      return false;
    }
  }

  // Vérifier si un utilisateur fait partie d'une équipe
  async canUserJoinTeam(userId, teamId) {
    try {
      const [rows] = await pool.query(
        `SELECT 1 FROM team_members
         WHERE team_id = ? AND user_id = ? AND is_active = true
         LIMIT 1`,
        [teamId, userId]
      );
      return rows.length > 0;
    } catch (error) {
      console.error("Error checking team permission:", error);
      return false;
    }
  }

  // Initialiser avec l'instance Socket.IO
  initialize(io) {
    this.io = io;
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.io.on("connection", (socket) => {
      console.log(`🔌 Socket connected: ${socket.id}`);

      // Authentification du socket
      socket.on("authenticate", (token) => {
        this.authenticateSocket(socket, token);
      });

      // Rejoindre une room de match (avec vérification de permission)
      socket.on("join_match", async (matchId) => {
        // Vérifier que l'utilisateur est authentifié
        if (!socket.userId) {
          socket.emit("error", { message: "Authentication required to join match room" });
          return;
        }

        // Vérifier que l'utilisateur a le droit de rejoindre ce match
        const canJoin = await this.canUserJoinMatch(socket.userId, matchId);
        if (!canJoin) {
          socket.emit("error", { message: "You are not authorized to join this match room" });
          console.log(`🚫 User ${socket.userId} denied access to match ${matchId}`);
          return;
        }

        socket.join(`match_${matchId}`);
        console.log(`👥 User ${socket.userId} joined match ${matchId}`);

        // Notifier les autres participants
        socket.to(`match_${matchId}`).emit("user_joined_match", {
          userId: socket.userId,
          socketId: socket.id,
          timestamp: new Date().toISOString(),
        });
      });

      // Quitter une room de match
      socket.on("leave_match", (matchId) => {
        if (!socket.userId) return;

        socket.leave(`match_${matchId}`);
        console.log(`👥 User ${socket.userId} left match ${matchId}`);

        socket.to(`match_${matchId}`).emit("user_left_match", {
          userId: socket.userId,
          socketId: socket.id,
          timestamp: new Date().toISOString(),
        });
      });

      // Rejoindre une room d'équipe (avec vérification de permission)
      socket.on("join_team", async (teamId) => {
        // Vérifier que l'utilisateur est authentifié
        if (!socket.userId) {
          socket.emit("error", { message: "Authentication required to join team room" });
          return;
        }

        // Vérifier que l'utilisateur fait partie de l'équipe
        const canJoin = await this.canUserJoinTeam(socket.userId, teamId);
        if (!canJoin) {
          socket.emit("error", { message: "You are not a member of this team" });
          console.log(`🚫 User ${socket.userId} denied access to team ${teamId}`);
          return;
        }

        socket.join(`team_${teamId}`);
        console.log(`🏆 User ${socket.userId} joined team ${teamId}`);
      });

      // Gérer l'envoi de messages de match (avec validation)
      socket.on("send_match_message", async (data) => {
        // Vérifier que l'utilisateur est authentifié
        if (!socket.userId) {
          socket.emit("error", { message: "Authentication required to send messages" });
          return;
        }

        // Vérifier que l'utilisateur fait partie du match
        const canSend = await this.canUserJoinMatch(socket.userId, data.matchId);
        if (!canSend) {
          socket.emit("error", { message: "You are not authorized to send messages in this match" });
          return;
        }

        // Valider le contenu du message
        if (!data.content || typeof data.content !== "string" || data.content.trim().length === 0) {
          socket.emit("error", { message: "Invalid message content" });
          return;
        }

        // Limiter la longueur du message
        const sanitizedContent = data.content.trim().substring(0, 1000);

        // Rediffuser le message à tous les autres participants du match
        socket.to(`match_${data.matchId}`).emit("new_match_message", {
          id: data.messageId,
          content: sanitizedContent,
          sender: { ...data.sender, id: socket.userId }, // Forcer l'ID du sender authentifié
          sentAt: data.sentAt || new Date().toISOString(),
          type: data.type || "text",
        });
      });

      // Gestion des notifications lues
      socket.on("mark_notification_read", (notificationId) => {
        // TODO: Marquer la notification comme lue en base
        console.log(
          `📖 Notification ${notificationId} marked as read by user ${socket.userId}`
        );
      });

      // Ping/Pong pour maintenir la connexion
      socket.on("ping", () => {
        socket.emit("pong", { timestamp: Date.now() });
      });

      // Déconnexion
      socket.on("disconnect", (reason) => {
        console.log(`❌ Socket disconnected: ${socket.id} (${reason})`);
        this.handleDisconnection(socket);
      });
    });
  }

  // Authentifier un socket avec un token JWT
  async authenticateSocket(socket, token) {
    try {
      // TODO: Vérifier le token JWT
      const jwt = require("jsonwebtoken");
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      socket.userId = decoded.id;
      socket.user = decoded;

      // Associer l'utilisateur au socket
      if (!this.userSockets.has(decoded.id)) {
        this.userSockets.set(decoded.id, new Set());
      }
      this.userSockets.get(decoded.id).add(socket.id);
      this.socketUsers.set(socket.id, decoded.id);

      // Rejoindre une room personnelle pour les notifications
      socket.join(`user_${decoded.id}`);

      console.log(
        `✅ Socket ${socket.id} authenticated for user ${decoded.id}`
      );

      // Confirmer l'authentification
      socket.emit("authenticated", {
        userId: decoded.id,
        timestamp: new Date().toISOString(),
      });

      // Envoyer les notifications en attente si il y en a
      this.sendPendingNotifications(decoded.id);
    } catch (error) {
      console.error("❌ Socket authentication failed:", error.message);
      socket.emit("auth_error", {
        message: "Authentication failed",
        timestamp: new Date().toISOString(),
      });
      socket.disconnect(true);
    }
  }

  // Gérer la déconnexion d'un socket
  handleDisconnection(socket) {
    if (socket.userId) {
      const userSockets = this.userSockets.get(socket.userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          this.userSockets.delete(socket.userId);
        }
      }
      this.socketUsers.delete(socket.id);
    }
  }

  // Envoyer un message à un utilisateur spécifique
  sendToUser(userId, event, data) {
    if (!this.io) return false;

    const userSockets = this.userSockets.get(userId);
    if (userSockets && userSockets.size > 0) {
      // Envoyer à tous les sockets de l'utilisateur (multi-device)
      userSockets.forEach((socketId) => {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit(event, data);
        }
      });

      console.log(`📨 Message sent to user ${userId}: ${event}`);
      return true;
    }

    console.log(`📭 User ${userId} not connected, message queued: ${event}`);
    // TODO: Queue the message for later delivery
    return false;
  }

  // Envoyer à tous les membres d'une équipe
  sendToTeam(teamId, event, data, excludeUserId = null) {
    if (!this.io) return;

    this.io.to(`team_${teamId}`).emit(event, {
      ...data,
      teamId,
      timestamp: new Date().toISOString(),
    });

    console.log(`🏆 Message sent to team ${teamId}: ${event}`);
  }

  // Envoyer à tous les participants d'un match
  sendToMatch(matchId, event, data) {
    if (!this.io) return;

    this.io.to(`match_${matchId}`).emit(event, {
      ...data,
      matchId,
      timestamp: new Date().toISOString(),
    });

    console.log(`⚽ Message sent to match ${matchId}: ${event}`);
  }

  // Broadcast à tous les utilisateurs connectés
  broadcast(event, data) {
    if (!this.io) return;

    this.io.emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });

    console.log(`📢 Broadcast message sent: ${event}`);
  }

  // Envoyer les notifications en attente (à implémenter avec la DB)
  async sendPendingNotifications(userId) {
    // TODO: Récupérer les notifications non lues de la base de données
    // et les envoyer à l'utilisateur
    console.log(`📬 Checking pending notifications for user ${userId}`);
  }

  // Obtenir le nombre d'utilisateurs connectés
  getConnectedUsersCount() {
    return this.userSockets.size;
  }

  // Vérifier si un utilisateur est en ligne
  isUserOnline(userId) {
    const userSockets = this.userSockets.get(userId);
    return userSockets && userSockets.size > 0;
  }

  // Obtenir les statistiques des connexions
  getStats() {
    return {
      connectedUsers: this.userSockets.size,
      totalSockets: this.socketUsers.size,
      timestamp: new Date().toISOString(),
    };
  }
}

// Instance singleton
const socketManager = new SocketManager();
module.exports = socketManager;
