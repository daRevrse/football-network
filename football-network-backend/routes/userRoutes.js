const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/authFirebase');
const { getOrCreateProfile, updateProfile, getPublicProfile } = require('../controllers/userController');

// --- ROUTES UTILISATEURS ---

// GET /api/users/profile
// Récupère (ou crée) le profil de l'utilisateur connecté via son jeton JWT
router.get('/profile', verifyToken, getOrCreateProfile);

// GET /api/users/:uid
// Récupère un profil public par son UID
router.get('/:uid', verifyToken, getPublicProfile);


// PUT /api/users/profile
// Permet à l'utilisateur de modifier ses infos (nom, poste, etc.)
router.put('/profile', verifyToken, updateProfile);

module.exports = router;
