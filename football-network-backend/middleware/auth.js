const jwt = require("jsonwebtoken");
const db = require("../config/database");

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Vérifier que l'utilisateur existe toujours
    const [users] = await db.execute(
      "SELECT id, email, first_name, last_name, is_active FROM users WHERE id = ? AND is_active = true",
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: "User not found or inactive" });
    }

    req.user = users[0];
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

module.exports = { authenticateToken };
