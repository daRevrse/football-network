const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/authFirebase');
const { 
  createMatch, 
  getUpcomingMatches, 
  getTrendingMatches,
  getMatchDetails, 
  confirmMatch,
  cancelMatch,
  sendInvitation,
  joinMatch,
  getMatchMessages,
  sendMatchMessage,
  getReceivedInvitations,
  getSentInvitations,
  respondToInvitation,
  assignReferee,
  bookVenue,
  deleteMatch,
  getPendingValidations,
  getValidationStatus,
  validateScore,
  disputeMatch
} = require('../controllers/matchController');

// --- PUBLIC ROUTES (No Token Required) ---

/**
 * @route GET /api/matches/trending
 * @desc Get trending matches for landing page
 */
router.get('/trending', getTrendingMatches);

/**
 * @route GET /api/matches
 * @desc Get all upcoming matches
 */
router.get('/', getUpcomingMatches);

/**
 * @route GET /api/matches/:matchId
 * @desc Get match details
 */
router.get('/:matchId', getMatchDetails);

// --- PROTECTED ROUTES (Token Required) ---
router.use(verifyToken);

// Match Creation
router.post('/', createMatch);

// Invitations
router.post('/invitations', sendInvitation);
router.get('/invitations/received', getReceivedInvitations);
router.get('/invitations/sent', getSentInvitations);
router.patch('/invitations/:invitationId/respond', respondToInvitation);

// Post-Match Validation
router.get('/pending-validation/list', getPendingValidations);
router.get('/:matchId/validation-status', getValidationStatus);
router.post('/:matchId/validate-score', validateScore);
router.post('/:matchId/dispute', disputeMatch);

// Match Management
router.patch('/:matchId/confirm', confirmMatch);
router.patch('/:matchId/cancel', cancelMatch);
router.patch('/:matchId/assign-referee', assignReferee);
router.post('/:matchId/book-venue', bookVenue);
router.delete('/:matchId', deleteMatch);

// Participation & Social
router.post('/:matchId/join', joinMatch);
router.get('/:matchId/messages', getMatchMessages);
router.post('/:matchId/messages', sendMatchMessage);

module.exports = router;
