const { auth } = require('../config/firebase');

/**
 * Middleware pour vérifier le jeton Firebase (JWT) envoyé dans le header Authorization.
 * Format attendu : "Bearer <TOKEN>"
 */
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    // Vérification du token auprès de Firebase
    const decodedToken = await auth.verifyIdToken(idToken);
    
    // Ajout des infos de l'utilisateur à l'objet req pour les routes suivantes
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Erreur lors de la vérification du token Firebase:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Unauthorized: Token expired' });
    }
    
    return res.status(403).json({ error: 'Unauthorized: Invalid token' });
  }
};

/**
 * Middleware optionnel pour s'assurer que l'utilisateur a un rôle spécifique
 * Ex: isAdmin, isOrganizer, isArbitre
 */
const requireRole = (role) => {
  return (req, res, next) => {
    // Les custom claims Firebase permettent de stocker des rôles (req.user.role)
    // Assurez-vous d'avoir défini ces claims (ex: via une fonction Admin) 
    if (req.user && req.user[role] === true) {
      next();
    } else {
      res.status(403).json({ error: `Forbidden: Requires ${role} role` });
    }
  };
};

module.exports = {
  verifyToken,
  requireRole,
};
