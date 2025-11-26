const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const db = require("../config/database");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Inscription
router.post(
  "/signup",
  [
    // Validation du type d'utilisateur
    body("userType")
      .optional()
      .isIn(["player", "manager"])
      .withMessage("User type must be player or manager"),

    // Validation conditionnelle pour le nom de l'équipe (Manager uniquement)
    body("teamName")
      .if(body("userType").equals("manager"))
      .trim()
      .isLength({ min: 3 })
      .withMessage("Team name is required for managers (min 3 chars)"),

    // Validations standards
    body("email").isEmail().normalizeEmail(),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("firstName")
      .trim()
      .isLength({ min: 2 })
      .withMessage("First name is required"),
    body("lastName")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Last name is required"),
    body("phone").optional().isMobilePhone(),
    body("birthDate").optional().isISO8601().toDate(),
  ],
  async (req, res) => {
    try {
      // Validation des entrées
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        email,
        password,
        firstName,
        lastName,
        phone,
        birthDate,
        userType = "player", // Par défaut 'player'
        teamName, // Nouveau champ pour manager
        position,
        skillLevel,
        locationCity,
      } = req.body;

      // Vérifier si l'email existe déjà
      const [existingUsers] = await db.execute(
        "SELECT id FROM users WHERE email = ?",
        [email]
      );

      if (existingUsers.length > 0) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Si Manager, vérifier que le nom d'équipe n'est pas pris (optionnel, mais recommandé)
      if (userType === "manager") {
        // Logique de vérification équipe ici si nécessaire
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(password, 12);

      // Définir les valeurs football (null si manager)
      const dbPosition = userType === "manager" ? null : position || "any";
      const dbSkillLevel =
        userType === "manager" ? null : skillLevel || "amateur";

      // Créer l'utilisateur
      // Note: Assurez-vous d'avoir ajouté la colonne user_type dans votre table users !
      const [result] = await db.execute(
        `INSERT INTO users (email, password, first_name, last_name, phone, birth_date, user_type, position, skill_level, location_city) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          email,
          hashedPassword,
          firstName,
          lastName,
          phone || null,
          birthDate || null,
          userType,
          dbPosition,
          dbSkillLevel,
          locationCity || null,
        ]
      );

      const newUserId = result.insertId;

      // === LOGIQUE SPÉCIALE MANAGER : CRÉATION D'ÉQUIPE ===
      if (userType === "manager") {
        // 1. Créer l'équipe
        const [teamResult] = await db.execute(
          `INSERT INTO teams (name, captain_id, skill_level, location_city, max_players) 
           VALUES (?, ?, 'amateur', ?, 15)`,
          [teamName, newUserId, locationCity || null]
        );

        const newTeamId = teamResult.insertId;

        // 2. Ajouter le manager comme membre (capitaine)
        await db.execute(
          "INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, 'captain')",
          [newTeamId, newUserId]
        );

        // 3. Initialiser les stats
        await db.execute("INSERT INTO team_stats (team_id) VALUES (?)", [
          newTeamId,
        ]);
      }

      // Générer le token JWT
      const token = jwt.sign(
        { userId: newUserId, email, userType }, // On ajoute userType au token
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.status(201).json({
        message: "User created successfully",
        token,
        user: {
          id: newUserId,
          email,
          firstName,
          lastName,
          userType,
          position: dbPosition,
          skillLevel: dbSkillLevel,
        },
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Connexion
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      // Validation des entrées
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Trouver l'utilisateur
      const [users] = await db.execute(
        "SELECT id, email, password, first_name, last_name, user_type, position, skill_level, is_active FROM users WHERE email = ?",
        [email]
      );

      if (users.length === 0) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const user = users[0];

      if (!user.is_active) {
        return res.status(401).json({ error: "Account is deactivated" });
      }

      // Vérifier le mot de passe
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Générer le token JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email, userType: user.user_type },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          userType: user.user_type,
          position: user.position,
          skillLevel: user.skill_level,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Vérification du token
router.get("/verify", authenticateToken, (req, res) => {
  res.json({
    valid: true,
    user: req.user,
  });
});

// Rafraîchissement du token
router.post("/refresh", authenticateToken, (req, res) => {
  const token = jwt.sign(
    { userId: req.user.id, email: req.user.email, userType: req.user.user_type },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );

  res.json({ token });
});

module.exports = router;
