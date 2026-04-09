const express = require('express');
const router = express.Router();
const refereeController = require('../controllers/refereeController');
const { verifyToken } = require('../middleware/authFirebase');

// Protected routes
router.use(verifyToken);

// Submit report
router.post('/matches/:matchId/report', refereeController.submitMatchReport);

// Get assigned matches
router.get('/matches', refereeController.getAssignedMatches);

// Get all referees
router.get('/referees', refereeController.getReferees);

module.exports = router;
