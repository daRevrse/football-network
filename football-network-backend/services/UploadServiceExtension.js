const db = require("../config/database");
const imageOptimizer = require("./ImageOptimizer");
const path = require("path");
const fs = require("fs").promises;

class UploadServiceExtension {
  /**
   * Upload et optimisation d'un logo d'équipe avec recadrage optionnel
   */
  static async uploadAndOptimizeTeamLogo(
    teamId,
    uploadId,
    userId,
    cropData = null
  ) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Vérifier que l'utilisateur est le capitaine
      const [teams] = await connection.execute(
        "SELECT captain_id, logo_id FROM teams WHERE id = ? AND is_active = true",
        [teamId]
      );

      if (teams.length === 0) {
        throw new Error("Équipe non trouvée");
      }

      if (teams[0].captain_id !== userId) {
        throw new Error("Seul le capitaine peut modifier le logo");
      }

      // Récupérer l'upload
      const [uploads] = await connection.execute(
        "SELECT * FROM uploads WHERE id = ? AND uploaded_by = ? AND is_active = true",
        [uploadId, userId]
      );

      if (uploads.length === 0) {
        throw new Error("Fichier non trouvé");
      }

      const upload = uploads[0];
      const filePath = path.join(__dirname, "../", upload.file_path);

      // Optimiser et générer les variants
      const variants = await imageOptimizer.optimizeLogo(filePath, cropData);

      // Calculer le score d'optimisation
      const optimizationScore = imageOptimizer.calculateOptimizationScore(
        upload.file_size,
        variants
      );

      // Mettre à jour l'upload avec les variants
      await connection.execute(
        `UPDATE uploads 
         SET variants = ?,
             upload_context = 'team_logo',
             related_entity_type = 'team',
             related_entity_id = ?,
             is_public = true,
             optimization_score = ?,
             processed_at = NOW()
         WHERE id = ?`,
        [JSON.stringify(variants), teamId, optimizationScore, uploadId]
      );

      // Récupérer l'ancien logo
      const oldLogoId = teams[0].logo_id;

      // Mettre à jour l'équipe
      await connection.execute("UPDATE teams SET logo_id = ? WHERE id = ?", [
        uploadId,
        teamId,
      ]);

      // Supprimer l'ancien logo et ses variants
      if (oldLogoId && oldLogoId !== uploadId) {
        const [oldUploads] = await connection.execute(
          "SELECT file_path, variants FROM uploads WHERE id = ?",
          [oldLogoId]
        );

        if (oldUploads.length > 0) {
          const oldUpload = oldUploads[0];

          // Supprimer les variants
          if (oldUpload.variants) {
            const oldVariants = JSON.parse(oldUpload.variants);
            await imageOptimizer.deleteVariants(oldVariants);
          }

          // Supprimer le fichier original
          try {
            await fs.unlink(path.join(__dirname, "../", oldUpload.file_path));
          } catch (error) {
            console.error("Erreur suppression ancien logo:", error);
          }

          // Supprimer l'enregistrement
          await connection.execute("DELETE FROM uploads WHERE id = ?", [
            oldLogoId,
          ]);
        }
      }

      await connection.commit();

