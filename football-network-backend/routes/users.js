// routes/users.js - VERSION AMÉLIORÉE
const express = require("express");
const { body, validationResult } = require("express-validator");
const db = require("../config/database");
const { authenticateToken } = require("../middleware/auth");
const UploadService = require("../services/UploadService");

const router = express.Router();

// GET /api/users/profile - Récupérer le profil de l'utilisateur connecté
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const [users] = await db.execute(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.birth_date, u.bio, 
              u.position, u.skill_level, u.location_city, 
              u.location_lat, u.location_lng, u.created_at,
              u.profile_picture_id, u.cover_photo_id,
              pp.stored_filename as profile_picture_filename, pp.file_path as profile_picture_path,
              cp.stored_filename as cover_photo_filename, cp.file_path as cover_photo_path
       FROM users u
       LEFT JOIN uploads pp ON u.profile_picture_id = pp.id AND pp.is_active = true
       LEFT JOIN uploads cp ON u.cover_photo_id = cp.id AND cp.is_active = true
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = users[0];

    // Construire les URLs des photos
    const profilePictureUrl = user.profile_picture_filename
      ? `/uploads/users/${user.profile_picture_filename}`
      : null;

    const coverPhotoUrl = user.cover_photo_filename
      ? `/uploads/users/${user.cover_photo_filename}`
      : null;

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      birthDate: user.birth_date,
      bio: user.bio,
      profilePictureUrl: profilePictureUrl,
      coverPhotoUrl: coverPhotoUrl,
      position: user.position,
      skillLevel: user.skill_level,
      locationCity: user.location_city,
      coordinates: {
        lat: user.location_lat,
        lng: user.location_lng,
      },
      createdAt: user.created_at,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/users/profile - Mettre à jour le profil
router.put(
  "/profile",
  [
    authenticateToken,
    body("firstName").optional().trim().isLength({ min: 2 }),
    body("lastName").optional().trim().isLength({ min: 2 }),
    body("phone").optional(),
    body("birthDate").optional().isISO8601(),
    body("bio").optional().isLength({ max: 500 }),
    body("position")
      .optional()
      .isIn(["goalkeeper", "defender", "midfielder", "forward", "any"]),
    body("skillLevel")
      .optional()
      .isIn(["beginner", "amateur", "intermediate", "advanced", "semi_pro"]),
    body("locationCity").optional().trim().isLength({ max: 100 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        firstName,
        lastName,
        phone,
        birthDate,
        bio,
        position,
        skillLevel,
        locationCity,
        coordinates,
      } = req.body;

      const updateFields = [];
      const values = [];

      if (firstName !== undefined) {
        updateFields.push("first_name = ?");
        values.push(firstName);
      }
      if (lastName !== undefined) {
        updateFields.push("last_name = ?");
        values.push(lastName);
      }
      if (phone !== undefined) {
        updateFields.push("phone = ?");
        values.push(phone);
      }
      if (birthDate !== undefined) {
        updateFields.push("birth_date = ?");
        values.push(birthDate);
      }
      if (bio !== undefined) {
        updateFields.push("bio = ?");
        values.push(bio);
      }
      if (position !== undefined) {
        updateFields.push("position = ?");
        values.push(position);
      }
      if (skillLevel !== undefined) {
        updateFields.push("skill_level = ?");
        values.push(skillLevel);
      }
      if (locationCity !== undefined) {
        updateFields.push("location_city = ?");
        values.push(locationCity);
      }
      if (coordinates?.lat !== undefined) {
        updateFields.push("location_lat = ?");
        values.push(coordinates.lat);
      }
      if (coordinates?.lng !== undefined) {
        updateFields.push("location_lng = ?");
        values.push(coordinates.lng);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ error: "No fields to update" });
      }

      updateFields.push("updated_at = CURRENT_TIMESTAMP");
      values.push(req.user.id);

      await db.execute(
        `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`,
        values
      );

      res.json({ message: "Profile updated successfully" });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /api/users/profile/picture - Définir la photo de profil
router.post("/profile/picture", authenticateToken, async (req, res) => {
  try {
    const { uploadId } = req.body;

    console.log("req", req.body);

    if (!uploadId) {
      return res.status(400).json({ error: "Upload ID required" });
    }

    await UploadService.setUserProfilePicture(req.user.id, uploadId);

    // Récupérer l'URL de la nouvelle photo
    const [user] = await db.execute(
      `SELECT u.stored_filename 
       FROM users usr
       JOIN uploads u ON usr.profile_picture_id = u.id
       WHERE usr.id = ? AND u.is_active = true`,
      [req.user.id]
    );

    const profilePictureUrl =
      user.length > 0 ? `/uploads/users/${user[0].stored_filename}` : null;

    res.json({
      success: true,
      message: "Photo de profil mise à jour",
      profilePictureUrl: profilePictureUrl,
    });
  } catch (error) {
    console.error("Set profile picture error:", error);
    res.status(400).json({
      error: error.message || "Erreur lors de la mise à jour de la photo",
    });
  }
});

// DELETE /api/users/profile/picture - Supprimer la photo de profil
router.delete("/profile/picture", authenticateToken, async (req, res) => {
  try {
    // Récupérer l'ID de la photo actuelle
    const [users] = await db.execute(
      "SELECT profile_picture_id FROM users WHERE id = ?",
      [req.user.id]
    );

    if (users.length === 0 || !users[0].profile_picture_id) {
      return res
        .status(404)
        .json({ error: "Aucune photo de profil à supprimer" });
    }

    const uploadId = users[0].profile_picture_id;

    // Retirer la référence dans users
    await db.execute(
      "UPDATE users SET profile_picture_id = NULL WHERE id = ?",
      [req.user.id]
    );

    // Marquer l'upload comme inactif
    await db.execute("UPDATE uploads SET is_active = false WHERE id = ?", [
      uploadId,
    ]);

    res.json({
      success: true,
      message: "Photo de profil supprimée",
    });
  } catch (error) {
    console.error("Delete profile picture error:", error);
    res.status(500).json({ error: "Erreur lors de la suppression" });
  }
});

// POST /api/users/profile/cover - Définir la photo de couverture
router.post("/profile/cover", authenticateToken, async (req, res) => {
  try {
    const { uploadId } = req.body;

    if (!uploadId) {
      return res.status(400).json({ error: "Upload ID required" });
    }

    // Utiliser une logique similaire à setUserProfilePicture
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Vérifier que l'upload existe et appartient à l'utilisateur
      const [uploads] = await connection.execute(
        "SELECT * FROM uploads WHERE id = ? AND uploaded_by = ? AND is_active = true",
        [uploadId, req.user.id]
      );

      if (uploads.length === 0) {
        throw new Error("Fichier non trouvé ou non autorisé");
      }

      // Récupérer l'ancienne photo de couverture
      const [users] = await connection.execute(
        "SELECT cover_photo_id FROM users WHERE id = ?",
        [req.user.id]
      );

      const oldCoverId = users[0]?.cover_photo_id;

      // Mettre à jour le profil
      await connection.execute(
        "UPDATE users SET cover_photo_id = ? WHERE id = ?",
        [uploadId, req.user.id]
      );

      // Mettre à jour le contexte de l'upload
      await connection.execute(
        `UPDATE uploads 
         SET upload_context = 'user_cover', 
             related_entity_type = 'user', 
             related_entity_id = ? 
         WHERE id = ?`,
        [req.user.id, uploadId]
      );

      // Marquer l'ancienne photo comme inactive
      if (oldCoverId) {
        await connection.execute(
          "UPDATE uploads SET is_active = false WHERE id = ?",
          [oldCoverId]
        );
      }

      await connection.commit();

      // Récupérer l'URL de la nouvelle photo
      const [user] = await db.execute(
        `SELECT u.stored_filename 
         FROM users usr
         JOIN uploads u ON usr.cover_photo_id = u.id
         WHERE usr.id = ? AND u.is_active = true`,
        [req.user.id]
      );

      const coverPhotoUrl =
        user.length > 0 ? `/uploads/users/${user[0].stored_filename}` : null;

      res.json({
        success: true,
        message: "Photo de couverture mise à jour",
        coverPhotoUrl: coverPhotoUrl,
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Set cover photo error:", error);
    res.status(400).json({
      error: error.message || "Erreur lors de la mise à jour de la photo",
    });
  }
});

// DELETE /api/users/profile/cover - Supprimer la photo de couverture
router.delete("/profile/cover", authenticateToken, async (req, res) => {
  try {
    // Récupérer l'ID de la photo actuelle
    const [users] = await db.execute(
      "SELECT cover_photo_id FROM users WHERE id = ?",
      [req.user.id]
    );

    if (users.length === 0 || !users[0].cover_photo_id) {
      return res
        .status(404)
        .json({ error: "Aucune photo de couverture à supprimer" });
    }

    const uploadId = users[0].cover_photo_id;

    // Retirer la référence dans users
    await db.execute("UPDATE users SET cover_photo_id = NULL WHERE id = ?", [
      req.user.id,
    ]);

    // Marquer l'upload comme inactif
    await db.execute("UPDATE uploads SET is_active = false WHERE id = ?", [
      uploadId,
    ]);

    res.json({
      success: true,
      message: "Photo de couverture supprimée",
    });
  } catch (error) {
    console.error("Delete cover photo error:", error);
    res.status(500).json({ error: "Erreur lors de la suppression" });
  }
});

// GET /api/users/stats - Récupérer les statistiques de l'utilisateur
router.get("/stats", authenticateToken, async (req, res) => {
  try {
    // Compter le nombre d'équipes
    const [teams] = await db.execute(
      `SELECT COUNT(DISTINCT tm.team_id) as count
       FROM team_members tm
       WHERE tm.user_id = ? AND tm.is_active = true`,
      [req.user.id]
    );

    // Compter le nombre de matchs joués
    const [matches] = await db.execute(
      `SELECT COUNT(DISTINCT m.id) as count
       FROM matches m
       JOIN team_members tm ON (tm.team_id = m.home_team_id OR tm.team_id = m.away_team_id)
       WHERE tm.user_id = ? 
         AND tm.is_active = true 
         AND m.status = 'completed'`,
      [req.user.id]
    );

    // Calculer le taux de victoire
    const [wins] = await db.execute(
      `SELECT COUNT(DISTINCT m.id) as count
       FROM matches m
       JOIN team_members tm ON tm.team_id = m.home_team_id
       WHERE tm.user_id = ? 
         AND tm.is_active = true 
         AND m.status = 'completed'
         AND m.home_score > m.away_score
       UNION ALL
       SELECT COUNT(DISTINCT m.id) as count
       FROM matches m
       JOIN team_members tm ON tm.team_id = m.away_team_id
       WHERE tm.user_id = ? 
         AND tm.is_active = true 
         AND m.status = 'completed'
         AND m.away_score > m.home_score`,
      [req.user.id, req.user.id]
    );

    const totalWins = wins.reduce((sum, row) => sum + row.count, 0);
    const totalMatches = matches[0].count;
    const winRate =
      totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;

    res.json({
      teamsCount: teams[0].count,
      matchesCount: totalMatches,
      winsCount: totalWins,
      winRate: winRate,
    });
  } catch (error) {
    console.error("Get user stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/users/search - Rechercher des joueurs
router.get("/search", authenticateToken, async (req, res) => {
  try {
    const {
      position,
      skillLevel,
      city,
      lat,
      lng,
      radius = 50, // km
      limit = 20,
      offset = 0,
    } = req.query;

    let query = `
      SELECT u.id, u.first_name, u.last_name, u.position, u.skill_level, 
             u.location_city, u.location_lat, u.location_lng,
             pp.stored_filename as profile_picture_filename,
             ${
               lat && lng
                 ? `
             (6371 * acos(cos(radians(?)) * cos(radians(u.location_lat)) * 
              cos(radians(u.location_lng) - radians(?)) + sin(radians(?)) * 
              sin(radians(u.location_lat)))) AS distance
             `
                 : "NULL as distance"
             }
      FROM users u
      LEFT JOIN uploads pp ON u.profile_picture_id = pp.id AND pp.is_active = true
      WHERE u.is_active = true AND u.id != ?
    `;

    const queryParams = [];

    if (lat && lng) {
      queryParams.push(lat, lng, lat);
    }
    queryParams.push(req.user.id);

    if (position && position !== "any") {
      query += " AND u.position = ?";
      queryParams.push(position);
    }

    if (skillLevel) {
      query += " AND u.skill_level = ?";
      queryParams.push(skillLevel);
    }

    if (city) {
      query += " AND u.location_city LIKE ?";
      queryParams.push(`%${city}%`);
    }

    if (lat && lng && radius) {
      query += ` HAVING distance < ?`;
      queryParams.push(radius);
      query += ` ORDER BY distance`;
    } else {
      query += ` ORDER BY u.created_at DESC`;
    }

    query += ` LIMIT ? OFFSET ?`;
    queryParams.push(parseInt(limit), parseInt(offset));

    const [users] = await db.execute(query, queryParams);

    const formattedUsers = users.map((user) => ({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      position: user.position,
      skillLevel: user.skill_level,
      locationCity: user.location_city,
      profilePictureUrl: user.profile_picture_filename
        ? `/uploads/users/${user.profile_picture_filename}`
        : null,
      distance: user.distance ? Math.round(user.distance * 10) / 10 : null,
    }));

    res.json(formattedUsers);
  } catch (error) {
    console.error("Search users error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/users/search - Rechercher des joueurs
router.get("/recruit", authenticateToken, async (req, res) => {
  try {
    const {
      search,
      position,
      skillLevel,
      city,
      lat,
      lng,
      radius = 50,
      limit = 20,
      offset = 0,
    } = req.query;

    let query = `
      SELECT u.id, u.first_name, u.last_name, u.position, u.skill_level, 
             u.location_city, u.location_lat, u.location_lng,
             pp.stored_filename as profile_picture_filename,
             ${
               lat && lng
                 ? `
             (6371 * acos(cos(radians(?)) * cos(radians(u.location_lat)) * cos(radians(u.location_lng) - radians(?)) + sin(radians(?)) * sin(radians(u.location_lat)))) AS distance,
             `
                 : "NULL as distance,"
             }
             -- Nouvelle colonne : Liste des équipes du capitaine qui ont déjà invité ce joueur (en attente)
             (
                SELECT GROUP_CONCAT(t.name SEPARATOR ', ')
                FROM player_invitations pi
                JOIN teams t ON pi.team_id = t.id
                WHERE pi.user_id = u.id 
                  AND pi.status = 'pending'
                  AND t.captain_id = ? 
             ) as invited_by_teams
      FROM users u
      LEFT JOIN uploads pp ON u.profile_picture_id = pp.id AND pp.is_active = true
      WHERE u.is_active = true 
      AND u.id != ?               -- Exclure soi-même
      AND u.user_type = 'player'  -- Exclure les non-joueurs
      
      -- Exclure les joueurs déjà DANS une de mes équipes
      AND NOT EXISTS (
        SELECT 1
        FROM team_members tm_target
        JOIN team_members tm_me ON tm_target.team_id = tm_me.team_id
        WHERE tm_me.user_id = ? 
          AND tm_target.user_id = u.id
          AND tm_me.is_active = true 
          AND tm_target.is_active = true
      )
    `;

    const queryParams = [];

    // 1. Paramètres de distance
    if (lat && lng) {
      queryParams.push(lat, lng, lat);
    }

    // 2. Paramètres pour invited_by_teams (captain_id)
    queryParams.push(req.user.id);

    // 3. Paramètres d'exclusion
    queryParams.push(req.user.id); // Exclure soi-même
    queryParams.push(req.user.id); // Exclure membres existants

    // 4. Filtres
    if (search) {
      query +=
        " AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)";
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern);
    }

    if (position && position !== "any") {
      query += " AND u.position = ?";
      queryParams.push(position);
    }

    if (skillLevel) {
      query += " AND u.skill_level = ?";
      queryParams.push(skillLevel);
    }

    if (city) {
      query += " AND u.location_city LIKE ?";
      queryParams.push(`%${city}%`);
    }

    // 5. Tri et Pagination
    // On peut trier pour afficher ceux qu'on n'a pas encore invités en premier
    query += ` ORDER BY (invited_by_teams IS NOT NULL) ASC, u.created_at DESC`;
    query += ` LIMIT ? OFFSET ?`;
    queryParams.push(parseInt(limit), parseInt(offset));

    const [users] = await db.execute(query, queryParams);

    const formattedUsers = users.map((user) => ({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      position: user.position,
      skillLevel: user.skill_level,
      locationCity: user.location_city,
      profilePictureUrl: user.profile_picture_filename
        ? `/uploads/users/${user.profile_picture_filename}`
        : null,
      distance: user.distance ? Math.round(user.distance * 10) / 10 : null,
      // Nouveau champ envoyé au front
      invitedByTeams: user.invited_by_teams
        ? user.invited_by_teams.split(", ")
        : [],
    }));

    res.json(formattedUsers);
  } catch (error) {
    console.error("Search users error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/users/:id - Récupérer le profil public d'un utilisateur
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;

    const [users] = await db.execute(
      `SELECT u.id, u.first_name, u.last_name, u.bio, u.position, u.skill_level,
              u.location_city, u.created_at, u.user_type,
              pp.stored_filename as profile_picture,
              cp.stored_filename as cover_photo
       FROM users u
       LEFT JOIN uploads pp ON u.profile_picture_id = pp.id AND pp.is_active = true
       LEFT JOIN uploads cp ON u.cover_photo_id = cp.id AND cp.is_active = true
       WHERE u.id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = users[0];

    // Statistiques publiques
    const [teams] = await db.execute(
      `SELECT COUNT(DISTINCT tm.team_id) as count
       FROM team_members tm
       WHERE tm.user_id = ? AND tm.is_active = true`,
      [userId]
    );

    const [matches] = await db.execute(
      `SELECT COUNT(DISTINCT m.id) as count
       FROM matches m
       JOIN team_members tm ON (tm.team_id = m.home_team_id OR tm.team_id = m.away_team_id)
       WHERE tm.user_id = ? AND tm.is_active = true AND m.status = 'completed'`,
      [userId]
    );

    res.json({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      bio: user.bio,
      position: user.position,
      skillLevel: user.skill_level,
      locationCity: user.location_city,
      userType: user.user_type,
      profilePictureUrl: user.profile_picture
        ? `/uploads/users/${user.profile_picture}`
        : null,
      coverPhotoUrl: user.cover_photo
        ? `/uploads/users/${user.cover_photo}`
        : null,
      createdAt: user.created_at,
      stats: {
        teamsCount: teams[0].count,
        matchesCount: matches[0].count,
      },
    });
  } catch (error) {
    console.error("Get user profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
