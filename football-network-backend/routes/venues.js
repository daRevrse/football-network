const express = require("express");
const { body, query, validationResult } = require("express-validator");
const db = require("../config/database");
const { authenticateToken, requireManager } = require("../middleware/auth");

const router = express.Router();

/**
 * GET /api/venues
 * Liste des stades/terrains avec filtres
 */
router.get(
  "/",
  [
    query("city").optional().trim(),
    query("field_surface").optional().isIn(['natural_grass', 'synthetic', 'hybrid', 'indoor']),
    query("field_size").optional().trim(),
    query("is_partner").optional().isBoolean(),
    query("min_rating").optional().isFloat({ min: 0, max: 5 }),
    query("game_type").optional().isIn(['5v5', '7v7', '11v11', 'futsal', 'training', 'tournament']),
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
        field_surface,
        field_size,
        is_partner,
        min_rating,
        game_type,
        limit = 20,
        offset = 0
      } = req.query;

      let query = `
        SELECT
          l.id,
          l.name,
          l.address,
          l.city,
          l.latitude,
          l.longitude,
          l.field_type,
          l.field_surface,
          l.field_size,
          l.capacity,
          l.owner_type,
          l.is_partner,
          l.partner_discount,
          l.rating,
          l.total_ratings,
          l.amenities,
          l.facilities,
          l.opening_hours,
          l.manager_name,
          l.manager_phone,
          l.manager_email,
          photo.stored_filename as photo_filename,
          banner.stored_filename as banner_filename,
          COUNT(DISTINCT vr.id) as total_reviews
        FROM locations l
        LEFT JOIN uploads photo ON l.photo_id = photo.id AND photo.is_active = true
        LEFT JOIN uploads banner ON l.banner_id = banner.id AND banner.is_active = true
        LEFT JOIN venue_ratings vr ON l.id = vr.location_id
        WHERE l.is_active = true
      `;

      const queryParams = [];

      if (city) {
        query += " AND l.city LIKE ?";
        queryParams.push(`%${city}%`);
      }

      if (field_surface) {
        query += " AND l.field_surface = ?";
        queryParams.push(field_surface);
      }

      if (field_size) {
        query += " AND l.field_size = ?";
        queryParams.push(field_size);
      }

      if (is_partner !== undefined) {
        query += " AND l.is_partner = ?";
        queryParams.push(is_partner === 'true' ? 1 : 0);
      }

      if (min_rating) {
        query += " AND l.rating >= ?";
        queryParams.push(parseFloat(min_rating));
      }

      // Filtrer par type de jeu via les tarifs disponibles
      if (game_type) {
        query += ` AND EXISTS (
          SELECT 1 FROM venue_pricing vp
          WHERE vp.location_id = l.id
          AND vp.game_type = ?
          AND vp.is_active = true
        )`;
        queryParams.push(game_type);
      }

      query += " GROUP BY l.id ORDER BY l.rating DESC, l.total_ratings DESC LIMIT ? OFFSET ?";
      queryParams.push(parseInt(limit), parseInt(offset));

      const [venues] = await db.execute(query, queryParams);

      const formattedVenues = venues.map(venue => ({
        id: venue.id,
        name: venue.name,
        address: venue.address,
        city: venue.city,
        coordinates: {
          lat: venue.latitude,
          lng: venue.longitude
        },
        fieldType: venue.field_type,
        fieldSurface: venue.field_surface,
        fieldSize: venue.field_size,
        capacity: venue.capacity,
        ownerType: venue.owner_type,
        isPartner: Boolean(venue.is_partner),
        partnerDiscount: venue.partner_discount,
        rating: parseFloat(venue.rating) || 0,
        totalRatings: venue.total_ratings,
        totalReviews: venue.total_reviews,
        amenities: venue.amenities ? JSON.parse(venue.amenities) : null,
        facilities: venue.facilities ? JSON.parse(venue.facilities) : null,
        openingHours: venue.opening_hours ? JSON.parse(venue.opening_hours) : null,
        manager: {
          name: venue.manager_name,
          phone: venue.manager_phone,
          email: venue.manager_email
        },
        photoUrl: venue.photo_filename ? `/uploads/venues/${venue.photo_filename}` : null,
        bannerUrl: venue.banner_filename ? `/uploads/venues/${venue.banner_filename}` : null
      }));

      res.json({
        success: true,
        count: formattedVenues.length,
        venues: formattedVenues
      });
    } catch (error) {
      console.error("Get venues error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * GET /api/venues/partners
 * Liste des stades partenaires
 */
router.get("/partners", async (req, res) => {
  try {
    const [venues] = await db.execute(
      `SELECT
        l.id,
        l.name,
        l.address,
        l.city,
        l.field_surface,
        l.field_size,
        l.partner_discount,
        l.partner_since,
        l.rating,
        l.total_ratings,
        photo.stored_filename as photo_filename,
        vp.partnership_type,
        vp.benefits
      FROM locations l
      LEFT JOIN uploads photo ON l.photo_id = photo.id AND photo.is_active = true
      LEFT JOIN venue_partnerships vp ON l.id = vp.location_id AND vp.is_active = true
      WHERE l.is_partner = true AND l.is_active = true
      ORDER BY vp.partnership_type DESC, l.rating DESC`
    );

    const formattedVenues = venues.map(v => ({
      id: v.id,
      name: v.name,
      address: v.address,
      city: v.city,
      fieldSurface: v.field_surface,
      fieldSize: v.field_size,
      discount: v.partner_discount,
      partnerSince: v.partner_since,
      rating: parseFloat(v.rating) || 0,
      totalRatings: v.total_ratings,
      photoUrl: v.photo_filename ? `/uploads/venues/${v.photo_filename}` : null,
      partnershipType: v.partnership_type,
      benefits: v.benefits ? JSON.parse(v.benefits) : null
    }));

    res.json({
      success: true,
      count: formattedVenues.length,
      partners: formattedVenues
    });
  } catch (error) {
    console.error("Get partner venues error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/venues/:id
 * Détails d'un stade/terrain
 */
router.get("/:id", async (req, res) => {
  try {
    const venueId = req.params.id;

    const [venues] = await db.execute(
      `SELECT
        l.*,
        photo.stored_filename as photo_filename,
        banner.stored_filename as banner_filename,
        vp.partnership_type,
        vp.discount_percentage,
        vp.benefits,
        vp.start_date as partnership_start,
        vp.end_date as partnership_end
      FROM locations l
      LEFT JOIN uploads photo ON l.photo_id = photo.id AND photo.is_active = true
      LEFT JOIN uploads banner ON l.banner_id = banner.id AND banner.is_active = true
      LEFT JOIN venue_partnerships vp ON l.id = vp.location_id AND vp.is_active = true
      WHERE l.id = ? AND l.is_active = true`,
      [venueId]
    );

    if (venues.length === 0) {
      return res.status(404).json({ error: "Venue not found" });
    }

    const venue = venues[0];

    // Récupérer les tarifs
    const [pricing] = await db.execute(
      `SELECT * FROM venue_pricing
       WHERE location_id = ? AND is_active = true
       ORDER BY game_type, duration_minutes, day_type, time_slot`,
      [venueId]
    );

    // Récupérer les avis récents
    const [reviews] = await db.execute(
      `SELECT
        vr.*,
        u.first_name,
        u.last_name,
        vb.booking_date
      FROM venue_ratings vr
      JOIN users u ON vr.user_id = u.id
      LEFT JOIN venue_bookings vb ON vr.booking_id = vb.id
      WHERE vr.location_id = ?
      ORDER BY vr.created_at DESC
      LIMIT 10`,
      [venueId]
    );

    res.json({
      success: true,
      venue: {
        id: venue.id,
        name: venue.name,
        address: venue.address,
        city: venue.city,
        coordinates: {
          lat: venue.latitude,
          lng: venue.longitude
        },
        fieldType: venue.field_type,
        fieldSurface: venue.field_surface,
        fieldSize: venue.field_size,
        capacity: venue.capacity,
        ownerType: venue.owner_type,
        isPartner: Boolean(venue.is_partner),
        partnerDiscount: venue.partner_discount,
        partnerSince: venue.partner_since,
        rating: parseFloat(venue.rating) || 0,
        totalRatings: venue.total_ratings,
        amenities: venue.amenities ? JSON.parse(venue.amenities) : null,
        facilities: venue.facilities ? JSON.parse(venue.facilities) : null,
        openingHours: venue.opening_hours ? JSON.parse(venue.opening_hours) : null,
        manager: {
          name: venue.manager_name,
          phone: venue.manager_phone,
          email: venue.manager_email
        },
        photoUrl: venue.photo_filename ? `/uploads/venues/${venue.photo_filename}` : null,
        bannerUrl: venue.banner_filename ? `/uploads/venues/${venue.banner_filename}` : null,
        partnership: venue.partnership_type ? {
          type: venue.partnership_type,
          discount: venue.discount_percentage,
          benefits: venue.benefits ? JSON.parse(venue.benefits) : null,
          startDate: venue.partnership_start,
          endDate: venue.partnership_end
        } : null,
        pricing: pricing.map(p => ({
          id: p.id,
          gameType: p.game_type,
          duration: p.duration_minutes,
          price: parseFloat(p.price),
          currency: p.currency,
          dayType: p.day_type,
          timeSlot: p.time_slot
        })),
        recentReviews: reviews.map(r => ({
          id: r.id,
          rating: r.rating,
          fieldCondition: r.field_condition_rating,
          facilities: r.facilities_rating,
          service: r.service_rating,
          comment: r.comment,
          isVerified: Boolean(r.is_verified),
          user: {
            firstName: r.first_name,
            lastName: r.last_name
          },
          bookingDate: r.booking_date,
          createdAt: r.created_at
        }))
      }
    });
  } catch (error) {
    console.error("Get venue details error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/venues/:id/availability
 * Vérifier les disponibilités d'un terrain
 */
router.get(
  "/:id/availability",
  [
    query("date").isISO8601().withMessage("Valid date required"),
    query("duration").optional().isInt({ min: 30, max: 180 }),
    query("game_type").optional().isIn(['5v5', '7v7', '11v11', 'futsal', 'training', 'tournament'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const venueId = req.params.id;
      const { date, duration = 90, game_type } = req.query;

      // Récupérer les réservations existantes pour cette date
      const [bookings] = await db.execute(
        `SELECT booking_date, start_time, end_time, status
         FROM venue_bookings
         WHERE location_id = ?
         AND booking_date = ?
         AND status IN ('pending', 'confirmed')
         ORDER BY start_time`,
        [venueId, date]
      );

      // Récupérer les horaires d'ouverture
      const [venues] = await db.execute(
        "SELECT opening_hours FROM locations WHERE id = ?",
        [venueId]
      );

      if (venues.length === 0) {
        return res.status(404).json({ error: "Venue not found" });
      }

      const openingHours = venues[0].opening_hours ? JSON.parse(venues[0].opening_hours) : null;

      // Récupérer le tarif si game_type est fourni
      let pricing = null;
      if (game_type) {
        const bookingDate = new Date(date);
        const dayOfWeek = bookingDate.getDay();
        const dayType = (dayOfWeek === 0 || dayOfWeek === 6) ? 'weekend' : 'weekday';

        const [pricingResults] = await db.execute(
          `SELECT price, currency FROM venue_pricing
           WHERE location_id = ?
           AND game_type = ?
           AND duration_minutes = ?
           AND day_type = ?
           AND is_active = true
           LIMIT 1`,
          [venueId, game_type, parseInt(duration), dayType]
        );

        if (pricingResults.length > 0) {
          pricing = {
            price: parseFloat(pricingResults[0].price),
            currency: pricingResults[0].currency,
            duration: parseInt(duration),
            gameType: game_type,
            dayType: dayType
          };
        }
      }

      res.json({
        success: true,
        date: date,
        openingHours: openingHours,
        bookedSlots: bookings.map(b => ({
          startTime: b.start_time,
          endTime: b.end_time,
          status: b.status
        })),
        pricing: pricing
      });
    } catch (error) {
      console.error("Get venue availability error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * POST /api/venues/:id/book
 * Réserver un terrain
 */
router.post(
  "/:id/book",
  [
    authenticateToken,
    requireManager,
    body("teamId").isInt().withMessage("Team ID required"),
    body("bookingDate").isISO8601().withMessage("Valid date required"),
    body("startTime").matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage("Valid start time required (HH:MM)"),
    body("endTime").matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage("Valid end time required (HH:MM)"),
    body("gameType").isIn(['5v5', '7v7', '11v11', 'futsal', 'training', 'tournament']).withMessage("Valid game type required"),
    body("matchId").optional().isInt(),
    body("notes").optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const venueId = req.params.id;
      const { teamId, bookingDate, startTime, endTime, gameType, matchId, notes } = req.body;

      // Vérifier que l'utilisateur est capitaine de l'équipe
      const [teamCheck] = await db.execute(
        'SELECT id FROM teams WHERE id = ? AND captain_id = ?',
        [teamId, req.user.id]
      );

      if (teamCheck.length === 0) {
        return res.status(403).json({ error: "You are not the captain of this team" });
      }

      // Vérifier que le terrain existe
      const [venues] = await db.execute(
        "SELECT id FROM locations WHERE id = ? AND is_active = true",
        [venueId]
      );

      if (venues.length === 0) {
        return res.status(404).json({ error: "Venue not found" });
      }

      // Calculer la durée en minutes
      const start = new Date(`2000-01-01 ${startTime}`);
      const end = new Date(`2000-01-01 ${endTime}`);
      const durationMinutes = Math.round((end - start) / 60000);

      if (durationMinutes <= 0) {
        return res.status(400).json({ error: "End time must be after start time" });
      }

      // Vérifier les conflits de réservation
      const [conflicts] = await db.execute(
        `SELECT id FROM venue_bookings
         WHERE location_id = ?
         AND booking_date = ?
         AND status IN ('pending', 'confirmed')
         AND (
           (start_time < ? AND end_time > ?) OR
           (start_time < ? AND end_time > ?) OR
           (start_time >= ? AND end_time <= ?)
         )`,
        [venueId, bookingDate, startTime, startTime, endTime, endTime, startTime, endTime]
      );

      if (conflicts.length > 0) {
        return res.status(409).json({ error: "Time slot already booked" });
      }

      // Calculer le prix
      const bookingDateObj = new Date(bookingDate);
      const dayOfWeek = bookingDateObj.getDay();
      const dayType = (dayOfWeek === 0 || dayOfWeek === 6) ? 'weekend' : 'weekday';

      const hour = parseInt(startTime.split(':')[0]);
      let timeSlot;
      if (hour >= 6 && hour < 12) timeSlot = 'morning';
      else if (hour >= 12 && hour < 18) timeSlot = 'afternoon';
      else if (hour >= 18 && hour < 22) timeSlot = 'evening';
      else timeSlot = 'night';

      const [pricingResults] = await db.execute(
        `SELECT price FROM venue_pricing
         WHERE location_id = ?
         AND game_type = ?
         AND duration_minutes = ?
         AND day_type = ?
         AND (time_slot = ? OR time_slot IS NULL)
         AND is_active = true
         ORDER BY time_slot DESC
         LIMIT 1`,
        [venueId, gameType, durationMinutes, dayType, timeSlot]
      );

      let basePrice = 0;
      if (pricingResults.length > 0) {
        basePrice = parseFloat(pricingResults[0].price);
      }

      // Vérifier si réduction partenaire applicable
      const [partnerCheck] = await db.execute(
        `SELECT vp.discount_percentage
         FROM venue_partnerships vp
         WHERE vp.location_id = ?
         AND vp.is_active = true
         AND (vp.end_date IS NULL OR vp.end_date >= CURDATE())`,
        [venueId]
      );

      let discountApplied = 0;
      if (partnerCheck.length > 0) {
        discountApplied = basePrice * (parseFloat(partnerCheck[0].discount_percentage) / 100);
      }

      const finalPrice = basePrice - discountApplied;

      // Créer la réservation
      const [result] = await db.execute(
        `INSERT INTO venue_bookings
         (location_id, match_id, team_id, booked_by, booking_date, start_time, end_time,
          duration_minutes, game_type, base_price, discount_applied, final_price, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [venueId, matchId || null, teamId, req.user.id, bookingDate, startTime, endTime,
         durationMinutes, gameType, basePrice, discountApplied, finalPrice, notes || null]
      );

      res.status(201).json({
        success: true,
        message: "Booking created successfully",
        booking: {
          id: result.insertId,
          venueId: parseInt(venueId),
          teamId: teamId,
          bookingDate: bookingDate,
          startTime: startTime,
          endTime: endTime,
          duration: durationMinutes,
          gameType: gameType,
          pricing: {
            basePrice: basePrice,
            discount: discountApplied,
            finalPrice: finalPrice
          },
          status: 'pending'
        }
      });
    } catch (error) {
      console.error("Create booking error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * POST /api/venues/:id/rate
 * Noter un terrain
 */
router.post(
  "/:id/rate",
  [
    authenticateToken,
    body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
    body("fieldConditionRating").optional().isInt({ min: 1, max: 5 }),
    body("facilitiesRating").optional().isInt({ min: 1, max: 5 }),
    body("serviceRating").optional().isInt({ min: 1, max: 5 }),
    body("comment").optional().trim().isLength({ max: 1000 }),
    body("bookingId").optional().isInt()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const venueId = req.params.id;
      const {
        rating,
        fieldConditionRating,
        facilitiesRating,
        serviceRating,
        comment,
        bookingId
      } = req.body;

      // Vérifier que le terrain existe
      const [venues] = await db.execute(
        "SELECT id FROM locations WHERE id = ? AND is_active = true",
        [venueId]
      );

      if (venues.length === 0) {
        return res.status(404).json({ error: "Venue not found" });
      }

      // Si bookingId fourni, vérifier qu'il appartient à l'utilisateur
      let isVerified = false;
      if (bookingId) {
        const [bookings] = await db.execute(
          `SELECT id FROM venue_bookings
           WHERE id = ? AND booked_by = ? AND status = 'completed'`,
          [bookingId, req.user.id]
        );

        if (bookings.length > 0) {
          isVerified = true;
        }
      }

      // Créer l'avis
      const [result] = await db.execute(
        `INSERT INTO venue_ratings
         (location_id, booking_id, user_id, rating, field_condition_rating,
          facilities_rating, service_rating, comment, is_verified)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [venueId, bookingId || null, req.user.id, rating,
         fieldConditionRating || null, facilitiesRating || null,
         serviceRating || null, comment || null, isVerified]
      );

      // Mettre à jour la note moyenne du terrain
      const [avgRating] = await db.execute(
        `SELECT AVG(rating) as avg_rating, COUNT(*) as total
         FROM venue_ratings
         WHERE location_id = ?`,
        [venueId]
      );

      await db.execute(
        "UPDATE locations SET rating = ?, total_ratings = ? WHERE id = ?",
        [avgRating[0].avg_rating, avgRating[0].total, venueId]
      );

      res.status(201).json({
        success: true,
        message: "Rating submitted successfully",
        ratingId: result.insertId,
        venueNewRating: parseFloat(avgRating[0].avg_rating).toFixed(2)
      });
    } catch (error) {
      console.error("Rate venue error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

module.exports = router;
