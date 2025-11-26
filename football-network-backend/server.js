require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const http = require("http");
const socketIo = require("socket.io");

const socketManager = require("./services/SocketManager");
const NotificationService = require("./services/NotificationService");
const path = require("path");

// Import des routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const teamRoutes = require("./routes/teams");
const matchRoutes = require("./routes/matches");
const playerInvitationRoutes = require("./routes/player-invitations");
const feedRoutes = require("./routes/feed");
const uploadRoutes = require("./routes/uploads");
const teamMediaRoutes = require("./routes/teamMediaRoutes");
const passwordRoutes = require("./routes/password");
const searchRoutes = require("./routes/search");
// Phase 2 - Nouvelles routes
const venueRoutes = require("./routes/venues");
const bookingRoutes = require("./routes/bookings");
const refereeRoutes = require("./routes/referees");
const refereeAssignmentRoutes = require("./routes/referee-assignments");
// Phase 4 - Routes admin
const adminRoutes = require("./routes/admin");
// Phase 5 - Routes participations
const participationRoutes = require("./routes/participations");
// Phase 5 - Routes venue owner
const venueOwnerRoutes = require("./routes/venue-owner");

// Import de la base de données
const db = require("./config/database");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
  // Configuration pour améliorer les performances
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Initialiser le gestionnaire de sockets
socketManager.initialize(io);

// Middleware de sécurité
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // ← IMPORTANT
    contentSecurityPolicy: false,
  })
);
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // 100 requêtes par IP
// });
// app.use("/api/", limiter);

// Middleware de parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques (uploads)
app.use(
  "/uploads",
  (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.header("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(__dirname, "uploads"))
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/player-invitations", playerInvitationRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/teams", teamMediaRoutes);
app.use("/api/password", passwordRoutes);
app.use("/api/search", searchRoutes);
// Phase 2 - Routes stades et arbitres
app.use("/api/venues", venueRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/referees", refereeRoutes);
app.use("/api/referee-assignments", refereeAssignmentRoutes);
// Phase 4 - Routes admin
app.use("/api/admin", adminRoutes);
// Phase 5 - Routes participations
app.use("/api/participations", participationRoutes);
// Phase 5 - Routes venue owner
app.use("/api/venue-owner", venueOwnerRoutes);

// Routes pour les notifications (nouvelles)
app.get(
  "/api/notifications/stats",
  require("./middleware/auth").authenticateToken,
  (req, res) => {
    // TODO: Implémenter les statistiques des notifications depuis la DB
    res.json({
      unreadCount: 0,
      totalCount: 0,
      lastUpdate: new Date().toISOString(),
    });
  }
);

// Route pour marquer les notifications comme lues
app.patch(
  "/api/notifications/:id/read",
  require("./middleware/auth").authenticateToken,
  (req, res) => {
    // TODO: Marquer la notification comme lue en DB
    res.json({ success: true });
  }
);

// Route de test
app.get("/api/health", (req, res) => {
  const stats = socketManager.getStats();
  res.json({
    status: "OK",
    message: "Football Network API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    socket: {
      connected: stats.connectedUsers > 0,
      ...stats,
    },
  });
});

// Route de test pour les notifications (développement uniquement)
if (process.env.NODE_ENV !== "production") {
  app.post(
    "/api/dev/test-notification",
    require("./middleware/auth").authenticateToken,
    (req, res) => {
      const { userId, type, message } = req.body;

      const testNotification = {
        id: `test-${Date.now()}`,
        type: type || "general",
        title: "Test Notification",
        message: message || "This is a test notification",
        timestamp: new Date().toISOString(),
        read: false,
      };

      const sent = socketManager.sendToUser(
        userId || req.user.id,
        "notification",
        testNotification
      );

      res.json({
        success: true,
        sent: sent,
        notification: testNotification,
        userOnline: socketManager.isUserOnline(userId || req.user.id),
      });
    }
  );
}

// Gestion des erreurs 404
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

// Socket.io pour le temps réel
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join_match", (matchId) => {
    socket.join(`match_${matchId}`);

    // Notifier les autres utilisateurs qu'un nouveau user est en ligne
    socket.to(`match_${matchId}`).emit("user_joined", {
      userId: socket.userId,
      socketId: socket.id,
    });
  });

  socket.on("send_message", (data) => {
    // Diffuser le message à tous les utilisateurs de ce match
    socket.to(`match_${data.matchId}`).emit("new_message", {
      id: data.messageId,
      content: data.content,
      sender: data.sender,
      sentAt: data.sentAt,
      type: "text",
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Gérer l'arrêt propre du serveur
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("✅ Process terminated");
  });
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("✅ Process terminated");
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔌 Socket.IO initialized`);
  console.log(`📬 Notification service ready`);
});
