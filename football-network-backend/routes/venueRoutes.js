const express = require('express');
const router = express.Router();
const venueController = require('../controllers/venueController');
const { verifyToken } = require('../middleware/authFirebase');

// Protected routes (apply verifyToken to all)
router.use(verifyToken);

// Create venue
router.post('/', venueController.createVenue);

// Get venues
router.get('/', venueController.getVenues);

// Book venue (Transaction logic)
router.post('/:venueId/book', venueController.bookVenue);

// Get venue bookings
router.get('/:venueId/bookings', venueController.getVenueBookings);

module.exports = router;
