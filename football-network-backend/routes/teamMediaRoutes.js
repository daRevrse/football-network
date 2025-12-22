const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const {
  uploadSingle,
  uploadMultiple,
} = require("../middleware/uploadMiddleware");
const UploadServiceExtension = require("../services/UploadServiceExtension");
const TeamGalleryService = require("../services/TeamGalleryService");
const db = require("../config/database");

// ============================================================================
// MIDDLEWARE POUR INJECTER LE CONTEXTE D'UPLOAD
// ============================================================================

/**
 * Middleware pour définir le contexte d'upload pour les médias d'équipe
 * Place le contexte dans req.headers pour que uploadMiddleware le détecte
 */
const setTeamContext = (context) => {
  return (req, res, next) => {
    req.headers["x-upload-context"] = context;
    console.log("✅ Contexte défini:", context);
    next();
  };
};

// ============================================================================
// ROUTES
// ============================================================================

/**
 * POST /api/teams/:teamId/media/logo
 * Upload et définir un nouveau logo d'équipe avec optimisation
 */
router.post(
  "/:teamId/media/logo",
  authenticateToken,
  setTeamContext("team_logo"), // 👈 AJOUT DU CONTEXTE
  uploadSingle("logo"),
  async (req, res) => {
    try {
      const { teamId } = req.params;
      const cropData = req.body.cropData ? JSON.parse(req.body.cropData) : null;

      if (!req.file) {
        return res.status(400).json({ error: "Aucun fichier fourni" });
      }

      // Créer l'enregistrement upload
      const [uploadResult] = await db.execute(
        `INSERT INTO uploads 
        (original_filename, stored_filename, file_path, mime_type, file_size, 
         file_extension, file_type, uploaded_by, uploaded_at, is_active) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), true)`,
        [
          req.file.originalname,
          req.file.filename,
          req.file.path,
          req.file.mimetype,
          req.file.size,
          req.file.originalname.split(".").pop(),
          "image",
          req.user.id,
        ]
      );

      const uploadId = uploadResult.insertId;

      // Optimiser et définir comme logo
      const result = await UploadServiceExtension.uploadAndOptimizeTeamLogo(
        teamId,
        uploadId,
        req.user.id,
        cropData
      );

      res.status(201).json({
        success: true,
        message: "Logo mis à jour avec succès",
        logo: {
          uploadId: result.uploadId,
          variants: result.variants,
          optimizationScore: result.optimizationScore,
        },
      });
    } catch (error) {
      console.error("Upload logo error:", error);
      res.status(500).json({
        error: error.message || "Erreur lors de l'upload du logo",
      });
    }
  }
);

/**
 * PATCH /api/teams/:teamId/media/logo/crop
 * Recadrer le logo existant
 */
router.patch(
  "/:teamId/media/logo/crop",
  authenticateToken,
  async (req, res) => {
    try {
      const { teamId } = req.params;
      const { cropData } = req.body;

      if (!cropData) {
        return res
          .status(400)
          .json({ error: "Données de recadrage manquantes" });
      }

      const result = await UploadServiceExtension.recropTeamLogo(
        teamId,
        req.user.id,
        cropData
      );

      res.json({
        success: true,
        message: "Logo recadré avec succès",
        variants: result.variants,
        optimizationScore: result.optimizationScore,
      });
    } catch (error) {
      console.error("Recrop logo error:", error);
      res.status(500).json({
        error: error.message || "Erreur lors du recadrage du logo",
      });
    }
  }
);

/**
 * POST /api/teams/:teamId/media/banner
 * Upload et définir une nouvelle bannière d'équipe
 */
