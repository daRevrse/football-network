require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const http = require("http");

// Importation de l'initialisation Firebase
const { admin, db } = require('./config/firebase');

const app = express();
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  },
});

// Partager io avec les routes si besoin
app.set("io", io);


// Middleware de sécurité
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  })
);
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Middleware de parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Route de test par défaut
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Firebase API Gateway is running (Migration Phase)",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});

// --- NOUVELLES ROUTES FIREBASE --- //
// Importation du middleware d'authentification
const { verifyToken } = require("./middleware/authFirebase");

// Exemple de route sécurisée par Firebase Auth
app.get("/api/protected", verifyToken, (req, res) => {
  res.json({
    message: "Vous avez accédé à une route sécurisée Firebase !",
    user: req.user // Contient { uid, email, ... } décodé depuis le token JWT
  });
});

// --- Importation des Routeurs ---
const userRoutes = require('./routes/userRoutes');
const matchRoutes = require('./routes/matchRoutes');
const teamRoutes = require('./routes/teamRoutes');
const venueRoutes = require('./routes/venueRoutes');
const feedRoutes = require('./routes/feedRoutes');
const refereeRoutes = require('./routes/refereeRoutes');
const participationRoutes = require('./routes/participationRoutes');
const uploadRoutes = require('./routes/uploadRoutes');


app.use("/api/users", userRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/venues", venueRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/referees", refereeRoutes);
app.use("/api/participations", participationRoutes);
app.use("/api/upload", uploadRoutes);

// --- SOCKET.IO LOGIC ---
io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  socket.on("join_match", (matchId) => {
    socket.join(`match_${matchId}`);
    console.log(`👤 User ${socket.id} joined match_${matchId}`);
  });

  socket.on("send_message", (data) => {
    // data: { matchId, content, sender, createdAt }
    const { matchId } = data;
    io.to(`match_${matchId}`).emit("new_message", data);
  });

  socket.on("disconnect", () => {
    console.log("🔌 User disconnected:", socket.id);
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
    message: process.env.NODE_ENV === "development" ? err.message : "Internal server error",
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
  console.log(`🚀 Firebase Backend Gateway running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
});
