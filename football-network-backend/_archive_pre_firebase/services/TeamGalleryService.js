const db = require("../config/database");
const imageOptimizer = require("./ImageOptimizer");
const uploadService = require("./UploadService");

class TeamGalleryService {
  // MODIFIÉ : Ajout du paramètre userId
  async createGalleryItem(teamId, uploadId, userId, options = {}) {
    const {
      caption = null,
      album = "general",
      display_order = 0,
      is_featured = false,
    } = options;

    try {
      const [result] = await db.execute(
        `INSERT INTO team_gallery 
        (team_id, upload_id, uploaded_by, caption, album, display_order, is_featured, created_at, is_active) 
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), true)`,
        [teamId, uploadId, userId, caption, album, display_order, is_featured]
      );

      return await this.getGalleryItemById(result.insertId);
    } catch (error) {
      throw new Error(`Failed to create gallery item: ${error.message}`);
    }
  }

  async getGalleryItemById(itemId) {
    try {
      const [items] = await db.execute(
        `SELECT 
          tg.*,
          u.file_path,
          u.mime_type,
          u.variants,
          u.image_width,
          u.image_height,
          up.first_name as uploader_first_name,
          up.last_name as uploader_last_name
        FROM team_gallery tg
        JOIN uploads u ON tg.upload_id = u.id
        LEFT JOIN users up ON u.uploaded_by = up.id
        WHERE tg.id = ? AND tg.is_active = true`,
        [itemId]
      );

      return items[0] || null;
    } catch (error) {
      throw new Error(`Failed to get gallery item: ${error.message}`);
    }
  }

  async getTeamGallery(teamId, options = {}) {
    const {
      album = null,
      limit = 50,
      offset = 0,
      featured_only = false,
    } = options;

    try {
      let query = `
        SELECT 
          tg.*,
          u.file_path,
          u.mime_type,
          u.variants,
          u.image_width,
          u.image_height,
          u.file_size,
          up.first_name as uploader_first_name,
          up.last_name as uploader_last_name
        FROM team_gallery tg
        JOIN uploads u ON tg.upload_id = u.id
        LEFT JOIN users up ON u.uploaded_by = up.id
        WHERE tg.team_id = ? AND tg.is_active = true
      `;

      const params = [teamId];

      if (album) {
        query += " AND tg.album = ?";
        params.push(album);
      }

      if (featured_only) {
        query += " AND tg.is_featured = true";
      }

      query +=
        " ORDER BY tg.display_order ASC, tg.created_at DESC LIMIT ? OFFSET ?";
      params.push(limit, offset);

      const [items] = await db.execute(query, params);

      // Parse variants JSON
      return items.map((item) => ({
        ...item,
        variants: item.variants ? JSON.parse(item.variants) : null,
      }));
    } catch (error) {
      throw new Error(`Failed to get team gallery: ${error.message}`);
    }
  }

  async getTeamAlbums(teamId) {
    try {
      const [albums] = await db.execute(
        `SELECT 
          album,
          COUNT(*) as photo_count,
          MAX(created_at) as last_updated
        FROM team_gallery
        WHERE team_id = ? AND is_active = true
        GROUP BY album
        ORDER BY last_updated DESC`,
        [teamId]
      );

      return albums;
    } catch (error) {
      throw new Error(`Failed to get team albums: ${error.message}`);
    }
  }

  async updateGalleryItem(itemId, teamId, updates = {}) {
    const allowedFields = ["caption", "album", "display_order", "is_featured"];
    const updateFields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updateFields.length === 0) {
      throw new Error("No valid fields to update");
    }

