const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { verifyToken } = require('../middleware/authFirebase');

// Toutes les routes liées aux équipes nécessitent l'authentification
router.post('/', verifyToken, teamController.createTeam);
router.get('/', verifyToken, teamController.getTeams);
router.get('/my', verifyToken, teamController.getMyTeams);
router.post('/:teamId/players', verifyToken, teamController.addPlayer);


module.exports = router;
