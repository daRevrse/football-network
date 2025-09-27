// football-network-backend/services/SocketManager.js
class SocketManager {
  constructor() {
    this.io = null;
    this.userSockets = new Map(); // userId -> Set of socket IDs
    this.socketUsers = new Map(); // socket ID -> userId
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

      // Rejoindre une room de match
      socket.on("join_match", (matchId) => {
        socket.join(`match_${matchId}`);
        console.log(
          `👥 User ${socket.userId || socket.id} joined match ${matchId}`
        );

        // Notifier les autres participants
        socket.to(`match_${matchId}`).emit("user_joined_match", {
          userId: socket.userId,
          socketId: socket.id,
          timestamp: new Date().toISOString(),
        });
      });

      // Quitter une room de match
      socket.on("leave_match", (matchId) => {
        socket.leave(`match_${matchId}`);
        console.log(
          `👥 User ${socket.userId || socket.id} left match ${matchId}`
        );

        socket.to(`match_${matchId}`).emit("user_left_match", {
          userId: socket.userId,
          socketId: socket.id,
          timestamp: new Date().toISOString(),
        });
      });

      // Rejoindre une room d'équipe (pour les notifications d'équipe)
      socket.on("join_team", (teamId) => {
        socket.join(`team_${teamId}`);
        console.log(
          `🏆 User ${socket.userId || socket.id} joined team ${teamId}`
        );
      });

      // Gérer l'envoi de messages de match
      socket.on("send_match_message", (data) => {
        // Rediffuser le message à tous les autres participants du match
        socket.to(`match_${data.matchId}`).emit("new_match_message", {
          id: data.messageId,
          content: data.content,
          sender: data.sender,
          sentAt: data.sentAt,
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
