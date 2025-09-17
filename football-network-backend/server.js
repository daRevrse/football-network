require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const http = require("http");
const socketIo = require("socket.io");

// Import des routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const teamRoutes = require("./routes/teams");
const matchRoutes = require("./routes/matches");

// Import de la base de données
const db = require("./config/database");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Middleware de sécurité
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par IP
});
app.use("/api/", limiter);

// Middleware de parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/matches", matchRoutes);

// Route de test
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Football Network API is running",
    timestamp: new Date().toISOString(),
  });
});

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

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
});