router.post(
  "/:teamId/media/banner",
  authenticateToken,
  setTeamContext("team_banner"), // 👈 AJOUT DU CONTEXTE
  uploadSingle("banner"),
  async (req, res) => {
    try {
      const { teamId } = req.params;
      const position = req.body.position || "center";

      if (!req.file) {
        return res.status(400).json({ error: "Aucun fichier fourni" });
      }

      // Créer l'enregistrement upload
      const [uploadResult] = await db.execute(
        `INSERT INTO uploads 
        (original_filename, stored_filename, file_path, mime_type, file_size, 
         file_extension, file_type, uploaded_by, uploaded_at, is_active) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), true)`,
        [
          req.file.originalname,
          req.file.filename,
          req.file.path,
          req.file.mimetype,
          req.file.size,
          req.file.originalname.split(".").pop(),
          "image",
          req.user.id,
        ]
      );

      const uploadId = uploadResult.insertId;

      // Optimiser et définir comme bannière
      const result = await UploadServiceExtension.uploadAndOptimizeTeamBanner(
        teamId,
        uploadId,
        req.user.id,
        position
      );

      res.status(201).json({
        success: true,
        message: "Bannière mise à jour avec succès",
        banner: {
          uploadId: result.uploadId,
          variants: result.variants,
          position: result.position,
          optimizationScore: result.optimizationScore,
        },
      });
    } catch (error) {
      console.error("Upload banner error:", error);
      res.status(500).json({
        error: error.message || "Erreur lors de l'upload de la bannière",
      });
    }
  }
);

/**
 * PATCH /api/teams/:teamId/media/banner/position
 * Modifier la position de la bannière
 */
router.patch(
  "/:teamId/media/banner/position",
  authenticateToken,
  async (req, res) => {
    try {
      const { teamId } = req.params;
      const { position } = req.body;

      if (!position) {
        return res.status(400).json({ error: "Position manquante" });
      }

      const validPositions = ["center", "top", "bottom", "left", "right"];
      if (!validPositions.includes(position)) {
        return res.status(400).json({
          error:
            "Position invalide. Valeurs acceptées: " +
            validPositions.join(", "),
        });
      }

      // Vérifier que l'utilisateur est le capitaine
      const [teams] = await db.execute(
        "SELECT captain_id, banner_id FROM teams WHERE id = ? AND is_active = true",
        [teamId]
      );

      if (teams.length === 0) {
        return res.status(404).json({ error: "Équipe non trouvée" });
      }

      if (teams[0].captain_id !== req.user.id) {
        return res.status(403).json({
          error: "Seul le manager peut modifier la bannière",
        });
      }

      // Mettre à jour la position
      await db.execute("UPDATE teams SET banner_position = ? WHERE id = ?", [
        position,
        teamId,
      ]);

      res.json({
        success: true,
        message: "Position de la bannière mise à jour",
        position,
      });
    } catch (error) {
      console.error("Update banner position error:", error);
      res.status(500).json({
        error: error.message || "Erreur lors de la mise à jour de la position",
      });
    }
  }
);

/**
 * POST /api/teams/:teamId/media/gallery
 * Ajouter des photos à la galerie de l'équipe
 */
router.post(
  "/:teamId/media/gallery",
  authenticateToken,
  setTeamContext("team_gallery"), // 👈 AJOUT DU CONTEXTE
  uploadMultiple("photos", 10),
  async (req, res) => {
    try {
      const { teamId } = req.params;
      const { album, captions } = req.body;

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "Aucun fichier fourni" });
      }

      // Vérifier que l'utilisateur fait partie de l'équipe
      const [membership] = await db.execute(
        `SELECT user_id FROM team_members 
         WHERE team_id = ? AND user_id = ? AND is_active = true`,
        [teamId, req.user.id]
      );

      if (membership.length === 0) {
        return res.status(403).json({
          error: "Vous devez être membre de l'équipe",
        });
      }

      const uploadIds = [];
      const parsedCaptions = captions ? JSON.parse(captions) : {};

      // Créer les enregistrements uploads
      for (const file of req.files) {
        const [uploadResult] = await db.execute(
          `INSERT INTO uploads 
          (original_filename, stored_filename, file_path, mime_type, file_size, 
           file_extension, file_type, upload_context, uploaded_by, uploaded_at, is_active) 
          VALUES (?, ?, ?, ?, ?, ?, ?, 'team_gallery', ?, NOW(), true)`,
          [
            file.originalname,
            file.filename,
            file.path,
            file.mimetype,
            file.size,
            file.originalname.split(".").pop(),
            "image",
            req.user.id,
          ]
        );

        uploadIds.push(uploadResult.insertId);
      }

      // Optimiser les images
      await UploadServiceExtension.uploadAndOptimizeGalleryImages(
        uploadIds,
        req.user.id
      );

      // Ajouter à la galerie
      const albumName = album || "general";
      // const galleryItemIds = await TeamGalleryService.bulkAddToGallery(
      //   teamId,
      //   uploadIds,
      //   albumName
      // );
      const galleryItemIds = await TeamGalleryService.bulkAddToGallery(
        teamId,
        uploadIds,
        req.user.id,
        album
      );

      // Mettre à jour les légendes si fournies
      for (let i = 0; i < galleryItemIds.length; i++) {
        const itemId = galleryItemIds[i];
        const uploadId = uploadIds[i];

        if (parsedCaptions[i]) {
          await TeamGalleryService.updateGalleryItem(itemId, teamId, {
            caption: parsedCaptions[i],
          });
        }
      }

      res.status(201).json({
        success: true,
        message: `${req.files.length} photo(s) ajoutée(s) avec succès`,
        photos: galleryItemIds,
      });
    } catch (error) {
      console.error("Upload gallery photos error:", error);
      res.status(500).json({
        error: error.message || "Erreur lors de l'upload des photos",
      });
    }
  }
);