    try {
      values.push(itemId, teamId);

      const [result] = await db.execute(
        `UPDATE team_gallery 
        SET ${updateFields.join(", ")} 
        WHERE id = ? AND team_id = ?`,
        values
      );

      if (result.affectedRows === 0) {
        throw new Error("Gallery item not found or unauthorized");
      }

      return await this.getGalleryItemById(itemId);
    } catch (error) {
      throw new Error(`Failed to update gallery item: ${error.message}`);
    }
  }

  async deleteGalleryItem(itemId, teamId) {
    try {
      // Get the upload_id before deleting
      const [items] = await db.execute(
        "SELECT upload_id FROM team_gallery WHERE id = ? AND team_id = ?",
        [itemId, teamId]
      );

      if (items.length === 0) {
        throw new Error("Gallery item not found");
      }

      const uploadId = items[0].upload_id;

      // Soft delete the gallery item
      await db.execute(
        "UPDATE team_gallery SET is_active = false WHERE id = ?",
        [itemId]
      );

      // Check if this upload is used elsewhere
      const [otherUsages] = await db.execute(
        `SELECT COUNT(*) as count 
        FROM team_gallery 
        WHERE upload_id = ? AND id != ? AND is_active = true`,
        [uploadId, itemId]
      );

      // If not used elsewhere, delete the upload and its variants
      if (otherUsages[0].count === 0) {
        const [uploads] = await db.execute(
          "SELECT variants, file_path FROM uploads WHERE id = ?",
          [uploadId]
        );

        if (uploads.length > 0) {
          const upload = uploads[0];

          // Delete variants
          if (upload.variants) {
            const variants = JSON.parse(upload.variants);
            await imageOptimizer.deleteVariants(variants);
          }

          // Delete original file
          await uploadService.deleteFile(upload.file_path);

          // Delete upload record
          await db.execute("DELETE FROM uploads WHERE id = ?", [uploadId]);
        }
      }

      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete gallery item: ${error.message}`);
    }
  }

  // ... (Garder reorderGalleryItems, setFeaturedImage, getFeaturedImage, getGalleryStats inchangés) ...
  async reorderGalleryItems(teamId, itemOrders) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      for (const item of itemOrders) {
        await connection.execute(
          "UPDATE team_gallery SET display_order = ? WHERE id = ? AND team_id = ?",
          [item.display_order, item.id, teamId]
        );
      }
      await connection.commit();
      return { success: true };
    } catch (error) {
      await connection.rollback();
      throw new Error(`Failed to reorder gallery items: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  async setFeaturedImage(itemId, teamId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute(
        "UPDATE team_gallery SET is_featured = false WHERE team_id = ?",
        [teamId]
      );
      await connection.execute(
        "UPDATE team_gallery SET is_featured = true WHERE id = ? AND team_id = ?",
        [itemId, teamId]
      );
      await connection.commit();
      return await this.getGalleryItemById(itemId);
    } catch (error) {
      await connection.rollback();
      throw new Error(`Failed to set featured image: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  async getFeaturedImage(teamId) {
    try {
      const [items] = await db.execute(
        `SELECT tg.*, u.file_path, u.variants, u.mime_type
        FROM team_gallery tg
        JOIN uploads u ON tg.upload_id = u.id
        WHERE tg.team_id = ? AND tg.is_featured = true AND tg.is_active = true
        LIMIT 1`,
        [teamId]
      );
      if (items.length > 0) {
        const item = items[0];
        item.variants = item.variants ? JSON.parse(item.variants) : null;
        return item;
      }
      return null;
    } catch (error) {
      throw new Error(`Failed to get featured image: ${error.message}`);
    }
  }

  async getGalleryStats(teamId) {
    try {
      const [stats] = await db.execute(
        `SELECT 
          COUNT(*) as total_photos,
          COUNT(DISTINCT album) as total_albums,
          SUM(CASE WHEN is_featured = true THEN 1 ELSE 0 END) as featured_count,
          MAX(created_at) as last_upload
        FROM team_gallery
        WHERE team_id = ? AND is_active = true`,
        [teamId]
      );
      return stats[0];
    } catch (error) {
      throw new Error(`Failed to get gallery stats: ${error.message}`);
    }
  }

  // MODIFIÉ : Ajout du paramètre userId et colonne uploaded_by
  async bulkAddToGallery(teamId, uploadIds, userId, album = "general") {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const items = [];

      for (const uploadId of uploadIds) {
        const [result] = await connection.execute(
          `INSERT INTO team_gallery 
          (team_id, upload_id, uploaded_by, album, created_at, is_active) 
          VALUES (?, ?, ?, ?, NOW(), true)`,
          [teamId, uploadId, userId, album]
        );

        items.push(result.insertId);
      }

      await connection.commit();

      return items;
    } catch (error) {
      await connection.rollback();
      throw new Error(`Failed to bulk add to gallery: ${error.message}`);
    } finally {
      connection.release();
    }
  }
}

module.exports = new TeamGalleryService();
