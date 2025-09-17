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

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(password, 12);

      // Créer l'utilisateur
      const [result] = await db.execute(
        `INSERT INTO users (email, password, first_name, last_name, phone, birth_date, position, skill_level, location_city) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          email,
          hashedPassword,
          firstName,
          lastName,
          phone || null,
          birthDate || null,
          position || "any",
          skillLevel || "amateur",
          locationCity || null,
        ]
      );

      // Générer le token JWT
      const token = jwt.sign(
        { userId: result.insertId, email },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.status(201).json({
        message: "User created successfully",
        token,
        user: {
          id: result.insertId,
          email,
          firstName,
          lastName,
          position: position || "any",
          skillLevel: skillLevel || "amateur",
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
        "SELECT id, email, password, first_name, last_name, position, skill_level, is_active FROM users WHERE email = ?",
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
        { userId: user.id, email: user.email },
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
    { userId: req.user.id, email: req.user.email },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );

  res.json({ token });
});

module.exports = router;