/**
 * GET /api/teams/:teamId/media/gallery
 * Récupérer les photos de la galerie avec filtres
 */
router.get("/:teamId/media/gallery", authenticateToken, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { album, limit = 50, offset = 0 } = req.query;

    const photos = await TeamGalleryService.getTeamGallery(teamId, {
      album,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      items: photos,
      total: photos.length,
    });
  } catch (error) {
    console.error("Get gallery photos error:", error);
    res.status(500).json({
      error: error.message || "Erreur lors de la récupération des photos",
    });
  }
});

/**
 * GET /api/teams/:teamId/media/gallery/albums
 * Récupérer la liste des albums avec leur nombre de photos
 */
router.get(
  "/:teamId/media/gallery/albums",
  authenticateToken,
  async (req, res) => {
    try {
      const { teamId } = req.params;

      const albums = await TeamGalleryService.getTeamAlbums(teamId);

      res.json({
        success: true,
        albums,
      });
    } catch (error) {
      console.error("Get albums error:", error);
      res.status(500).json({
        error: error.message || "Erreur lors de la récupération des albums",
      });
    }
  }
);

/**
 * GET /api/teams/:teamId/media/gallery/stats
 * Récupérer les statistiques de la galerie
 */
router.get(
  "/:teamId/media/gallery/stats",
  authenticateToken,
  async (req, res) => {
    try {
      const { teamId } = req.params;

      const stats = await TeamGalleryService.getGalleryStats(teamId);

      res.json({
        success: true,
        stats,
      });
    } catch (error) {
      console.error("Get gallery stats error:", error);
      res.status(500).json({
        error:
          error.message || "Erreur lors de la récupération des statistiques",
      });
    }
  }
);

/**
 * PATCH /api/teams/:teamId/media/gallery/:itemId
 * Modifier une photo de la galerie (légende, album)
 */
router.patch(
  "/:teamId/media/gallery/:itemId",
  authenticateToken,
  async (req, res) => {
    try {
      const { teamId, itemId } = req.params;
      const { caption, album } = req.body;

      // Vérifier que l'utilisateur est membre
      const [membership] = await db.execute(
        `SELECT user_id FROM team_members 
         WHERE team_id = ? AND user_id = ? AND is_active = true`,
        [teamId, req.user.id]
      );

      if (membership.length === 0) {
        return res.status(403).json({
          error: "Vous devez être membre de l'équipe",
        });
      }

      await TeamGalleryService.updateGalleryItem(itemId, teamId, {
        caption,
        album,
      });

      res.json({
        success: true,
        message: "Photo mise à jour avec succès",
      });
    } catch (error) {
      console.error("Update gallery photo error:", error);
      res.status(500).json({
        error: error.message || "Erreur lors de la mise à jour de la photo",
      });
    }
  }
);

