const express = require("express");
const { body, validationResult } = require("express-validator");
const { authenticateToken } = require("../middleware/auth");
const db = require("../config/database");

const router = express.Router();

/**
 * Middleware: Verify Venue Owner Access
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
 * Dashboard stats and venues list
 */
router.get(
  "/dashboard",
  [authenticateToken, requireVenueOwner],
  async (req, res) => {
    try {
      // 1. Get Owner's Venues
      const [venues] = await db.execute(
        `SELECT id, name, city, address, field_type, is_active
       FROM locations
       WHERE owner_id = ? AND is_managed = true`,
        [req.user.id]
      );

      // 2. Get Global Stats
      const venueIds = venues.map((v) => v.id);
      let stats = {
        totalBookings: 0,
        pendingBookings: 0,
        confirmedBookings: 0,
        totalRevenue: 0,
        monthRevenue: 0,
      };

      if (venueIds.length > 0) {
        const placeholders = venueIds.map(() => "?").join(",");

        const [statsResult] = await db.execute(
          `
        SELECT
          COUNT(*) as totalBookings,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingBookings,
          SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmedBookings,
          SUM(CASE WHEN status = 'confirmed' AND payment_status = 'paid' THEN final_price ELSE 0 END) as totalRevenue,
          SUM(CASE WHEN status = 'confirmed' AND payment_status = 'paid'
              AND MONTH(booking_date) = MONTH(CURRENT_DATE())
              AND YEAR(booking_date) = YEAR(CURRENT_DATE())
              THEN final_price ELSE 0 END) as monthRevenue
        FROM venue_bookings
        WHERE location_id IN (${placeholders})
      `,
          venueIds
        );

        if (statsResult[0]) {
          stats = {
            totalBookings: parseInt(statsResult[0].totalBookings) || 0,
            pendingBookings: parseInt(statsResult[0].pendingBookings) || 0,
            confirmedBookings: parseInt(statsResult[0].confirmedBookings) || 0,
            totalRevenue: parseFloat(statsResult[0].totalRevenue) || 0,
            monthRevenue: parseFloat(statsResult[0].monthRevenue) || 0,
          };
        }
      }

      // Format Venues for Frontend
      const formattedVenues = venues.map((v) => ({
        id: v.id,
        name: v.name,
        city: v.city,
        address: v.address,
        fieldType: v.field_type,
        isActive: Boolean(v.is_active),
      }));

      res.json({
        venues: formattedVenues,
        stats,
      });
    } catch (error) {
      console.error("Error fetching venue owner dashboard:", error);
      res.status(500).json({ error: "Failed to fetch dashboard" });
    }
  }
);

/**
 * GET /api/venue-owner/bookings
 * List bookings with filters
 */
