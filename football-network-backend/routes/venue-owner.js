const express = require("express");
const { body, validationResult } = require("express-validator");
const { authenticateToken } = require("../middleware/auth");
const db = require("../config/database");

const router = express.Router();

/**
 * Middleware pour vérifier que l'utilisateur est propriétaire de terrain
 */
const requireVenueOwner = (req, res, next) => {
  if (
    req.user.user_type !== "venue_owner" &&
    req.user.user_type !== "superadmin"
  ) {
    return res
      .status(403)
      .json({ error: "Access denied. Venue owner role required." });
  }
  next();
};

/**
 * GET /api/venue-owner/dashboard
 * Dashboard du propriétaire avec statistiques
 */
router.get(
  "/dashboard",
  [authenticateToken, requireVenueOwner],
  async (req, res) => {
    try {
      // Récupérer les terrains du propriétaire
      const [venues] = await db.execute(
        `SELECT id, name, city, address, field_type, is_active
       FROM locations
       WHERE owner_id = ? AND is_managed = true`,
        [req.user.id]
      );

      // Statistiques globales
      const venueIds = venues.map((v) => v.id);

      if (venueIds.length === 0) {
        return res.json({
          venues: [],
          stats: {
            totalBookings: 0,
            pendingBookings: 0,
            confirmedBookings: 0,
            totalRevenue: 0,
            monthRevenue: 0,
          },
        });
      }

      const placeholders = venueIds.map(() => "?").join(",");

      const [stats] = await db.execute(
        `
      SELECT
        COUNT(*) as total_bookings,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_bookings,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings,
        SUM(CASE WHEN status = 'confirmed' AND payment_status = 'paid' THEN payment_amount ELSE 0 END) as total_revenue,
        SUM(CASE WHEN status = 'confirmed' AND payment_status = 'paid'
            AND MONTH(booking_date) = MONTH(CURRENT_DATE())
            AND YEAR(booking_date) = YEAR(CURRENT_DATE())
            THEN payment_amount ELSE 0 END) as month_revenue
      FROM venue_bookings
      WHERE venue_id IN (${placeholders})
    `,
        venueIds
      );

      res.json({
        venues,
        stats: stats[0],
      });
    } catch (error) {
      console.error("Error fetching venue owner dashboard:", error);
      res.status(500).json({ error: "Failed to fetch dashboard" });
    }
  }
);

/**
 * GET /api/venue-owner/bookings
 * Liste de toutes les réservations des terrains du propriétaire
 */
