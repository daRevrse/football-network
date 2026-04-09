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
      "SELECT id, email, first_name, last_name, user_type, is_active FROM users WHERE id = ? AND is_active = true",
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

/**
 * Middleware pour vérifier le rôle de l'utilisateur
 * @param {string|string[]} allowedRoles - Un rôle ou un tableau de rôles autorisés
 * @returns {Function} Middleware Express
 *
 * @example
 * // Un seul rôle
 * router.get('/manager-only', authenticateToken, requireRole('manager'), (req, res) => {});
 *
 * // Plusieurs rôles
 * router.get('/managers-or-players', authenticateToken, requireRole(['manager', 'player']), (req, res) => {});
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userRole = req.user.user_type;

    // Convertir en tableau si c'est une string
    const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!rolesArray.includes(userRole)) {
      return res.status(403).json({
        error: "Access forbidden",
        message: `This action requires one of these roles: ${rolesArray.join(', ')}`,
        yourRole: userRole
      });
    }

    next();
  };
};

/**
 * Middleware pour vérifier que l'utilisateur est un manager
 */
const requireManager = requireRole('manager');

/**
 * Middleware pour vérifier que l'utilisateur est un player
 */
const requirePlayer = requireRole('player');

/**
 * Middleware pour vérifier que l'utilisateur est un arbitre
 */
const requireReferee = requireRole('referee');

/**
 * Middleware pour vérifier que l'utilisateur est un superadmin
 */
const requireAdmin = requireRole('superadmin');

module.exports = {
  authenticateToken,
  requireRole,
  requireManager,
  requirePlayer,
  requireReferee,
  requireAdmin
};
