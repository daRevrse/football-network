const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authFirebase');
const {
    getMatchParticipations,
    validateMatch,
    getMyPendingParticipations
} = require('../controllers/participationController');

// GET /api/participations/my-pending
router.get('/my-pending', verifyToken, getMyPendingParticipations);

// GET /api/participations/match/:matchId
router.get('/match/:matchId', verifyToken, getMatchParticipations);

// POST /api/participations/match/:matchId/validate
router.post('/match/:matchId/validate', verifyToken, validateMatch);

module.exports = router;
