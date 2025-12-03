const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");
const { body, validationResult } = require("express-validator");
const db = require("../config/database");
const { authenticateToken } = require("../middleware/auth");
const EmailService = require("../services/EmailService");

const router = express.Router();

// --- INSCRIPTION ---
router.post(
  "/signup",
  [
    // Validation du type d'utilisateur
    body("userType")
      .optional()
      .isIn(["player", "manager", "referee"])
      .withMessage("User type must be player, manager or referee"),

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
        userType = "player",
        teamName,
        position,
        skillLevel,
        locationCity,
        // Champs arbitre
        licenseNumber,
        licenseLevel,
        experienceYears,
      } = req.body;

      // 1. Vérifier si l'email existe déjà
      const [existingUsers] = await db.execute(
        "SELECT id FROM users WHERE email = ?",
        [email]
      );

      if (existingUsers.length > 0) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // 2. Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(password, 12);

      // 3. Génération du token de vérification
      const verificationToken = crypto.randomBytes(32).toString("hex");
      const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

      // Définir les valeurs football (null si manager)
      const dbPosition = userType === "manager" ? null : position || "any";
      const dbSkillLevel =
        userType === "manager" ? null : skillLevel || "amateur";

      // 4. Créer l'utilisateur
      // Note: userType est bien inséré ici ('manager' ou 'player')
      const [result] = await db.execute(
        `INSERT INTO users 
        (email, password, first_name, last_name, phone, birth_date, user_type, position, skill_level, location_city, verification_token, verification_token_expires_at, is_verified) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, false)`,
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
          verificationToken,
          tokenExpiresAt,
        ]
      );

      const newUserId = result.insertId;

      // === LOGIQUE MANAGER : CRÉATION D'ÉQUIPE ===
      if (userType === "manager") {
        const [teamResult] = await db.execute(
          `INSERT INTO teams (name, captain_id, skill_level, location_city, max_players)
           VALUES (?, ?, 'amateur', ?, 15)`,
          [teamName, newUserId, locationCity || null]
        );

        const newTeamId = teamResult.insertId;

        // CORRECTION ICI : Rôle 'manager' au lieu de 'captain'
        await db.execute(
          "INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, 'manager')",
          [newTeamId, newUserId]
        );

        await db.execute("INSERT INTO team_stats (team_id) VALUES (?)", [
          newTeamId,
        ]);
      }

      // === LOGIQUE ARBITRE : CRÉATION DU PROFIL ARBITRE ===
      if (userType === "referee") {
        await db.execute(
          `INSERT INTO referees
           (user_id, first_name, last_name, email, phone, license_number, license_level,
            experience_years, location_city)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newUserId,
            firstName,
            lastName,
            email,
            phone || null,
            licenseNumber || null,
            licenseLevel || 'regional',
            experienceYears || 0,
            locationCity || null
          ]
        );

        // Mettre à jour le user_type en 'referee'
        await db.execute(
          `UPDATE users SET user_type = 'referee' WHERE id = ?`,
          [newUserId]
        );
      }

      // 5. Envoyer l'email de confirmation
      try {
        await EmailService.sendVerificationEmail(
          email,
          verificationToken,
          firstName
        );
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
      }

      // 6. Réponse
      res.status(201).json({
        message:
          "Registration successful. Please check your email to verify your account.",
        userId: newUserId,
        requiresVerification: true,
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// --- CONNEXION ---
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Trouver l'utilisateur
      const [users] = await db.execute(
        "SELECT id, email, password, first_name, last_name, user_type, position, skill_level, is_active, is_verified, verification_token FROM users WHERE email = ?",
        [email]
      );

      if (users.length === 0) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const user = users[0];

      if (!user.is_active) {
        return res.status(401).json({ error: "Account is deactivated" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      if (!user.is_verified) {
        return res.status(403).json({
          error: "Email not verified",
          message: "Please verify your email address to login.",
          requiresVerification: true,
        });
      }

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

// --- VÉRIFICATION EMAIL ---
router.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    const [users] = await db.execute(
      "SELECT id, email, first_name FROM users WHERE verification_token = ? AND verification_token_expires_at > NOW()",
      [token]
    );

    if (users.length === 0) {
      return res
        .status(400)
        .json({ error: "Invalid or expired verification link" });
    }

    const user = users[0];

    await db.execute(
      "UPDATE users SET is_verified = true, verification_token = NULL, verification_token_expires_at = NULL WHERE id = ?",
      [user.id]
    );

    try {
      await EmailService.sendWelcomeEmail(user.email, user.first_name);
    } catch (e) {
      console.error("Welcome email error:", e);
    }

    res.json({ message: "Email verified successfully. You can now login." });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// --- RENVOI EMAIL ---
router.post(
  "/resend-verification",
  [body("email").isEmail()],
  async (req, res) => {
    try {
      const { email } = req.body;

      const [users] = await db.execute(
        "SELECT id, first_name, is_verified FROM users WHERE email = ?",
        [email]
      );

      if (users.length === 0)
        return res.status(404).json({ error: "User not found" });
      if (users[0].is_verified)
        return res.status(400).json({ error: "Account already verified" });

      const verificationToken = crypto.randomBytes(32).toString("hex");
      const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await db.execute(
        "UPDATE users SET verification_token = ?, verification_token_expires_at = ? WHERE id = ?",
        [verificationToken, tokenExpiresAt, users[0].id]
      );

      await EmailService.sendVerificationEmail(
        email,
        verificationToken,
        users[0].first_name
      );

      res.json({ message: "Verification email sent" });
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

router.get("/verify", authenticateToken, (req, res) => {
  res.json({
    valid: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      firstName: req.user.first_name,
      lastName: req.user.last_name,
      userType: req.user.user_type,
      position: req.user.position,
      skillLevel: req.user.skill_level,
    },
  });
});

// Rafraîchissement du token
router.post("/refresh", authenticateToken, (req, res) => {
  const token = jwt.sign(
    {
      userId: req.user.id,
      email: req.user.email,
      userType: req.user.user_type,
    },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );

  res.json({ token });
});

module.exports = router;