/**
 * DELETE /api/teams/:teamId/media/gallery/:itemId
 * Supprimer une photo de la galerie
 */
router.delete(
  "/:teamId/media/gallery/:itemId",
  authenticateToken,
  async (req, res) => {
    try {
      const { teamId, itemId } = req.params;

      // Vérifier que l'utilisateur est capitaine
      const [teams] = await db.execute(
        "SELECT captain_id FROM teams WHERE id = ? AND is_active = true",
        [teamId]
      );

      if (teams.length === 0) {
        return res.status(404).json({ error: "Équipe non trouvée" });
      }

      if (teams[0].captain_id !== req.user.id) {
        return res.status(403).json({
          error: "Seul le manager peut supprimer des photos",
        });
      }

      await TeamGalleryService.deleteGalleryItem(itemId, teamId);

      res.json({
        success: true,
        message: "Photo supprimée avec succès",
      });
    } catch (error) {
      console.error("Delete gallery photo error:", error);
      res.status(500).json({
        error: error.message || "Erreur lors de la suppression de la photo",
      });
    }
  }
);

/**
 * POST /api/teams/:teamId/media/gallery/reorder
 * Réorganiser l'ordre des photos
 */
router.post(
  "/:teamId/media/gallery/reorder",
  authenticateToken,
  async (req, res) => {
    try {
      const { teamId } = req.params;
      const { photoIds } = req.body;

      if (!Array.isArray(photoIds)) {
        return res.status(400).json({ error: "photoIds doit être un tableau" });
      }

      // Vérifier que l'utilisateur est capitaine
      const [teams] = await db.execute(
        "SELECT captain_id FROM teams WHERE id = ? AND is_active = true",
        [teamId]
      );

      if (teams.length === 0) {
        return res.status(404).json({ error: "Équipe non trouvée" });
      }

      if (teams[0].captain_id !== req.user.id) {
        return res.status(403).json({
          error: "Seul le manager peut réorganiser les photos",
        });
      }

      // Transformer photoIds en itemOrders
      const itemOrders = photoIds.map((id, index) => ({
        id,
        display_order: index,
      }));

      await TeamGalleryService.reorderGalleryItems(teamId, itemOrders);

      res.json({
        success: true,
        message: "Photos réorganisées avec succès",
      });
    } catch (error) {
      console.error("Reorder photos error:", error);
      res.status(500).json({
        error: error.message || "Erreur lors de la réorganisation",
      });
    }
  }
);

/**
 * POST /api/teams/:teamId/media/gallery/:itemId/featured
 * Définir une photo comme mise en avant
 */
router.post(
  "/:teamId/media/gallery/:itemId/featured",
  authenticateToken,
  async (req, res) => {
    try {
      const { teamId, itemId } = req.params;

      // Vérifier que l'utilisateur est capitaine
      const [teams] = await db.execute(
        "SELECT captain_id FROM teams WHERE id = ? AND is_active = true",
        [teamId]
      );

      if (teams.length === 0) {
        return res.status(404).json({ error: "Équipe non trouvée" });
      }

      if (teams[0].captain_id !== req.user.id) {
        return res.status(403).json({
          error: "Seul le manager peut définir une photo en avant",
        });
      }

      await TeamGalleryService.setFeaturedImage(itemId, teamId);

      res.json({
        success: true,
        message: "Photo définie comme mise en avant",
      });
    } catch (error) {
      console.error("Set featured photo error:", error);
      res.status(500).json({
        error:
          error.message || "Erreur lors de la définition de la photo en avant",
      });
    }
  }
);

/**
 * GET /api/teams/:teamId/media/gallery/featured
 * Récupérer la photo mise en avant
 */
router.get(
  "/:teamId/media/gallery/featured",
  authenticateToken,
  async (req, res) => {
    try {
      const { teamId } = req.params;

      const photo = await TeamGalleryService.getFeaturedImage(teamId);

      res.json({
        success: true,
        photo: photo || null,
      });
    } catch (error) {
      console.error("Get featured photo error:", error);
      res.status(500).json({
        error:
          error.message ||
          "Erreur lors de la récupération de la photo en avant",
      });
    }
  }
);

module.exports = router;
