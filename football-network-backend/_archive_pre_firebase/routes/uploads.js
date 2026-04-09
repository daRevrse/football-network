// routes/uploads.js
const express = require("express");
const { body, validationResult } = require("express-validator");
const db = require("../config/database");
const { authenticateToken } = require("../middleware/auth");
const {
  uploadSingle,
  uploadMultiple,
  handleMulterError,
  getFileType,
  deleteFile,
  getImageDimensions,
} = require("../middleware/uploadMiddleware");
const path = require("path");

const router = express.Router();

/**
 * POST /api/uploads
 * Upload un ou plusieurs fichiers
 */
router.post(
  "/",
  authenticateToken,
  uploadMultiple("files", 5),
  handleMulterError,
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "Aucun fichier fourni" });
      }

      const {
        upload_context = "other",
        related_entity_type = null,
        related_entity_id = null,
        is_public = false,
      } = req.body;

      console.log("req.body", req.body);

      const uploadedFiles = [];

      for (const file of req.files) {
        const fileType = getFileType(file.mimetype);
        let dimensions = { width: null, height: null };

        // Obtenir les dimensions si c'est une image
        if (fileType === "image") {
          try {
            dimensions = await getImageDimensions(file.path);
          } catch (error) {
            console.error(
              "Erreur lors de la récupération des dimensions:",
              error
            );
          }
        }

        // Insérer dans la base de données
        const [result] = await db.execute(
          `INSERT INTO uploads (
            original_filename, stored_filename, file_path, mime_type, 
            file_size, file_extension, file_type, upload_context,
            uploaded_by, related_entity_type, related_entity_id,
            image_width, image_height, is_public
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            file.originalname,
            file.filename,
            file.path,
            file.mimetype,
            file.size,
            path.extname(file.originalname),
            fileType,
            upload_context,
            req.user.id,
            related_entity_type || null,
            related_entity_id || null,
            dimensions.width,
            dimensions.height,
            is_public,
          ]
        );

        uploadedFiles.push({
          id: result.insertId,
          originalFilename: file.originalname,
          storedFilename: file.filename,
          url: `/uploads/${path.basename(path.dirname(file.path))}/${
            file.filename
          }`,
          fileType: fileType,
          size: file.size,
          mimeType: file.mimetype,
          dimensions: fileType === "image" ? dimensions : null,
        });
      }

      res.status(201).json({
        success: true,
        message: `${uploadedFiles.length} fichier(s) uploadé(s) avec succès`,
        files: uploadedFiles,
      });
    } catch (error) {
      console.error("Upload error:", error);

      // Nettoyer les fichiers en cas d'erreur
      if (req.files) {
        for (const file of req.files) {
          try {
            await deleteFile(file.path);
          } catch (deleteError) {
            console.error(
              "Erreur lors de la suppression du fichier:",
              deleteError
            );
          }
        }
      }

      res.status(500).json({ error: "Erreur lors de l'upload" });
    }
  }
);

/**
 * GET /api/uploads/:id
 * Récupérer les infos d'un fichier
 */
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const uploadId = req.params.id;

    const [uploads] = await db.execute(
      `SELECT u.*, 
              us.first_name as uploader_first_name,
              us.last_name as uploader_last_name
       FROM uploads u
       JOIN users us ON u.uploaded_by = us.id
       WHERE u.id = ? AND u.is_active = true`,
      [uploadId]
    );

    if (uploads.length === 0) {
      return res.status(404).json({ error: "Fichier non trouvé" });
    }

    const upload = uploads[0];

    // Vérifier les permissions
    if (!upload.is_public && upload.uploaded_by !== req.user.id) {
      // Vérifier si l'utilisateur a accès via l'entité liée
      // (Par exemple, membre de l'équipe, participant au match, etc.)
      // Pour simplifier, on autorise l'accès pour l'instant
    }

    res.json({
      id: upload.id,
      originalFilename: upload.original_filename,
      storedFilename: upload.stored_filename,
      url: `/uploads/${path.basename(path.dirname(upload.file_path))}/${
        upload.stored_filename
      }`,
      mimeType: upload.mime_type,
      fileSize: upload.file_size,
      fileType: upload.file_type,
      uploadContext: upload.upload_context,
      dimensions: upload.image_width
        ? {
            width: upload.image_width,
            height: upload.image_height,
          }
        : null,
      uploader: {
        id: upload.uploaded_by,
        firstName: upload.uploader_first_name,
        lastName: upload.uploader_last_name,
      },
      relatedEntity: {
        type: upload.related_entity_type,
        id: upload.related_entity_id,
      },
      isPublic: upload.is_public,
      uploadedAt: upload.uploaded_at,
    });
  } catch (error) {
    console.error("Get upload error:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération du fichier" });
  }
});

/**
 * DELETE /api/uploads/:id
 * Supprimer un fichier
 */
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const uploadId = req.params.id;

    // Récupérer les infos du fichier
    const [uploads] = await db.execute(
      "SELECT * FROM uploads WHERE id = ? AND is_active = true",
      [uploadId]
    );

    if (uploads.length === 0) {
      return res.status(404).json({ error: "Fichier non trouvé" });
    }

    const upload = uploads[0];

    // Vérifier que l'utilisateur est le propriétaire
    if (upload.uploaded_by !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Non autorisé à supprimer ce fichier" });
    }

    // Vérifier si le fichier est utilisé
    const [usageCheck] = await db.execute(
      `SELECT 
        (SELECT COUNT(*) FROM users WHERE profile_picture_id = ? OR cover_photo_id = ?) +
        (SELECT COUNT(*) FROM teams WHERE logo_id = ? OR banner_id = ?) +
        (SELECT COUNT(*) FROM match_photos WHERE upload_id = ?) +
        (SELECT COUNT(*) FROM post_media WHERE upload_id = ?) +
        (SELECT COUNT(*) FROM message_attachments WHERE upload_id = ?) +
        (SELECT COUNT(*) FROM location_photos WHERE upload_id = ?)
        as usage_count`,
      [
        uploadId,
        uploadId,
        uploadId,
        uploadId,
        uploadId,
        uploadId,
        uploadId,
        uploadId,
      ]
    );

    if (usageCheck[0].usage_count > 0) {
      return res.status(400).json({
        error:
          "Ce fichier est actuellement utilisé et ne peut pas être supprimé",
      });
    }

    // Marquer comme inactif plutôt que supprimer
    await db.execute("UPDATE uploads SET is_active = false WHERE id = ?", [
      uploadId,
    ]);

    // Supprimer le fichier physique (optionnel, peut être fait par un job de nettoyage)
    try {
      await deleteFile(upload.file_path);
    } catch (deleteError) {
      console.error("Erreur lors de la suppression physique:", deleteError);
      // On continue même si la suppression physique échoue
    }

    res.json({
      success: true,
      message: "Fichier supprimé avec succès",
    });
  } catch (error) {
    console.error("Delete upload error:", error);
    res.status(500).json({ error: "Erreur lors de la suppression" });
  }
});

/**
 * GET /api/uploads/entity/:type/:id
 * Récupérer tous les fichiers liés à une entité
 */
router.get("/entity/:type/:id", authenticateToken, async (req, res) => {
  try {
    const { type, id } = req.params;
    const { file_type, upload_context } = req.query;

    let query = `
      SELECT u.id, u.original_filename, u.stored_filename, u.file_path,
             u.mime_type, u.file_size, u.file_type, u.upload_context,
             u.image_width, u.image_height, u.uploaded_at,
             us.first_name as uploader_first_name,
             us.last_name as uploader_last_name
      FROM uploads u
      JOIN users us ON u.uploaded_by = us.id
      WHERE u.related_entity_type = ? 
        AND u.related_entity_id = ? 
        AND u.is_active = true
    `;

    const queryParams = [type, id];

    if (file_type) {
      query += " AND u.file_type = ?";
      queryParams.push(file_type);
    }

    if (upload_context) {
      query += " AND u.upload_context = ?";
      queryParams.push(upload_context);
    }

    query += " ORDER BY u.uploaded_at DESC";

    const [uploads] = await db.execute(query, queryParams);

    const formattedUploads = uploads.map((upload) => ({
      id: upload.id,
      originalFilename: upload.original_filename,
      url: `/uploads/${path.basename(path.dirname(upload.file_path))}/${
        upload.stored_filename
      }`,
      mimeType: upload.mime_type,
      fileSize: upload.file_size,
      fileType: upload.file_type,
      uploadContext: upload.upload_context,
      dimensions: upload.image_width
        ? {
            width: upload.image_width,
            height: upload.image_height,
          }
        : null,
      uploader: {
        firstName: upload.uploader_first_name,
        lastName: upload.uploader_last_name,
      },
      uploadedAt: upload.uploaded_at,
    }));

    res.json({
      count: formattedUploads.length,
      files: formattedUploads,
    });
  } catch (error) {
    console.error("Get entity uploads error:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des fichiers" });
  }
});

/**
 * GET /api/uploads/my-uploads
 * Récupérer tous mes uploads
 */
router.get("/my-uploads", authenticateToken, async (req, res) => {
  try {
    const { file_type, upload_context, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT u.id, u.original_filename, u.stored_filename, u.file_path,
             u.mime_type, u.file_size, u.file_type, u.upload_context,
             u.image_width, u.image_height, u.uploaded_at,
             u.related_entity_type, u.related_entity_id
      FROM uploads u
      WHERE u.uploaded_by = ? AND u.is_active = true
    `;

    const queryParams = [req.user.id];

    if (file_type) {
      query += " AND u.file_type = ?";
      queryParams.push(file_type);
    }

    if (upload_context) {
      query += " AND u.upload_context = ?";
      queryParams.push(upload_context);
    }

    query += " ORDER BY u.uploaded_at DESC LIMIT ? OFFSET ?";
    queryParams.push(parseInt(limit), parseInt(offset));

    const [uploads] = await db.execute(query, queryParams);

    const formattedUploads = uploads.map((upload) => ({
      id: upload.id,
      originalFilename: upload.original_filename,
      url: `/uploads/${path.basename(path.dirname(upload.file_path))}/${
        upload.stored_filename
      }`,
      mimeType: upload.mime_type,
      fileSize: upload.file_size,
      fileType: upload.file_type,
      uploadContext: upload.upload_context,
      dimensions: upload.image_width
        ? {
            width: upload.image_width,
            height: upload.image_height,
          }
        : null,
      relatedEntity: {
        type: upload.related_entity_type,
        id: upload.related_entity_id,
      },
      uploadedAt: upload.uploaded_at,
    }));

    res.json({
      count: formattedUploads.length,
      files: formattedUploads,
    });
  } catch (error) {
    console.error("Get my uploads error:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération de vos fichiers" });
  }
});

module.exports = router;
