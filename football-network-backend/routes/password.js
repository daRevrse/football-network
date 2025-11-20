const express = require("express");
const { body, validationResult } = require("express-validator");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const db = require("../config/database");
const emailService = require("../services/EmailService");

const router = express.Router();

// POST /api/password/forgot - Demander un reset de mot de passe
router.post(
  "/forgot",
  [body("email").isEmail().withMessage("Email valide requis")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email } = req.body;

      // Vérifier que l'utilisateur existe
      const [users] = await db.execute(
        "SELECT id, first_name, email FROM users WHERE email = ? AND is_active = true",
        [email]
      );

      // Pour des raisons de sécurité, on retourne toujours le même message
      // même si l'utilisateur n'existe pas (évite l'énumération d'emails)
      if (users.length === 0) {
        return res.json({
          message:
            "Si cet email existe dans notre système, vous recevrez un lien de réinitialisation.",
        });
      }

      const user = users[0];

      // Générer un token sécurisé
      const token = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

      // Token valide pendant 1 heure
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      // Invalider les anciens tokens non utilisés
      await db.execute(
        "UPDATE password_reset_tokens SET used = true WHERE user_id = ? AND used = false",
        [user.id]
      );

      // Sauvegarder le nouveau token
      await db.execute(
        "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
        [user.id, hashedToken, expiresAt]
      );

      // Envoyer l'email (utiliser le token non hashé)
      try {
        await emailService.sendPasswordResetEmail(
          user.email,
          token,
          user.first_name
        );
      } catch (emailError) {
        console.error("Error sending reset email:", emailError);
        // On ne révèle pas l'erreur au client pour des raisons de sécurité
      }

      res.json({
        message:
          "Si cet email existe dans notre système, vous recevrez un lien de réinitialisation.",
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

// POST /api/password/reset - Réinitialiser le mot de passe
router.post(
  "/reset",
  [
    body("token").notEmpty().withMessage("Token requis"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Le mot de passe doit contenir au moins 6 caractères"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { token, password } = req.body;

      // Hasher le token pour le comparer avec la base de données
      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      // Trouver le token valide
      const [tokens] = await db.execute(
        `SELECT prt.id, prt.user_id, prt.expires_at, prt.used, u.email, u.first_name
         FROM password_reset_tokens prt
         JOIN users u ON prt.user_id = u.id
         WHERE prt.token = ? AND prt.used = false AND prt.expires_at > NOW()`,
        [hashedToken]
      );

      if (tokens.length === 0) {
        return res.status(400).json({
          error: "Token invalide ou expiré. Veuillez faire une nouvelle demande.",
        });
      }

      const resetToken = tokens[0];

      // Hasher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);

      // Mettre à jour le mot de passe
      await db.execute("UPDATE users SET password = ? WHERE id = ?", [
        hashedPassword,
        resetToken.user_id,
      ]);

      // Marquer le token comme utilisé
      await db.execute(
        "UPDATE password_reset_tokens SET used = true WHERE id = ?",
        [resetToken.id]
      );

      res.json({
        message: "Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.",
      });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

// GET /api/password/validate-token/:token - Vérifier la validité d'un token
router.get("/validate-token/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const [tokens] = await db.execute(
      "SELECT id FROM password_reset_tokens WHERE token = ? AND used = false AND expires_at > NOW()",
      [hashedToken]
    );

    if (tokens.length === 0) {
      return res.status(400).json({
        valid: false,
        error: "Token invalide ou expiré",
      });
    }

    res.json({ valid: true });
  } catch (error) {
    console.error("Validate token error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
