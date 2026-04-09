const { storage } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

/**
 * Upload d'un fichier vers Firebase Storage depuis le serveur Node
 */
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const bucket = storage.bucket();
    const blob = req.file;
    const folder = req.body.folder || 'misc';
    const fileName = `${folder}/${Date.now()}_${req.file.originalname}`;
    
    const file = bucket.file(fileName);

    const blobStream = file.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
      },
      resumable: false
    });

    blobStream.on('error', (err) => {
      console.error('BlobStream error:', err);
      res.status(500).json({ error: 'Erreur lors de l\'écriture du stream' });
    });

    blobStream.on('finish', async () => {
      // Rendre le fichier public (optionnel, dépend des règles Firebase Storage)
      // Pour Simplifier, on utilise getSignedUrl avec une expiration lointaine ou on rend public
      try {
        await file.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
        
        res.status(200).json({
          message: 'Upload réussi',
          url: publicUrl,
          fileName: file.name
        });
      } catch (publicErr) {
        console.error('MakePublic error:', publicErr);
        // Si makePublic échoue (ex: permissions), on tente une signed URL
        const [url] = await file.getSignedUrl({
          action: 'read',
          expires: '03-09-2491'
        });
        res.status(200).json({
          message: 'Upload réussi (Signed URL)',
          url: url,
          fileName: file.name
        });
      }
    });

    blobStream.end(req.file.buffer);

  } catch (error) {
    console.error('Upload controller error:', error);
    res.status(500).json({ error: 'Erreur interne lors de l\'upload' });
  }
};
