const express = require("express");
const { body, validationResult } = require("express-validator");
const db = require("../config/database");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// GET /api/users/profile - Récupérer le profil de l'utilisateur connecté
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const [users] = await db.execute(
      `SELECT id, email, first_name, last_name, phone, birth_date, bio, 
              profile_picture, position, skill_level, location_city, 
              location_lat, location_lng, created_at 
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = users[0];
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      birthDate: user.birth_date,
      bio: user.bio,
      profilePicture: user.profile_picture,
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
    body("phone").optional().isMobilePhone(),
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
      SELECT id, first_name, last_name, position, skill_level, 
             location_city, location_lat, location_lng,
             ${
               lat && lng
                 ? `
             (6371 * acos(cos(radians(?)) * cos(radians(location_lat)) * 
              cos(radians(location_lng) - radians(?)) + sin(radians(?)) * 
              sin(radians(location_lat)))) AS distance
             `
                 : "NULL as distance"
             }
      FROM users 
      WHERE is_active = true AND id != ?
    `;

    const queryParams = [];

    if (lat && lng) {
      queryParams.push(lat, lng, lat);
    }
    queryParams.push(req.user.id);

    if (position && position !== "any") {
      query += " AND position = ?";
      queryParams.push(position);
    }

    if (skillLevel) {
      query += " AND skill_level = ?";
      queryParams.push(skillLevel);
    }

    if (city) {
      query += " AND location_city LIKE ?";
      queryParams.push(`%${city}%`);
    }

    if (lat && lng && radius) {
      query += ` HAVING distance < ?`;
      queryParams.push(radius);
      query += ` ORDER BY distance`;
    } else {
      query += ` ORDER BY created_at DESC`;
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
      distance: user.distance ? Math.round(user.distance * 10) / 10 : null,
    }));

    res.json(formattedUsers);
  } catch (error) {
    console.error("Search users error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