router.get(
  "/bookings",
  [authenticateToken, requireVenueOwner],
  async (req, res) => {
    try {
      const { status, venue_id } = req.query;

      let query = `
      SELECT
        vb.*,
        l.name as venue_name,
        l.city as venue_city,
        l.address as venue_address,
        t.name as team_name,
        logo.stored_filename as team_logo_filename,
        u.first_name as booker_first_name,
        u.last_name as booker_last_name,
        u.email as booker_email
      FROM venue_bookings vb
      JOIN locations l ON vb.venue_id = l.id
      JOIN teams t ON vb.team_id = t.id
      LEFT JOIN uploads logo ON t.logo_id = logo.id
      JOIN users u ON vb.booked_by = u.id
      WHERE l.owner_id = ? AND l.is_managed = true
    `;

      const params = [req.user.id];

      if (status) {
        query += " AND vb.status = ?";
        params.push(status);
      }

      if (venue_id) {
        query += " AND vb.venue_id = ?";
        params.push(venue_id);
      }

      query += " ORDER BY vb.booking_date DESC, vb.start_time DESC";

      const [bookings] = await db.execute(query, params);

      res.json({
        count: bookings.length,
        bookings,
      });
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  }
);

/**
 * GET /api/venue-owner/bookings/:id
 * Détails d'une réservation spécifique
 */
router.get(
  "/bookings/:id",
  [authenticateToken, requireVenueOwner],
  async (req, res) => {
    try {
      const { id } = req.params;

      const [bookings] = await db.execute(
        `
      SELECT
        vb.*,
        l.name as venue_name,
        l.city as venue_city,
        l.address as venue_address,
        l.field_type,
        t.name as team_name,
        logo.stored_filename as team_logo_filename,
        t.description as team_description,
        u.first_name as booker_first_name,
        u.last_name as booker_last_name,
        u.email as booker_email,
        u.phone as booker_phone
      FROM venue_bookings vb
      JOIN locations l ON vb.venue_id = l.id
      JOIN teams t ON vb.team_id = t.id
      LEFT JOIN uploads logo ON t.logo_id = logo.id
      JOIN users u ON vb.booked_by = u.id
      WHERE vb.id = ? AND l.owner_id = ?
    `,
        [id, req.user.id]
      );

      if (bookings.length === 0) {
        return res.status(404).json({ error: "Booking not found" });
      }

      res.json(bookings[0]);
    } catch (error) {
      console.error("Error fetching booking:", error);
      res.status(500).json({ error: "Failed to fetch booking" });
    }
  }
);

/**
 * PUT /api/venue-owner/bookings/:id/respond
 * Accepter ou refuser une réservation
 */
router.put(
  "/bookings/:id/respond",
  [
    authenticateToken,
    requireVenueOwner,
    body("action")
      .isIn(["accept", "reject"])
      .withMessage("Action must be accept or reject"),
    body("message").optional().isLength({ max: 500 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { action, message } = req.body;

      // Vérifier que la réservation appartient au propriétaire
      const [booking] = await db.execute(
        `
        SELECT vb.*, l.owner_id
        FROM venue_bookings vb
        JOIN locations l ON vb.venue_id = l.id
        WHERE vb.id = ? AND l.owner_id = ?
      `,
        [id, req.user.id]
      );

      if (booking.length === 0) {
        return res
          .status(404)
          .json({ error: "Booking not found or unauthorized" });
      }

      if (booking[0].status !== "pending") {
        return res.status(400).json({ error: "Booking already processed" });
      }

      const newStatus = action === "accept" ? "confirmed" : "cancelled";

      await db.execute(
        `
        UPDATE venue_bookings
        SET status = ?,
            owner_response_message = ?,
            owner_responded_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
        [newStatus, message || null, id]
      );

      // Créer notification pour le client
      await db.execute(
        `
        INSERT INTO venue_owner_notifications
        (owner_id, venue_id, booking_id, notification_type, message)
        VALUES (?, ?, ?, 'booking_cancelled', ?)
      `,
        [
          req.user.id,
          booking[0].venue_id,
          id,
          `Réservation ${action === "accept" ? "acceptée" : "refusée"}`,
        ]
      );

      res.json({
        message: `Booking ${
          action === "accept" ? "accepted" : "rejected"
        } successfully`,
        status: newStatus,
      });
    } catch (error) {
      console.error("Error responding to booking:", error);
      res.status(500).json({ error: "Failed to respond to booking" });
    }
  }
);

/**
 * PUT /api/venue-owner/bookings/:id/counter-proposal
 * Proposer une alternative (date/heure différente)
 */
router.put(
  "/bookings/:id/counter-proposal",
  [
    authenticateToken,
    requireVenueOwner,
    body("proposedDate").isISO8601().withMessage("Valid date required"),
    body("duration")
      .isInt({ min: 60, max: 240 })
      .withMessage("Duration must be between 60 and 240 minutes"),
    body("message").optional().isLength({ max: 500 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { proposedDate, duration, message } = req.body;

      // Vérifier ownership
      const [booking] = await db.execute(
        `
        SELECT vb.*, l.owner_id
        FROM venue_bookings vb
        JOIN locations l ON vb.venue_id = l.id
        WHERE vb.id = ? AND l.owner_id = ?
      `,
        [id, req.user.id]
      );

      if (booking.length === 0) {
        return res
          .status(404)
          .json({ error: "Booking not found or unauthorized" });
      }

      await db.execute(
        `
        UPDATE venue_bookings
        SET counter_proposal_date = ?,
            counter_proposal_duration = ?,
            owner_response_message = ?,
            owner_responded_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
        [proposedDate, duration, message || null, id]
      );

      res.json({
        message: "Counter proposal sent successfully",
        proposedDate,
        duration,
      });
    } catch (error) {
      console.error("Error sending counter proposal:", error);
      res.status(500).json({ error: "Failed to send counter proposal" });
    }
  }
);

/**
 * GET /api/venue-owner/venues/:venueId/calendar
 * Calendrier des réservations pour un terrain
 */
router.get(
  "/venues/:venueId/calendar",
  [authenticateToken, requireVenueOwner],
  async (req, res) => {
    try {
      const { venueId } = req.params;
      const { start_date, end_date } = req.query;

      // Vérifier ownership
      const [venue] = await db.execute(
        "SELECT id FROM locations WHERE id = ? AND owner_id = ?",
        [venueId, req.user.id]
      );

      if (venue.length === 0) {
        return res.status(404).json({ error: "Venue not found" });
      }

      let query = `
      SELECT
        booking_date,
        start_time,
        duration,
        status,
        team_id,
        (SELECT name FROM teams WHERE id = vb.team_id) as team_name
      FROM venue_bookings vb
      WHERE venue_id = ?
    `;

      const params = [venueId];

      if (start_date) {
        query += " AND booking_date >= ?";
        params.push(start_date);
      }

      if (end_date) {
        query += " AND booking_date <= ?";
        params.push(end_date);
      }

      query += " ORDER BY booking_date, start_time";

      const [bookings] = await db.execute(query, params);

      res.json({
        venueId,
        bookings,
      });
    } catch (error) {
      console.error("Error fetching calendar:", error);
      res.status(500).json({ error: "Failed to fetch calendar" });
    }
  }
);

/**
 * POST /api/venue-owner/venues/:venueId/availability
 * Définir les horaires d'ouverture
 */
router.post(
  "/venues/:venueId/availability",
  [
    authenticateToken,
    requireVenueOwner,
    body("schedule").isArray().withMessage("Schedule must be an array"),
    body("schedule.*.dayOfWeek").isIn([
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ]),
    body("schedule.*.openingTime").matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body("schedule.*.closingTime").matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { venueId } = req.params;
      const { schedule } = req.body;

      // Vérifier ownership
      const [venue] = await db.execute(
        "SELECT id FROM locations WHERE id = ? AND owner_id = ?",
        [venueId, req.user.id]
      );

      if (venue.length === 0) {
        return res.status(404).json({ error: "Venue not found" });
      }

      // Supprimer l'ancien planning
      await db.execute("DELETE FROM venue_availability WHERE venue_id = ?", [
        venueId,
      ]);

      // Insérer le nouveau
      for (const slot of schedule) {
        await db.execute(
          `
          INSERT INTO venue_availability (venue_id, day_of_week, opening_time, closing_time, is_closed)
          VALUES (?, ?, ?, ?, ?)
        `,
          [
            venueId,
            slot.dayOfWeek,
            slot.openingTime,
            slot.closingTime,
            slot.isClosed || false,
          ]
        );
      }

      res.json({
        message: "Availability updated successfully",
        venueId,
      });
    } catch (error) {
      console.error("Error updating availability:", error);
      res.status(500).json({ error: "Failed to update availability" });
    }
  }
);

/**
 * GET /api/venue-owner/stats
 * Statistiques détaillées pour le propriétaire
 */
router.get(
  "/stats",
  [authenticateToken, requireVenueOwner],
  async (req, res) => {
    try {
      const { period = "month" } = req.query; // month, week, year

      // Déterminer la période
      let dateFilter = "";
      switch (period) {
        case "week":
          dateFilter =
            "AND booking_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)";
          break;
        case "year":
          dateFilter = "AND YEAR(booking_date) = YEAR(CURRENT_DATE())";
          break;
        case "month":
        default:
          dateFilter =
            "AND MONTH(booking_date) = MONTH(CURRENT_DATE()) AND YEAR(booking_date) = YEAR(CURRENT_DATE())";
      }

      const [venues] = await db.execute(
        "SELECT id FROM locations WHERE owner_id = ? AND is_managed = true",
        [req.user.id]
      );

      if (venues.length === 0) {
        return res.json({ stats: null });
      }

      const venueIds = venues.map((v) => v.id);
      const placeholders = venueIds.map(() => "?").join(",");

      const [stats] = await db.execute(
        `
      SELECT
        COUNT(*) as total_bookings,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings,
        SUM(CASE WHEN payment_status = 'paid' THEN payment_amount ELSE 0 END) as total_revenue,
        AVG(duration) as avg_duration
      FROM venue_bookings
      WHERE venue_id IN (${placeholders})
      ${dateFilter}
    `,
        venueIds
      );

      res.json({
        period,
        stats: stats[0],
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  }
);

/**
 * GET /api/venue-owner/venues
 * Liste complète des terrains du propriétaire
 */
router.get(
  "/venues",
  [authenticateToken, requireVenueOwner],
  async (req, res) => {
    try {
      const [venues] = await db.execute(
        `
        SELECT
          l.*,
          (SELECT COUNT(*) FROM venue_bookings WHERE venue_id = l.id) as total_bookings,
          (SELECT COUNT(*) FROM venue_bookings WHERE venue_id = l.id AND status = 'pending') as pending_bookings
        FROM locations l
        WHERE l.owner_id = ? AND l.is_managed = true
        ORDER BY l.created_at DESC
      `,
        [req.user.id]
      );

      res.json({ venues });
    } catch (error) {
      console.error("Error fetching venues:", error);
      res.status(500).json({ error: "Failed to fetch venues" });
    }
  }
);

/**
 * POST /api/venue-owner/venues
 * Créer un nouveau terrain
 */
router.post(
  "/venues",
  [
    authenticateToken,
    requireVenueOwner,
    body("name").trim().isLength({ min: 3 }).withMessage("Name required"),
    body("address").trim().notEmpty().withMessage("Address required"),
    body("city").trim().notEmpty().withMessage("City required"),
    body("field_type").isIn(["indoor", "outdoor", "hybrid"]),
    body("field_surface ").optional(),
    body("capacity").optional().isInt({ min: 1 }),
    body("pricePerHour").optional().isFloat({ min: 0 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        name,
        address,
        city,
        field_type,
        field_surface,
        capacity,
        pricePerHour,
      } = req.body;

      const [result] = await db.execute(
        `
        INSERT INTO locations
        (name, address, city, field_type, field_surface , capacity, price_per_hour, owner_id, is_managed, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, true, true)
      `,
        [
          name,
          address,
          city,
          field_type,
          field_surface,
          capacity,
          pricePerHour,
          req.user.id,
        ]
      );

      const [venue] = await db.execute("SELECT * FROM locations WHERE id = ?", [
        result.insertId,
      ]);

      res.status(201).json({
        message: "Venue created successfully",
        venue: venue[0],
      });
    } catch (error) {
      console.error("Error creating venue:", error);
      res.status(500).json({ error: "Failed to create venue" });
    }
  }
);

/**
 * GET /api/venue-owner/venues/:venueId
 * Détails d'un terrain spécifique
 */
router.get(
  "/venues/:venueId",
  [authenticateToken, requireVenueOwner],
  async (req, res) => {
    try {
      const { venueId } = req.params;

      const [venues] = await db.execute(
        `
        SELECT
          l.*,
          (SELECT COUNT(*) FROM venue_bookings WHERE venue_id = l.id) as total_bookings,
          (SELECT COUNT(*) FROM venue_bookings WHERE venue_id = l.id AND status = 'pending') as pending_bookings,
          (SELECT COUNT(*) FROM venue_bookings WHERE venue_id = l.id AND status = 'confirmed') as confirmed_bookings
        FROM locations l
        WHERE l.id = ? AND l.owner_id = ? AND l.is_managed = true
      `,
        [venueId, req.user.id]
      );

      if (venues.length === 0) {
        return res.status(404).json({ error: "Venue not found" });
      }

      res.json(venues[0]);
    } catch (error) {
      console.error("Error fetching venue:", error);
      res.status(500).json({ error: "Failed to fetch venue" });
    }
  }
);

/**
 * PUT /api/venue-owner/venues/:venueId
 * Modifier un terrain
 */
router.put(
  "/venues/:venueId",
  [
    authenticateToken,
    requireVenueOwner,
    body("name").optional().trim().isLength({ min: 3 }),
    body("address").optional().trim().notEmpty(),
    body("city").optional().trim().notEmpty(),
    body("field_type").optional().isIn(["indoor", "outdoor", "hybrid"]),
    body("field_surface ").optional(),
    body("capacity").optional().isInt({ min: 1 }),
    body("pricePerHour").optional().isFloat({ min: 0 }),
    body("isActive").optional().isBoolean(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { venueId } = req.params;

      // Vérifier ownership
      const [venue] = await db.execute(
        "SELECT id FROM locations WHERE id = ? AND owner_id = ?",
        [venueId, req.user.id]
      );

      if (venue.length === 0) {
        return res.status(404).json({ error: "Venue not found" });
      }

      const updates = [];
      const values = [];

      if (req.body.name !== undefined) {
        updates.push("name = ?");
        values.push(req.body.name);
      }
      if (req.body.address !== undefined) {
        updates.push("address = ?");
        values.push(req.body.address);
      }
      if (req.body.city !== undefined) {
        updates.push("city = ?");
        values.push(req.body.city);
      }
      if (req.body.field_type !== undefined) {
        updates.push("field_type = ?");
        values.push(req.body.field_type);
      }
      if (req.body.field_surface !== undefined) {
        updates.push("field_surface  = ?");
        values.push(req.body.field_surface);
      }
      if (req.body.capacity !== undefined) {
        updates.push("capacity = ?");
        values.push(req.body.capacity);
      }
      if (req.body.pricePerHour !== undefined) {
        updates.push("price_per_hour = ?");
        values.push(req.body.pricePerHour);
      }
      if (req.body.isActive !== undefined) {
        updates.push("is_active = ?");
        values.push(req.body.isActive);
      }

      if (updates.length > 0) {
        values.push(venueId);
        await db.execute(
          `UPDATE locations SET ${updates.join(", ")} WHERE id = ?`,
          values
        );
      }

      const [updatedVenue] = await db.execute(
        "SELECT * FROM locations WHERE id = ?",
        [venueId]
      );

      res.json({
        message: "Venue updated successfully",
        venue: updatedVenue[0],
      });
    } catch (error) {
      console.error("Error updating venue:", error);
      res.status(500).json({ error: "Failed to update venue" });
    }
  }
);

/**
 * DELETE /api/venue-owner/venues/:venueId
 * Désactiver un terrain
 */
router.delete(
  "/venues/:venueId",
  [authenticateToken, requireVenueOwner],
  async (req, res) => {
    try {
      const { venueId } = req.params;

      // Vérifier ownership
      const [venue] = await db.execute(
        "SELECT id FROM locations WHERE id = ? AND owner_id = ?",
        [venueId, req.user.id]
      );

      if (venue.length === 0) {
        return res.status(404).json({ error: "Venue not found" });
      }

      // Soft delete - désactiver au lieu de supprimer
      await db.execute("UPDATE locations SET is_active = false WHERE id = ?", [
        venueId,
      ]);

      res.json({ message: "Venue deactivated successfully" });
    } catch (error) {
      console.error("Error deleting venue:", error);
      res.status(500).json({ error: "Failed to delete venue" });
    }
  }
);

/**
 * GET /api/venue-owner/venues/:venueId/bookings
 * Réservations d'un terrain spécifique
 */
router.get(
  "/venues/:venueId/bookings",
  [authenticateToken, requireVenueOwner],
  async (req, res) => {
    try {
      const { venueId } = req.params;
      const { status } = req.query;

      // Vérifier ownership
      const [venue] = await db.execute(
        "SELECT id FROM locations WHERE id = ? AND owner_id = ?",
        [venueId, req.user.id]
      );

      if (venue.length === 0) {
        return res.status(404).json({ error: "Venue not found" });
      }

      let query = `
        SELECT
          vb.*,
          t.name as team_name,
          logo.stored_filename as team_logo_filename,
          u.first_name as booker_first_name,
          u.last_name as booker_last_name,
          u.email as booker_email
        FROM venue_bookings vb
        JOIN teams t ON vb.team_id = t.id
        LEFT JOIN uploads logo ON t.logo_id = logo.id
        JOIN users u ON vb.booked_by = u.id
        WHERE vb.venue_id = ?
      `;

      const params = [venueId];

      if (status) {
        query += " AND vb.status = ?";
        params.push(status);
      }

      query += " ORDER BY vb.booking_date DESC, vb.start_time DESC";

      const [bookings] = await db.execute(query, params);

      res.json({
        venueId,
        count: bookings.length,
        bookings,
      });
    } catch (error) {
      console.error("Error fetching venue bookings:", error);
      res.status(500).json({ error: "Failed to fetch venue bookings" });
    }
  }
);

/**
 * GET /api/venue-owner/revenue
 * Détails des revenus
 */
router.get(
  "/revenue",
  [authenticateToken, requireVenueOwner],
  async (req, res) => {
    try {
      const { period = "month", year, month } = req.query;

      const [venues] = await db.execute(
        "SELECT id FROM locations WHERE owner_id = ? AND is_managed = true",
        [req.user.id]
      );

      if (venues.length === 0) {
        return res.json({ revenue: [] });
      }

      const venueIds = venues.map((v) => v.id);
      const placeholders = venueIds.map(() => "?").join(",");

      let dateFilter = "";
      let groupBy = "";

      switch (period) {
        case "day":
          dateFilter =
            year && month
              ? `AND YEAR(booking_date) = ${year} AND MONTH(booking_date) = ${month}`
              : "AND MONTH(booking_date) = MONTH(CURRENT_DATE()) AND YEAR(booking_date) = YEAR(CURRENT_DATE())";
          groupBy = "DATE(booking_date)";
          break;
        case "month":
          dateFilter = year
            ? `AND YEAR(booking_date) = ${year}`
            : "AND YEAR(booking_date) = YEAR(CURRENT_DATE())";
          groupBy = "YEAR(booking_date), MONTH(booking_date)";
          break;
        case "year":
          dateFilter = "";
          groupBy = "YEAR(booking_date)";
          break;
        default:
          dateFilter =
            "AND MONTH(booking_date) = MONTH(CURRENT_DATE()) AND YEAR(booking_date) = YEAR(CURRENT_DATE())";
          groupBy = "DATE(booking_date)";
      }

      const [revenue] = await db.execute(
        `
        SELECT
          ${groupBy} as period,
          COUNT(*) as total_bookings,
          SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings,
          SUM(CASE WHEN status = 'confirmed' AND payment_status = 'paid' THEN payment_amount ELSE 0 END) as total_revenue,
          SUM(CASE WHEN status = 'confirmed' AND payment_status = 'pending' THEN payment_amount ELSE 0 END) as pending_revenue
        FROM venue_bookings
        WHERE venue_id IN (${placeholders})
        ${dateFilter}
        GROUP BY ${groupBy}
        ORDER BY period DESC
      `,
        venueIds
      );

      res.json({
        period,
        revenue,
      });
    } catch (error) {
      console.error("Error fetching revenue:", error);
      res.status(500).json({ error: "Failed to fetch revenue" });
    }
  }
);

/**
 * GET /api/venue-owner/settings
 * Paramètres du propriétaire
 */
router.get(
  "/settings",
  [authenticateToken, requireVenueOwner],
  async (req, res) => {
    try {
      const [settings] = await db.execute(
        `
        SELECT
          id, email, first_name, last_name, phone,
          company, address, notification_preferences
        FROM users
        WHERE id = ?
      `,
        [req.user.id]
      );

      if (settings.length === 0) {
        return res.status(404).json({ error: "Settings not found" });
      }

      res.json(settings[0]);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  }
);

/**
 * PUT /api/venue-owner/settings
 * Mettre à jour les paramètres
 */
router.put(
  "/settings",
  [
    authenticateToken,
    requireVenueOwner,
    body("firstName").optional().trim().isLength({ min: 2 }),
    body("lastName").optional().trim().isLength({ min: 2 }),
    body("phone").optional().trim(),
    body("company").optional().trim(),
    body("address").optional().trim(),
    body("notificationPreferences").optional().isObject(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const updates = [];
      const values = [];

      if (req.body.firstName !== undefined) {
        updates.push("first_name = ?");
        values.push(req.body.firstName);
      }
      if (req.body.lastName !== undefined) {
        updates.push("last_name = ?");
        values.push(req.body.lastName);
      }
      if (req.body.phone !== undefined) {
        updates.push("phone = ?");
        values.push(req.body.phone);
      }
      if (req.body.company !== undefined) {
        updates.push("company = ?");
        values.push(req.body.company);
      }
      if (req.body.address !== undefined) {
        updates.push("address = ?");
        values.push(req.body.address);
      }
      if (req.body.notificationPreferences !== undefined) {
        updates.push("notification_preferences = ?");
        values.push(JSON.stringify(req.body.notificationPreferences));
      }

      if (updates.length > 0) {
        values.push(req.user.id);
        await db.execute(
          `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
          values
        );
      }

      const [updatedSettings] = await db.execute(
        `
        SELECT
          id, email, first_name, last_name, phone,
          company, address, notification_preferences
        FROM users
        WHERE id = ?
      `,
        [req.user.id]
      );

      res.json({
        message: "Settings updated successfully",
        settings: updatedSettings[0],
      });
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  }
);

module.exports = router;