      return {
        success: true,
        uploadId,
        variants,
        optimizationScore,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Upload et optimisation d'une bannière d'équipe
   */
  static async uploadAndOptimizeTeamBanner(
    teamId,
    uploadId,
    userId,
    position = "center"
  ) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Vérifier que l'utilisateur est le capitaine
      const [teams] = await connection.execute(
        "SELECT captain_id, banner_id FROM teams WHERE id = ? AND is_active = true",
        [teamId]
      );

      if (teams.length === 0) {
        throw new Error("Équipe non trouvée");
      }

      if (teams[0].captain_id !== userId) {
        throw new Error("Seul le capitaine peut modifier la bannière");
      }

      // Récupérer l'upload
      const [uploads] = await connection.execute(
        "SELECT * FROM uploads WHERE id = ? AND uploaded_by = ? AND is_active = true",
        [uploadId, userId]
      );

      if (uploads.length === 0) {
        throw new Error("Fichier non trouvé");
      }

      const upload = uploads[0];
      const filePath = path.join(__dirname, "../", upload.file_path);

      // Optimiser et générer les variants
      const variants = await imageOptimizer.optimizeBanner(filePath, position);

      // Calculer le score d'optimisation
      const optimizationScore = imageOptimizer.calculateOptimizationScore(
        upload.file_size,
        variants
      );

      // Mettre à jour l'upload avec les variants
      await connection.execute(
        `UPDATE uploads 
         SET variants = ?,
             upload_context = 'team_banner',
             related_entity_type = 'team',
             related_entity_id = ?,
             is_public = true,
             optimization_score = ?,
             processed_at = NOW()
         WHERE id = ?`,
        [JSON.stringify(variants), teamId, optimizationScore, uploadId]
      );

      // Récupérer l'ancienne bannière
      const oldBannerId = teams[0].banner_id;

      // Mettre à jour l'équipe
      await connection.execute(
        "UPDATE teams SET banner_id = ?, banner_position = ? WHERE id = ?",
        [uploadId, position, teamId]
      );

      // Supprimer l'ancienne bannière et ses variants
      if (oldBannerId && oldBannerId !== uploadId) {
        const [oldUploads] = await connection.execute(
          "SELECT file_path, variants FROM uploads WHERE id = ?",
          [oldBannerId]
        );

        if (oldUploads.length > 0) {
          const oldUpload = oldUploads[0];

          // Supprimer les variants
          if (oldUpload.variants) {
            const oldVariants = JSON.parse(oldUpload.variants);
            await imageOptimizer.deleteVariants(oldVariants);
          }

          // Supprimer le fichier original
          try {
            await fs.unlink(path.join(__dirname, "../", oldUpload.file_path));
          } catch (error) {
            console.error("Erreur suppression ancienne bannière:", error);
          }

          // Supprimer l'enregistrement
          await connection.execute("DELETE FROM uploads WHERE id = ?", [
            oldBannerId,
          ]);
        }
      }

      await connection.commit();

      return {
        success: true,
        uploadId,
        variants,
        position,
        optimizationScore,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Upload et optimisation d'images pour la galerie
   */
  static async uploadAndOptimizeGalleryImages(uploadIds, userId) {
    const optimizedUploads = [];

    for (const uploadId of uploadIds) {
      try {
        // Récupérer l'upload
        const [uploads] = await db.execute(
          "SELECT * FROM uploads WHERE id = ? AND uploaded_by = ? AND is_active = true",
          [uploadId, userId]
        );

        if (uploads.length === 0) {
          console.error(`Upload ${uploadId} non trouvé`);
          continue;
        }

        const upload = uploads[0];
        const filePath = path.join(__dirname, "../", upload.file_path);

        // Optimiser et générer les variants
        const variants = await imageOptimizer.optimizeGalleryImage(filePath);

        // Calculer le score d'optimisation
        const optimizationScore = imageOptimizer.calculateOptimizationScore(
          upload.file_size,
          variants
        );

        // Mettre à jour l'upload avec les variants
        await db.execute(
          `UPDATE uploads 
           SET variants = ?,
               optimization_score = ?,
               processed_at = NOW()
           WHERE id = ?`,
          [JSON.stringify(variants), optimizationScore, uploadId]
        );

        optimizedUploads.push({
          uploadId,
          variants,
          optimizationScore,
        });
      } catch (error) {
        console.error(`Erreur optimisation upload ${uploadId}:`, error);
      }
    }

    return optimizedUploads;
  }

  /**
   * Recadrer un logo existant
   */
  static async recropTeamLogo(teamId, userId, cropData) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Vérifier que l'utilisateur est le capitaine
      const [teams] = await connection.execute(
        "SELECT captain_id, logo_id FROM teams WHERE id = ? AND is_active = true",
        [teamId]
      );

      if (teams.length === 0) {
        throw new Error("Équipe non trouvée");
      }

      if (teams[0].captain_id !== userId) {
        throw new Error("Seul le capitaine peut modifier le logo");
      }

      const logoId = teams[0].logo_id;
      if (!logoId) {
        throw new Error("Aucun logo à recadrer");
      }

      // Récupérer le logo actuel
      const [uploads] = await connection.execute(
        "SELECT * FROM uploads WHERE id = ? AND is_active = true",
        [logoId]
      );

      if (uploads.length === 0) {
        throw new Error("Logo non trouvé");
      }

      const upload = uploads[0];
      const filePath = path.join(__dirname, "../", upload.file_path);

      // Supprimer les anciens variants
      if (upload.variants) {
        const oldVariants = JSON.parse(upload.variants);
        await imageOptimizer.deleteVariants(oldVariants);
      }

      // Régénérer avec le nouveau recadrage
      const variants = await imageOptimizer.optimizeLogo(filePath, cropData);

      // Calculer le nouveau score
      const optimizationScore = imageOptimizer.calculateOptimizationScore(
        upload.file_size,
        variants
      );

      // Mettre à jour l'upload
      await connection.execute(
        `UPDATE uploads 
         SET variants = ?,
             optimization_score = ?,
             processed_at = NOW()
         WHERE id = ?`,
        [JSON.stringify(variants), optimizationScore, logoId]
      );

      await connection.commit();

      return {
        success: true,
        variants,
        optimizationScore,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Mettre à jour la position de la bannière
   */
  static async updateBannerPosition(teamId, userId, position) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Vérifier que l'utilisateur est le capitaine
      const [teams] = await connection.execute(
        "SELECT captain_id, banner_id FROM teams WHERE id = ? AND is_active = true",
        [teamId]
      );

      if (teams.length === 0) {
        throw new Error("Équipe non trouvée");
      }

      if (teams[0].captain_id !== userId) {
        throw new Error("Seul le capitaine peut modifier la bannière");
      }

      const bannerId = teams[0].banner_id;
      if (!bannerId) {
        throw new Error("Aucune bannière à repositionner");
      }

      // Récupérer la bannière actuelle
      const [uploads] = await connection.execute(
        "SELECT * FROM uploads WHERE id = ? AND is_active = true",
        [bannerId]
      );

      if (uploads.length === 0) {
        throw new Error("Bannière non trouvée");
      }

      const upload = uploads[0];
      const filePath = path.join(__dirname, "../", upload.file_path);

      // Supprimer les anciens variants
      if (upload.variants) {
        const oldVariants = JSON.parse(upload.variants);
        await imageOptimizer.deleteVariants(oldVariants);
      }

      // Régénérer avec la nouvelle position
      const variants = await imageOptimizer.optimizeBanner(filePath, position);

      // Calculer le nouveau score
      const optimizationScore = imageOptimizer.calculateOptimizationScore(
        upload.file_size,
        variants
      );

      // Mettre à jour l'upload
      await connection.execute(
        `UPDATE uploads 
         SET variants = ?,
             optimization_score = ?,
             processed_at = NOW()
         WHERE id = ?`,
        [JSON.stringify(variants), optimizationScore, bannerId]
      );

      // Mettre à jour la position dans teams
      await connection.execute(
        "UPDATE teams SET banner_position = ? WHERE id = ?",
        [position, teamId]
      );

      await connection.commit();

      return {
        success: true,
        position,
        variants,
        optimizationScore,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Obtenir les informations d'un upload avec ses variants
   */
  static async getUploadWithVariants(uploadId) {
    try {
      const [uploads] = await db.execute(
        `SELECT 
          u.*,
          us.first_name,
          us.last_name
         FROM uploads u
         LEFT JOIN users us ON u.uploaded_by = us.id
         WHERE u.id = ? AND u.is_active = true`,
        [uploadId]
      );

      if (uploads.length === 0) {
        return null;
      }

      const upload = uploads[0];

      return {
        id: upload.id,
        originalFilename: upload.original_filename,
        filePath: upload.file_path,
        mimeType: upload.mime_type,
        fileSize: upload.file_size,
        dimensions: {
          width: upload.image_width,
          height: upload.image_height,
        },
        variants: upload.variants ? JSON.parse(upload.variants) : null,
        optimizationScore: upload.optimization_score,
        uploadContext: upload.upload_context,
        uploader: {
          id: upload.uploaded_by,
          firstName: upload.first_name,
          lastName: upload.last_name,
        },
        uploadedAt: upload.uploaded_at,
        processedAt: upload.processed_at,
      };
    } catch (error) {
      throw new Error(`Failed to get upload: ${error.message}`);
    }
  }
}

module.exports = UploadServiceExtension;
