// services/UploadService.js
const db = require("../config/database");
const { deleteFile } = require("../middleware/uploadMiddleware");
const path = require("path");

class UploadService {
  /**
   * Associer un upload à un profil utilisateur
   */
  static async setUserProfilePicture(userId, uploadId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Vérifier que l'upload existe et appartient à l'utilisateur
      const [uploads] = await connection.execute(
        "SELECT * FROM uploads WHERE id = ? AND uploaded_by = ? AND is_active = true",
        [uploadId, userId]
      );

      if (uploads.length === 0) {
        throw new Error("Fichier non trouvé ou non autorisé");
      }

      // Récupérer l'ancienne photo de profil
      const [users] = await connection.execute(
        "SELECT profile_picture_id FROM users WHERE id = ?",
        [userId]
      );

      const oldPictureId = users[0]?.profile_picture_id;

      // Mettre à jour le profil
      await connection.execute(
        "UPDATE users SET profile_picture_id = ? WHERE id = ?",
        [uploadId, userId]
      );

      // Mettre à jour le contexte de l'upload
      await connection.execute(
        `UPDATE uploads 
         SET upload_context = 'user_profile', 
             related_entity_type = 'user', 
             related_entity_id = ? 
         WHERE id = ?`,
        [userId, uploadId]
      );

      // Optionnel: marquer l'ancienne photo comme inactive si elle existe
      if (oldPictureId) {
        await connection.execute(
          "UPDATE uploads SET is_active = false WHERE id = ?",
          [oldPictureId]
        );
      }

      await connection.commit();
      return { success: true };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Associer un upload au logo d'une équipe
   */
  static async setTeamLogo(teamId, uploadId, userId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Vérifier que l'utilisateur est manager de l'équipe
      const [teams] = await connection.execute(
        "SELECT captain_id, logo_id FROM teams WHERE id = ? AND is_active = true",
        [teamId]
      );

      if (teams.length === 0) {
        throw new Error("Équipe non trouvée");
      }

      if (teams[0].captain_id !== userId) {
        throw new Error("Seul le manager peut modifier le logo");
      }

      // Vérifier que l'upload existe
      const [uploads] = await connection.execute(
        "SELECT * FROM uploads WHERE id = ? AND is_active = true",
        [uploadId]
      );

      if (uploads.length === 0) {
        throw new Error("Fichier non trouvé");
      }

      const oldLogoId = teams[0].logo_id;

      // Mettre à jour l'équipe
      await connection.execute("UPDATE teams SET logo_id = ? WHERE id = ?", [
        uploadId,
        teamId,
      ]);

      // Mettre à jour le contexte de l'upload
      await connection.execute(
        `UPDATE uploads 
         SET upload_context = 'team_logo', 
             related_entity_type = 'team', 
             related_entity_id = ?,
             is_public = true
         WHERE id = ?`,
        [teamId, uploadId]
      );

      // Marquer l'ancien logo comme inactif
      if (oldLogoId) {
        await connection.execute(
          "UPDATE uploads SET is_active = false WHERE id = ?",
          [oldLogoId]
        );
      }

      await connection.commit();
      return { success: true };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Ajouter des photos à un match
   */
  static async addMatchPhotos(matchId, uploadIds, userId, captions = {}) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Vérifier que l'utilisateur fait partie d'une des équipes du match
      const [membership] = await connection.execute(
        `SELECT tm.team_id 
         FROM team_members tm
         JOIN matches m ON (tm.team_id = m.home_team_id OR tm.team_id = m.away_team_id)
         WHERE tm.user_id = ? AND tm.is_active = true AND m.id = ?`,
        [userId, matchId]
      );

      if (membership.length === 0) {
        throw new Error("Non autorisé à ajouter des photos à ce match");
      }

      // Vérifier que tous les uploads existent
      const placeholders = uploadIds.map(() => "?").join(",");
      const [uploads] = await connection.execute(
        `SELECT id FROM uploads WHERE id IN (${placeholders}) AND is_active = true`,
        uploadIds
      );

      if (uploads.length !== uploadIds.length) {
        throw new Error("Certains fichiers sont introuvables");
      }

      // Ajouter les photos au match
      for (let i = 0; i < uploadIds.length; i++) {
        const uploadId = uploadIds[i];
        const caption = captions[uploadId] || null;

        await connection.execute(
          `INSERT INTO match_photos (match_id, upload_id, caption, uploaded_by, display_order)
           VALUES (?, ?, ?, ?, ?)`,
          [matchId, uploadId, caption, userId, i]
        );

        // Mettre à jour le contexte de l'upload
        await connection.execute(
          `UPDATE uploads 
           SET upload_context = 'match_photo', 
               related_entity_type = 'match', 
               related_entity_id = ?,
               is_public = true
           WHERE id = ?`,
          [matchId, uploadId]
        );
      }

      await connection.commit();
      return { success: true, photosAdded: uploadIds.length };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Ajouter des médias à un post
   */
  static async addPostMedia(postId, uploadIds, userId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Vérifier que le post existe et appartient à l'utilisateur
      const [posts] = await connection.execute(
        "SELECT user_id FROM feed_posts WHERE id = ? AND is_active = true",
        [postId]
      );

      if (posts.length === 0) {
        throw new Error("Post non trouvé");
      }

      if (posts[0].user_id !== userId) {
        throw new Error("Non autorisé à modifier ce post");
      }

      // Vérifier que tous les uploads existent et appartiennent à l'utilisateur
      const placeholders = uploadIds.map(() => "?").join(",");
      const [uploads] = await connection.execute(
        `SELECT id FROM uploads 
         WHERE id IN (${placeholders}) 
         AND uploaded_by = ? 
         AND is_active = true`,
        [...uploadIds, userId]
      );

      if (uploads.length !== uploadIds.length) {
        throw new Error("Certains fichiers sont introuvables ou non autorisés");
      }

      // Ajouter les médias au post
      for (let i = 0; i < uploadIds.length; i++) {
        const uploadId = uploadIds[i];

        await connection.execute(
          `INSERT INTO post_media (post_id, upload_id, media_order)
           VALUES (?, ?, ?)`,
          [postId, uploadId, i]
        );

        // Mettre à jour le contexte de l'upload
        await connection.execute(
          `UPDATE uploads 
           SET upload_context = 'post_media', 
               related_entity_type = 'post', 
               related_entity_id = ?
           WHERE id = ?`,
          [postId, uploadId]
        );
      }

      await connection.commit();
      return { success: true, mediaAdded: uploadIds.length };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Ajouter une pièce jointe à un message
   */
  static async addMessageAttachment(messageId, uploadId, userId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Vérifier que le message existe et appartient à l'utilisateur
      const [messages] = await connection.execute(
        "SELECT sender_id FROM messages WHERE id = ?",
        [messageId]
      );

      if (messages.length === 0) {
        throw new Error("Message non trouvé");
      }

      if (messages[0].sender_id !== userId) {
        throw new Error("Non autorisé à modifier ce message");
      }

      // Vérifier que l'upload existe et appartient à l'utilisateur
      const [uploads] = await connection.execute(
        "SELECT id FROM uploads WHERE id = ? AND uploaded_by = ? AND is_active = true",
        [uploadId, userId]
      );

      if (uploads.length === 0) {
        throw new Error("Fichier non trouvé ou non autorisé");
      }

      // Ajouter la pièce jointe
      await connection.execute(
        "INSERT INTO message_attachments (message_id, upload_id) VALUES (?, ?)",
        [messageId, uploadId]
      );

      // Mettre à jour le contexte de l'upload
      await connection.execute(
        `UPDATE uploads 
         SET upload_context = 'message_attachment', 
             related_entity_type = 'message', 
             related_entity_id = ?
         WHERE id = ?`,
        [messageId, uploadId]
      );

      await connection.commit();
      return { success: true };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Récupérer les médias d'un post avec leurs détails
   */
  static async getPostMedia(postId) {
    const [media] = await db.execute(
      `SELECT u.id, u.stored_filename, u.file_path, u.mime_type, 
              u.file_type, u.image_width, u.image_height,
              pm.media_order
       FROM post_media pm
       JOIN uploads u ON pm.upload_id = u.id
       WHERE pm.post_id = ? AND u.is_active = true
       ORDER BY pm.media_order`,
      [postId]
    );

    return media.map((m) => ({
      id: m.id,
      url: `/uploads/${path.basename(path.dirname(m.file_path))}/${
        m.stored_filename
      }`,
      type: m.file_type,
      mimeType: m.mime_type,
      dimensions: m.image_width
        ? {
            width: m.image_width,
            height: m.image_height,
          }
        : null,
      order: m.media_order,
    }));
  }

  /**
   * Récupérer les photos d'un match
   */
  static async getMatchPhotos(matchId) {
    const [photos] = await db.execute(
      `SELECT u.id, u.stored_filename, u.file_path, u.mime_type,
              u.image_width, u.image_height,
              mp.caption, mp.display_order,
              us.first_name, us.last_name
       FROM match_photos mp
       JOIN uploads u ON mp.upload_id = u.id
       JOIN users us ON mp.uploaded_by = us.id
       WHERE mp.match_id = ? AND u.is_active = true
       ORDER BY mp.display_order`,
      [matchId]
    );

    return photos.map((p) => ({
      id: p.id,
      url: `/uploads/${path.basename(path.dirname(p.file_path))}/${
        p.stored_filename
      }`,
      caption: p.caption,
      dimensions: {
        width: p.image_width,
        height: p.image_height,
      },
      uploadedBy: {
        firstName: p.first_name,
        lastName: p.last_name,
      },
      order: p.display_order,
    }));
  }

  /**
   * Nettoyer les uploads orphelins (pas de relation)
   */
  static async cleanupOrphanUploads(daysOld = 30) {
    try {
      // Récupérer les uploads orphelins
      const [orphans] = await db.execute(
        `SELECT id, file_path FROM uploads 
         WHERE related_entity_id IS NULL 
         AND related_entity_type IS NULL
         AND uploaded_at < DATE_SUB(NOW(), INTERVAL ? DAY)
         AND is_active = true`,
        [daysOld]
      );

      let deletedCount = 0;

      for (const orphan of orphans) {
        try {
          // Supprimer le fichier physique
          await deleteFile(orphan.file_path);

          // Marquer comme inactif
          await db.execute(
            "UPDATE uploads SET is_active = false WHERE id = ?",
            [orphan.id]
          );

          deletedCount++;
        } catch (error) {
          console.error(
            `Erreur lors de la suppression de l'upload ${orphan.id}:`,
            error
          );
        }
      }

      return {
        success: true,
        deletedCount,
        totalOrphans: orphans.length,
      };
    } catch (error) {
      console.error("Cleanup orphan uploads error:", error);
      throw error;
    }
  }
}

module.exports = UploadService;
