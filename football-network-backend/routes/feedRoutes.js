const express = require('express');
const router = express.Router();
const feedController = require('../controllers/feedController');
const { verifyToken } = require('../middleware/authFirebase');

// --- PUBLIC ROUTES ---
router.get('/', feedController.getFeed);
router.get('/:postId/comments', feedController.getComments);

// --- PROTECTED ROUTES ---
router.use(verifyToken);

// Action logic
router.post('/', feedController.createPost);
router.post('/:postId/like', feedController.toggleLike);
router.post('/:postId/comment', feedController.addComment);

module.exports = router;
