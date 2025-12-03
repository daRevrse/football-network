const express = require("express");
const { body, query, validationResult } = require("express-validator");
const db = require("../config/database");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

/**
 * POST /api/referees
 * Enregistrer un nouvel arbitre
 */
router.post(
  "/",
  [
    authenticateToken,
    body("firstName").trim().isLength({ min: 2 }).withMessage("First name required"),
    body("lastName").trim().isLength({ min: 2 }).withMessage("Last name required"),
    body("email").isEmail().normalizeEmail(),
    body("phone").optional().trim(),
    body("licenseNumber").optional().trim(),
    body("licenseLevel").optional().isIn(['regional', 'national', 'international', 'trainee']),
    body("experienceYears").optional().isInt({ min: 0 }),
    body("bio").optional().trim().isLength({ max: 1000 }),
    body("specializations").optional().isArray(),
    body("languages").optional().isArray(),
    body("locationCity").optional().trim(),
    body("maxTravelDistance").optional().isInt({ min: 0, max: 500 }),
    body("hourlyRate").optional().isFloat({ min: 0 })
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
        email,
        phone,
        licenseNumber,
        licenseLevel,
        experienceYears,
        bio,
        specializations,
        languages,
        locationCity,
        locationLat,
        locationLng,
        maxTravelDistance,
        hourlyRate
      } = req.body;

      // Vérifier si l'email existe déjà
      const [existing] = await db.execute(
        "SELECT id FROM referees WHERE email = ?",
        [email]
      );

      if (existing.length > 0) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Vérifier si le numéro de licence existe déjà
      if (licenseNumber) {
        const [existingLicense] = await db.execute(
          "SELECT id FROM referees WHERE license_number = ?",
          [licenseNumber]
        );

        if (existingLicense.length > 0) {
          return res.status(400).json({ error: "License number already registered" });
        }
      }

      // Utiliser une transaction pour créer l'arbitre ET mettre à jour le type utilisateur
      const connection = await db.getConnection();
      await connection.beginTransaction();

      try {
        // Créer le profil arbitre
        const [result] = await connection.execute(
          `INSERT INTO referees
           (user_id, first_name, last_name, email, phone, license_number, license_level,
            experience_years, bio, specializations, languages, location_city, location_lat,
            location_lng, max_travel_distance, hourly_rate)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            req.user.id,
            firstName,
            lastName,
            email,
            phone || null,
            licenseNumber || null,
            licenseLevel || 'regional',
            experienceYears || 0,
            bio || null,
            specializations ? JSON.stringify(specializations) : null,
            languages ? JSON.stringify(languages) : null,
            locationCity || null,
            locationLat || null,
            locationLng || null,
            maxTravelDistance || 50,
            hourlyRate || null
          ]
        );

        // Mettre à jour le type d'utilisateur en 'referee'
        await connection.execute(
          `UPDATE users SET user_type = 'referee' WHERE id = ?`,
          [req.user.id]
        );

        await connection.commit();
        connection.release();

        res.status(201).json({
          success: true,
          message: "Referee registered successfully",
          refereeId: result.insertId
        });
      } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error("Register referee error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * GET /api/referees
 * Liste des arbitres avec filtres
 */
router.get(
  "/",
  [
    query("city").optional().trim(),
    query("license_level").optional().isIn(['regional', 'national', 'international', 'trainee']),
    query("min_experience").optional().isInt({ min: 0 }),
    query("min_rating").optional().isFloat({ min: 0, max: 5 }),
    query("available_only").optional().isBoolean(),
    query("specialization").optional().trim(),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("offset").optional().isInt({ min: 0 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        city,
        license_level,
        min_experience,
        min_rating,
        available_only,
        specialization,
        limit = 20,
        offset = 0
      } = req.query;

      let query = `
        SELECT
          r.id,
          r.first_name,
          r.last_name,
          r.email,
          r.phone,
          r.license_number,
          r.license_level,
          r.experience_years,
          r.bio,
          r.specializations,
          r.languages,
          r.location_city,
          r.max_travel_distance,
          r.rating,
          r.total_ratings,
          r.total_matches,
          r.hourly_rate,
          r.currency,
          r.is_available,
          photo.stored_filename as photo_filename
        FROM referees r
        LEFT JOIN uploads photo ON r.profile_picture_id = photo.id AND photo.is_active = true
        WHERE r.is_active = true
      `;

      const queryParams = [];

      if (city) {
        query += " AND r.location_city LIKE ?";
        queryParams.push(`%${city}%`);
      }

      if (license_level) {
        query += " AND r.license_level = ?";
        queryParams.push(license_level);
      }

      if (min_experience) {
        query += " AND r.experience_years >= ?";
        queryParams.push(parseInt(min_experience));
      }

      if (min_rating) {
        query += " AND r.rating >= ?";
        queryParams.push(parseFloat(min_rating));
      }

      if (available_only === 'true') {
        query += " AND r.is_available = true";
      }

      if (specialization) {
        query += " AND JSON_CONTAINS(r.specializations, ?, '$')";
        queryParams.push(JSON.stringify(specialization));
      }

      query += " ORDER BY r.rating DESC, r.total_matches DESC LIMIT ? OFFSET ?";
      queryParams.push(parseInt(limit), parseInt(offset));

      const [referees] = await db.execute(query, queryParams);

      const formattedReferees = referees.map(r => ({
        id: r.id,
        firstName: r.first_name,
        lastName: r.last_name,
        email: r.email,
        phone: r.phone,
        license: {
          number: r.license_number,
          level: r.license_level
        },
        experienceYears: r.experience_years,
        bio: r.bio,
        specializations: r.specializations ? JSON.parse(r.specializations) : [],
        languages: r.languages ? JSON.parse(r.languages) : [],
        location: {
          city: r.location_city,
          maxTravelDistance: r.max_travel_distance
        },
        rating: parseFloat(r.rating) || 0,
        totalRatings: r.total_ratings,
        totalMatches: r.total_matches,
        hourlyRate: r.hourly_rate ? parseFloat(r.hourly_rate) : null,
        currency: r.currency,
        isAvailable: Boolean(r.is_available),
        photoUrl: r.photo_filename ? `/uploads/referees/${r.photo_filename}` : null
      }));

      res.json({
        success: true,
        count: formattedReferees.length,
        referees: formattedReferees
      });
    } catch (error) {
      console.error("Get referees error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * GET /api/referees/:id
 * Détails d'un arbitre
 */
router.get("/:id", async (req, res) => {
  try {
    const refereeId = req.params.id;

    const [referees] = await db.execute(
      `SELECT
        r.*,
        photo.stored_filename as photo_filename
      FROM referees r
      LEFT JOIN uploads photo ON r.profile_picture_id = photo.id AND photo.is_active = true
      WHERE r.id = ? AND r.is_active = true`,
      [refereeId]
    );

    if (referees.length === 0) {
      return res.status(404).json({ error: "Referee not found" });
    }

    const referee = referees[0];

    // Récupérer les certifications
    const [certifications] = await db.execute(
      `SELECT * FROM referee_certifications
       WHERE referee_id = ? AND is_active = true
       ORDER BY issue_date DESC`,
      [refereeId]
    );

    // Récupérer les avis récents
    const [ratings] = await db.execute(
      `SELECT
        rr.*,
        u.first_name,
        u.last_name,
        t.name as team_name,
        m.match_date
      FROM referee_ratings rr
      JOIN users u ON rr.rated_by = u.id
      JOIN teams t ON rr.team_id = t.id
      JOIN matches m ON rr.match_id = m.id
      WHERE rr.referee_id = ?
      ORDER BY rr.created_at DESC
      LIMIT 10`,
      [refereeId]
    );

    // Récupérer les matchs récents
    const [recentMatches] = await db.execute(
      `SELECT
        m.id,
        m.match_date,
        ht.name as home_team_name,
        at.name as away_team_name,
        m.home_score,
        m.away_score,
        mra.role,
        mra.status
      FROM match_referee_assignments mra
      JOIN matches m ON mra.match_id = m.id
      JOIN teams ht ON m.home_team_id = ht.id
      LEFT JOIN teams at ON m.away_team_id = at.id
      WHERE mra.referee_id = ?
      ORDER BY m.match_date DESC
      LIMIT 10`,
      [refereeId]
    );

    res.json({
      success: true,
      referee: {
        id: referee.id,
        userId: referee.user_id,
        firstName: referee.first_name,
        lastName: referee.last_name,
        email: referee.email,
        phone: referee.phone,
        license: {
          number: referee.license_number,
          level: referee.license_level
        },
        experienceYears: referee.experience_years,
        bio: referee.bio,
        specializations: referee.specializations ? JSON.parse(referee.specializations) : [],
        languages: referee.languages ? JSON.parse(referee.languages) : [],
        location: {
          city: referee.location_city,
          lat: referee.location_lat,
          lng: referee.location_lng,
          maxTravelDistance: referee.max_travel_distance
        },
        rating: parseFloat(referee.rating) || 0,
        totalRatings: referee.total_ratings,
        totalMatches: referee.total_matches,
        hourlyRate: referee.hourly_rate ? parseFloat(referee.hourly_rate) : null,
        currency: referee.currency,
        isAvailable: Boolean(referee.is_available),
        photoUrl: referee.photo_filename ? `/uploads/referees/${referee.photo_filename}` : null,
        createdAt: referee.created_at,
        certifications: certifications.map(c => ({
          id: c.id,
          name: c.certification_name,
          type: c.certification_type,
          organization: c.issuing_organization,
          issueDate: c.issue_date,
          expiryDate: c.expiry_date,
          certificateNumber: c.certificate_number,
          isVerified: Boolean(c.is_verified)
        })),
        recentRatings: ratings.map(r => ({
          id: r.id,
          rating: r.rating,
          fairness: r.fairness_rating,
          communication: r.communication_rating,
          professionalism: r.professionalism_rating,
          comment: r.comment,
          ratedBy: {
            firstName: r.first_name,
            lastName: r.last_name
          },
          team: r.team_name,
          matchDate: r.match_date,
          createdAt: r.created_at
        })),
        recentMatches: recentMatches.map(m => ({
          id: m.id,
          matchDate: m.match_date,
          homeTeam: m.home_team_name,
          awayTeam: m.away_team_name,
          score: {
            home: m.home_score,
            away: m.away_score
          },
          role: m.role,
          status: m.status
        }))
      }
    });
  } catch (error) {
    console.error("Get referee details error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PUT /api/referees/:id
 * Modifier le profil d'un arbitre
 */
router.put(
  "/:id",
  [
    authenticateToken,
    body("firstName").optional().trim().isLength({ min: 2 }),
    body("lastName").optional().trim().isLength({ min: 2 }),
    body("phone").optional().trim(),
    body("bio").optional().trim().isLength({ max: 1000 }),
    body("specializations").optional().isArray(),
    body("languages").optional().isArray(),
    body("locationCity").optional().trim(),
    body("maxTravelDistance").optional().isInt({ min: 0, max: 500 }),
    body("hourlyRate").optional().isFloat({ min: 0 }),
    body("isAvailable").optional().isBoolean()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const refereeId = req.params.id;

      // Vérifier que l'arbitre appartient à l'utilisateur
      const [referees] = await db.execute(
        "SELECT user_id FROM referees WHERE id = ?",
        [refereeId]
      );

      if (referees.length === 0) {
        return res.status(404).json({ error: "Referee not found" });
      }

      if (referees[0].user_id !== req.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const {
        firstName,
        lastName,
        phone,
        bio,
        specializations,
        languages,
        locationCity,
        locationLat,
        locationLng,
        maxTravelDistance,
        hourlyRate,
        isAvailable
      } = req.body;

      const updates = [];
      const values = [];

      if (firstName !== undefined) {
        updates.push("first_name = ?");
        values.push(firstName);
      }
      if (lastName !== undefined) {
        updates.push("last_name = ?");
        values.push(lastName);
      }
      if (phone !== undefined) {
        updates.push("phone = ?");
        values.push(phone);
      }
      if (bio !== undefined) {
        updates.push("bio = ?");
        values.push(bio);
      }
      if (specializations !== undefined) {
        updates.push("specializations = ?");
        values.push(JSON.stringify(specializations));
      }
      if (languages !== undefined) {
        updates.push("languages = ?");
        values.push(JSON.stringify(languages));
      }
      if (locationCity !== undefined) {
        updates.push("location_city = ?");
        values.push(locationCity);
      }
      if (locationLat !== undefined) {
        updates.push("location_lat = ?");
        values.push(locationLat);
      }
      if (locationLng !== undefined) {
        updates.push("location_lng = ?");
        values.push(locationLng);
      }
      if (maxTravelDistance !== undefined) {
        updates.push("max_travel_distance = ?");
        values.push(maxTravelDistance);
      }
      if (hourlyRate !== undefined) {
        updates.push("hourly_rate = ?");
        values.push(hourlyRate);
      }
      if (isAvailable !== undefined) {
        updates.push("is_available = ?");
        values.push(isAvailable);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: "No fields to update" });
      }

      values.push(refereeId);

      await db.execute(
        `UPDATE referees SET ${updates.join(", ")} WHERE id = ?`,
        values
      );

      res.json({
        success: true,
        message: "Referee profile updated successfully"
      });
    } catch (error) {
      console.error("Update referee error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * GET /api/referees/:id/matches
 * Historique des matchs d'un arbitre
 */
router.get("/:id/matches", async (req, res) => {
  try {
    const refereeId = req.params.id;
    const { status, limit = 20, offset = 0 } = req.query;

    let query = `
      SELECT
        m.id,
        m.match_date,
        m.status as match_status,
        ht.name as home_team_name,
        at.name as away_team_name,
        m.home_score,
        m.away_score,
        l.name as location_name,
        l.city as location_city,
        mra.role,
        mra.status as assignment_status,
        mra.fee
      FROM match_referee_assignments mra
      JOIN matches m ON mra.match_id = m.id
      JOIN teams ht ON m.home_team_id = ht.id
      LEFT JOIN teams at ON m.away_team_id = at.id
      LEFT JOIN locations l ON m.location_id = l.id
      WHERE mra.referee_id = ?
    `;

    const queryParams = [refereeId];

    if (status) {
      query += " AND mra.status = ?";
      queryParams.push(status);
    }

    query += " ORDER BY m.match_date DESC LIMIT ? OFFSET ?";
    queryParams.push(parseInt(limit), parseInt(offset));

    const [matches] = await db.execute(query, queryParams);

    const formattedMatches = matches.map(m => ({
      id: m.id,
      matchDate: m.match_date,
      matchStatus: m.match_status,
      homeTeam: m.home_team_name,
      awayTeam: m.away_team_name,
      score: {
        home: m.home_score,
        away: m.away_score
      },
      location: m.location_name ? {
        name: m.location_name,
        city: m.location_city
      } : null,
      role: m.role,
      assignmentStatus: m.assignment_status,
      fee: m.fee ? parseFloat(m.fee) : null
    }));

    res.json({
      success: true,
      count: formattedMatches.length,
      matches: formattedMatches
    });
  } catch (error) {
    console.error("Get referee matches error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/referees/:id/availability
 * Définir les disponibilités d'un arbitre
 */
router.post(
  "/:id/availability",
  [
    authenticateToken,
    body("date").isISO8601().withMessage("Valid date required"),
    body("isAvailable").isBoolean(),
    body("startTime").optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body("endTime").optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body("reason").optional().trim().isLength({ max: 255 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const refereeId = req.params.id;
      const { date, isAvailable, startTime, endTime, reason } = req.body;

      // Vérifier que l'arbitre appartient à l'utilisateur
      const [referees] = await db.execute(
        "SELECT user_id FROM referees WHERE id = ?",
        [refereeId]
      );

      if (referees.length === 0) {
        return res.status(404).json({ error: "Referee not found" });
      }

      if (referees[0].user_id !== req.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Insert or update
      await db.execute(
        `INSERT INTO referee_availability
         (referee_id, date, start_time, end_time, is_available, reason)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         start_time = VALUES(start_time),
         end_time = VALUES(end_time),
         is_available = VALUES(is_available),
         reason = VALUES(reason)`,
        [refereeId, date, startTime || null, endTime || null, isAvailable, reason || null]
      );

      res.json({
        success: true,
        message: "Availability updated successfully"
      });
    } catch (error) {
      console.error("Set availability error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * GET /api/referees/:id/availability
 * Voir les disponibilités d'un arbitre
 */
router.get("/:id/availability", async (req, res) => {
  try {
    const refereeId = req.params.id;
    const { start_date, end_date } = req.query;

    let query = `
      SELECT * FROM referee_availability
      WHERE referee_id = ?
    `;

    const queryParams = [refereeId];

    if (start_date) {
      query += " AND date >= ?";
      queryParams.push(start_date);
    }

    if (end_date) {
      query += " AND date <= ?";
      queryParams.push(end_date);
    }

    query += " ORDER BY date ASC";

    const [availability] = await db.execute(query, queryParams);

    res.json({
      success: true,
      availability: availability.map(a => ({
        id: a.id,
        date: a.date,
        startTime: a.start_time,
        endTime: a.end_time,
        isAvailable: Boolean(a.is_available),
        reason: a.reason
      }))
    });
  } catch (error) {
    console.error("Get availability error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
