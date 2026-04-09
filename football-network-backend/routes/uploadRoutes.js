const express = require('express');
const router = express.Router();
const multer = require('multer');
const uploadController = require('../controllers/uploadController');
const { verifyToken } = require('../middleware/authFirebase');

// Configuration de Multer (stockage en mémoire)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite à 5MB
  },
});

// Route d'upload sécurisée par Firebase Auth
router.post('/', verifyToken, upload.single('file'), uploadController.uploadFile);

module.exports = router;