router.get(
  "/bookings",
  [authenticateToken, requireVenueOwner],
  async (req, res) => {
    try {
      const { status, venue_id } = req.query;

      // CORRECTION : Utilisation de location_id et sélection précise des champs
      let query = `
      SELECT
        vb.id, vb.booking_date, vb.start_time, vb.end_time, vb.duration_minutes,
        vb.status, vb.payment_status, vb.final_price,
        l.name as venue_name,
        l.city as venue_city,
        l.address as venue_address,
        t.name as team_name,
        u.first_name as booker_first_name,
        u.last_name as booker_last_name,
        u.email as booker_email
      FROM venue_bookings vb
      JOIN locations l ON vb.location_id = l.id
      JOIN teams t ON vb.team_id = t.id
      JOIN users u ON vb.booked_by = u.id
      WHERE l.owner_id = ? AND l.is_managed = true
    `;

      const params = [req.user.id];

      if (status && status !== "all") {
        query += " AND vb.status = ?";
        params.push(status);
      }

      if (venue_id) {
        query += " AND vb.location_id = ?";
        params.push(venue_id);
      }

      query += " ORDER BY vb.booking_date DESC, vb.start_time DESC";

      const [rows] = await db.execute(query, params);

      // TRANSFORMATION EN CAMELCASE pour le frontend
      const bookings = rows.map((row) => ({
        id: row.id,
        venueName: row.venue_name,
        venueCity: row.venue_city,
        venueAddress: row.venue_address,
        teamName: row.team_name,
        bookerName: `${row.booker_first_name} ${row.booker_last_name}`,
        bookerEmail: row.booker_email,
        bookingDate: row.booking_date,
        startTime: row.start_time,
        endTime: row.end_time,
        duration: row.duration_minutes,
        status: row.status,
        paymentStatus: row.payment_status,
        price: parseFloat(row.final_price) || 0,
      }));

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
 * Booking details
 */
router.get(
  "/bookings/:id",
  [authenticateToken, requireVenueOwner],
  async (req, res) => {
    try {
      const { id } = req.params;

      const [rows] = await db.execute(
        `
      SELECT
        vb.*,
        l.name as venue_name, l.address as venue_address, l.city as venue_city, l.field_type,
        t.name as team_name,
        u.first_name, u.last_name, u.email, u.phone
      FROM venue_bookings vb
      JOIN locations l ON vb.location_id = l.id
      JOIN teams t ON vb.team_id = t.id
      JOIN users u ON vb.booked_by = u.id
      WHERE vb.id = ? AND l.owner_id = ?
    `,
        [id, req.user.id]
      );

      if (rows.length === 0) {
        const booking = [];
        return res.json(booking);
      }

      const b = rows[0];
      const booking = {
        id: b.id,
        status: b.status,
        venueName: b.venue_name,
        venueAddress: b.venue_address,
        fieldType: b.field_type,
        bookingDate: b.booking_date,
        startTime: b.start_time,
        endTime: b.end_time,
        durationMinutes: b.duration_minutes,
        teamName: b.team_name,
        bookerFirstName: b.first_name,
        bookerLastName: b.last_name,
        bookerEmail: b.email,
        bookerPhone: b.phone,
        price: parseFloat(b.final_price) || 0,
        basePrice: parseFloat(b.base_price) || 0,
        paymentStatus: b.payment_status,
      };

      res.json(booking);
    } catch (error) {
      console.error("Error fetching booking detail:", error);
      res.status(500).json({ error: "Failed to fetch booking" });
    }
  }
);

/**
 * PUT /api/venue-owner/bookings/:id/respond
 * Accept/Reject booking
 */
router.put(
  "/bookings/:id/respond",
  [authenticateToken, requireVenueOwner],
  async (req, res) => {
    const { action, message } = req.body; // action: 'accept' | 'reject'

    if (!["accept", "reject"].includes(action)) {
      return res.status(400).json({ error: "Invalid action" });
    }

    try {
      // Verify ownership
      const [rows] = await db.execute(
        `
      SELECT vb.id, vb.status, vb.location_id 
      FROM venue_bookings vb
      JOIN locations l ON vb.location_id = l.id
      WHERE vb.id = ? AND l.owner_id = ?
    `,
        [req.params.id, req.user.id]
      );

      if (rows.length === 0)
        return res.status(404).json({ error: "Booking not found" });
      if (rows[0].status !== "pending")
        return res.status(400).json({ error: "Booking already processed" });

      const newStatus = action === "accept" ? "confirmed" : "cancelled";

      await db.execute(
        `
      UPDATE venue_bookings
      SET status = ?, owner_response_message = ?, owner_responded_at = NOW()
      WHERE id = ?
    `,
        [newStatus, message, req.params.id]
      );

      res.json({ success: true, status: newStatus });
    } catch (error) {
      console.error("Error responding to booking:", error);
      res.status(500).json({ error: "Internal error" });
    }
  }
);

/**
 * GET /api/venue-owner/venues/:venueId/calendar
 */
router.get(
  "/venues/:venueId/calendar",
  [authenticateToken, requireVenueOwner],
  async (req, res) => {
    try {
      const { venueId } = req.params;
      const { start_date, end_date } = req.query;

      // Verify ownership
      const [venue] = await db.execute(
        "SELECT id FROM locations WHERE id = ? AND owner_id = ?",
        [venueId, req.user.id]
      );
      if (venue.length === 0)
        return res.status(404).json({ error: "Venue not found" });

      const [bookings] = await db.execute(
        `
      SELECT
        vb.id, vb.booking_date, vb.start_time, vb.duration_minutes, vb.status,
        t.name as team_name
      FROM venue_bookings vb
      JOIN teams t ON vb.team_id = t.id
      WHERE vb.location_id = ? 
      AND vb.booking_date BETWEEN ? AND ?
      AND vb.status != 'cancelled'
    `,
        [venueId, start_date, end_date]
      );

      // Format for Calendar
      const formatted = bookings.map((b) => ({
        id: b.id,
        title: b.team_name,
        start: `${b.booking_date.toISOString().split("T")[0]}T${b.start_time}`,
        // Simple end time calc for display (real logic might be more complex)
        end: b.start_time,
        status: b.status,
        team_name: b.team_name,
        booking_date: b.booking_date,
        start_time: b.start_time,
      }));

      res.json({ bookings: formatted });
    } catch (error) {
      console.error("Error fetching calendar:", error);
      res.status(500).json({ error: "Internal error" });
    }
  }
);

/**
 * POST /api/venue-owner/venues
 * Créer un nouveau terrain
 */
router.post("/venues", [authenticateToken], async (req, res) => {
  // Vérification basique du rôle (le middleware requireVenueOwner peut aussi être utilisé)
  if (
    req.user.user_type !== "venue_owner" &&
    req.user.user_type !== "superadmin"
  ) {
    return res.status(403).json({ error: "Access denied" });
  }

  const {
    name,
    address,
    city,
    fieldType,
    fieldSurface,
    fieldSize,
    managerPhone,
  } = req.body;

  try {
    const [result] = await db.execute(
      `
            INSERT INTO locations 
            (owner_id, name, address, city, field_type, field_surface, field_size, manager_phone, is_active, is_managed, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, true, true, NOW())
        `,
      [
        req.user.id,
        name,
        address,
        city,
        fieldType || "indoor",
        fieldSurface || "synthetic",
        fieldSize || "5v5",
        managerPhone || null,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Terrain créé avec succès",
      venueId: result.insertId,
    });
  } catch (error) {
    console.error("Error creating venue:", error);
    res.status(500).json({ error: "Failed to create venue" });
  }
});

/**
 * GET /api/venue-owner/stats
 * CORRECTION: Renvoie maintenant les clés en camelCase
 */
router.get("/stats", [authenticateToken], async (req, res) => {
  // ... (Code de vérification du rôle identique) ...
  if (
    req.user.user_type !== "venue_owner" &&
    req.user.user_type !== "superadmin"
  ) {
    return res.status(403).json({ error: "Access denied" });
  }

  try {
    const { period = "month" } = req.query;
    let dateFilter = "";

    // Filtres SQL (identique à avant)
    if (period === "month") {
      dateFilter =
        "AND MONTH(vb.booking_date) = MONTH(CURRENT_DATE()) AND YEAR(vb.booking_date) = YEAR(CURRENT_DATE())";
    } else if (period === "year") {
      dateFilter = "AND YEAR(vb.booking_date) = YEAR(CURRENT_DATE())";
    } else if (period === "week") {
      dateFilter =
        "AND vb.booking_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)";
    }

    const [result] = await db.execute(
      `
            SELECT
                COUNT(*) as total_bookings,
                SUM(CASE WHEN vb.status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings,
                SUM(CASE WHEN vb.payment_status = 'paid' THEN vb.final_price ELSE 0 END) as total_revenue,
                AVG(vb.duration_minutes) as avg_duration
            FROM venue_bookings vb
            JOIN locations l ON vb.location_id = l.id
            WHERE l.owner_id = ? ${dateFilter}
        `,
      [req.user.id]
    );

    // MAPPING CAMELCASE ICI
    const stats = result[0]
      ? {
          totalBookings: parseInt(result[0].total_bookings) || 0,
          confirmedBookings: parseInt(result[0].confirmed_bookings) || 0,
          totalRevenue: parseFloat(result[0].total_revenue) || 0,
          avgDuration: parseFloat(result[0].avg_duration) || 0,
        }
      : {};

    res.json({ stats });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Internal error" });
  }
});

module.exports = router;
