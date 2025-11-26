const express = require("express");
const { body, query, validationResult } = require("express-validator");
const db = require("../config/database");
const { authenticateToken, requireManager } = require("../middleware/auth");

const router = express.Router();

/**
 * GET /api/bookings/my-bookings
 * Récupérer les réservations de l'utilisateur
 */
router.get("/my-bookings", authenticateToken, async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;

    let query = `
      SELECT
        vb.*,
        l.name as venue_name,
        l.address as venue_address,
        l.city as venue_city,
        l.field_surface,
        l.field_size,
        t.name as team_name,
        t.logo_id,
        logo.stored_filename as team_logo_filename
      FROM venue_bookings vb
      JOIN locations l ON vb.location_id = l.id
      JOIN teams t ON vb.team_id = t.id
      LEFT JOIN uploads logo ON t.logo_id = logo.id AND logo.is_active = true
      WHERE vb.booked_by = ?
    `;

    const queryParams = [req.user.id];

    if (status) {
      query += " AND vb.status = ?";
      queryParams.push(status);
    }

    query += " ORDER BY vb.booking_date DESC, vb.start_time DESC LIMIT ? OFFSET ?";
    queryParams.push(parseInt(limit), parseInt(offset));

    const [bookings] = await db.execute(query, queryParams);

    const formattedBookings = bookings.map(b => ({
      id: b.id,
      venue: {
        id: b.location_id,
        name: b.venue_name,
        address: b.venue_address,
        city: b.venue_city,
        fieldSurface: b.field_surface,
        fieldSize: b.field_size
      },
      team: {
        id: b.team_id,
        name: b.team_name,
        logoUrl: b.team_logo_filename ? `/uploads/teams/${b.team_logo_filename}` : null
      },
      matchId: b.match_id,
      bookingDate: b.booking_date,
      startTime: b.start_time,
      endTime: b.end_time,
      duration: b.duration_minutes,
      gameType: b.game_type,
      status: b.status,
      pricing: {
        basePrice: parseFloat(b.base_price),
        discount: parseFloat(b.discount_applied),
        finalPrice: parseFloat(b.final_price)
      },
      paymentStatus: b.payment_status,
      paymentMethod: b.payment_method,
      paidAt: b.paid_at,
      notes: b.notes,
      createdAt: b.created_at
    }));

    res.json({
      success: true,
      count: formattedBookings.length,
      bookings: formattedBookings
    });
  } catch (error) {
    console.error("Get my bookings error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/bookings/team/:teamId
 * Récupérer les réservations d'une équipe
 */
router.get("/team/:teamId", authenticateToken, async (req, res) => {
  try {
    const teamId = req.params.teamId;
    const { status, upcoming, limit = 20, offset = 0 } = req.query;

    // Vérifier que l'utilisateur fait partie de l'équipe
    const [membership] = await db.execute(
      "SELECT id FROM team_members WHERE team_id = ? AND user_id = ? AND is_active = true",
      [teamId, req.user.id]
    );

    if (membership.length === 0) {
      return res.status(403).json({ error: "Not a member of this team" });
    }

    let query = `
      SELECT
        vb.*,
        l.name as venue_name,
        l.address as venue_address,
        l.city as venue_city,
        l.field_surface,
        l.field_size,
        u.first_name as booked_by_first_name,
        u.last_name as booked_by_last_name
      FROM venue_bookings vb
      JOIN locations l ON vb.location_id = l.id
      JOIN users u ON vb.booked_by = u.id
      WHERE vb.team_id = ?
    `;

    const queryParams = [teamId];

    if (status) {
      query += " AND vb.status = ?";
      queryParams.push(status);
    }

    if (upcoming === 'true') {
      query += " AND vb.booking_date >= CURDATE()";
    }

    query += " ORDER BY vb.booking_date DESC, vb.start_time DESC LIMIT ? OFFSET ?";
    queryParams.push(parseInt(limit), parseInt(offset));

    const [bookings] = await db.execute(query, queryParams);

    const formattedBookings = bookings.map(b => ({
      id: b.id,
      venue: {
        id: b.location_id,
        name: b.venue_name,
        address: b.venue_address,
        city: b.venue_city,
        fieldSurface: b.field_surface,
        fieldSize: b.field_size
      },
      matchId: b.match_id,
      bookingDate: b.booking_date,
      startTime: b.start_time,
      endTime: b.end_time,
      duration: b.duration_minutes,
      gameType: b.game_type,
      status: b.status,
      pricing: {
        basePrice: parseFloat(b.base_price),
        discount: parseFloat(b.discount_applied),
        finalPrice: parseFloat(b.final_price)
      },
      paymentStatus: b.payment_status,
      bookedBy: {
        firstName: b.booked_by_first_name,
        lastName: b.booked_by_last_name
      },
      notes: b.notes,
      createdAt: b.created_at
    }));

    res.json({
      success: true,
      count: formattedBookings.length,
      bookings: formattedBookings
    });
  } catch (error) {
    console.error("Get team bookings error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/bookings/:id
 * Détails d'une réservation
 */
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const bookingId = req.params.id;

    const [bookings] = await db.execute(
      `SELECT
        vb.*,
        l.name as venue_name,
        l.address as venue_address,
        l.city as venue_city,
        l.field_surface,
        l.field_size,
        l.manager_name,
        l.manager_phone,
        l.manager_email,
        t.name as team_name,
        t.captain_id,
        u.first_name as booked_by_first_name,
        u.last_name as booked_by_last_name,
        u.email as booked_by_email,
        u.phone as booked_by_phone
      FROM venue_bookings vb
      JOIN locations l ON vb.location_id = l.id
      JOIN teams t ON vb.team_id = t.id
      JOIN users u ON vb.booked_by = u.id
      WHERE vb.id = ?`,
      [bookingId]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const booking = bookings[0];

    // Vérifier que l'utilisateur a accès (membre de l'équipe ou créateur)
    const [membership] = await db.execute(
      `SELECT id FROM team_members
       WHERE team_id = ? AND user_id = ? AND is_active = true`,
      [booking.team_id, req.user.id]
    );

    if (membership.length === 0 && booking.booked_by !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({
      success: true,
      booking: {
        id: booking.id,
        venue: {
          id: booking.location_id,
          name: booking.venue_name,
          address: booking.venue_address,
          city: booking.venue_city,
          fieldSurface: booking.field_surface,
          fieldSize: booking.field_size,
          manager: {
            name: booking.manager_name,
            phone: booking.manager_phone,
            email: booking.manager_email
          }
        },
        team: {
          id: booking.team_id,
          name: booking.team_name,
          captainId: booking.captain_id
        },
        matchId: booking.match_id,
        bookingDate: booking.booking_date,
        startTime: booking.start_time,
        endTime: booking.end_time,
        duration: booking.duration_minutes,
        gameType: booking.game_type,
        status: booking.status,
        pricing: {
          basePrice: parseFloat(booking.base_price),
          discount: parseFloat(booking.discount_applied),
          finalPrice: parseFloat(booking.final_price)
        },
        paymentStatus: booking.payment_status,
        paymentMethod: booking.payment_method,
        paidAt: booking.paid_at,
        bookedBy: {
          id: booking.booked_by,
          firstName: booking.booked_by_first_name,
          lastName: booking.booked_by_last_name,
          email: booking.booked_by_email,
          phone: booking.booked_by_phone
        },
        notes: booking.notes,
        cancellationReason: booking.cancellation_reason,
        cancelledAt: booking.cancelled_at,
        createdAt: booking.created_at,
        updatedAt: booking.updated_at
      }
    });
  } catch (error) {
    console.error("Get booking details error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /api/bookings/:id/confirm
 * Confirmer une réservation
 */
router.patch("/:id/confirm", authenticateToken, async (req, res) => {
  try {
    const bookingId = req.params.id;

    const [bookings] = await db.execute(
      `SELECT vb.*, t.captain_id
       FROM venue_bookings vb
       JOIN teams t ON vb.team_id = t.id
       WHERE vb.id = ?`,
      [bookingId]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const booking = bookings[0];

    // Seul le capitaine ou celui qui a réservé peut confirmer
    if (booking.captain_id !== req.user.id && booking.booked_by !== req.user.id) {
      return res.status(403).json({ error: "Only team captain or booking creator can confirm" });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ error: "Only pending bookings can be confirmed" });
    }

    await db.execute(
      "UPDATE venue_bookings SET status = 'confirmed' WHERE id = ?",
      [bookingId]
    );

    res.json({
      success: true,
      message: "Booking confirmed successfully"
    });
  } catch (error) {
    console.error("Confirm booking error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /api/bookings/:id/cancel
 * Annuler une réservation
 */
router.patch(
  "/:id/cancel",
  [
    authenticateToken,
    body("reason").optional().trim().isLength({ max: 500 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const bookingId = req.params.id;
      const { reason } = req.body;

      const [bookings] = await db.execute(
        `SELECT vb.*, t.captain_id
         FROM venue_bookings vb
         JOIN teams t ON vb.team_id = t.id
         WHERE vb.id = ?`,
        [bookingId]
      );

      if (bookings.length === 0) {
        return res.status(404).json({ error: "Booking not found" });
      }

      const booking = bookings[0];

      // Seul le capitaine ou celui qui a réservé peut annuler
      if (booking.captain_id !== req.user.id && booking.booked_by !== req.user.id) {
        return res.status(403).json({ error: "Only team captain or booking creator can cancel" });
      }

      if (booking.status === 'completed') {
        return res.status(400).json({ error: "Cannot cancel completed booking" });
      }

      if (booking.status === 'cancelled') {
        return res.status(400).json({ error: "Booking already cancelled" });
      }

      await db.execute(
        `UPDATE venue_bookings
         SET status = 'cancelled',
             cancellation_reason = ?,
             cancelled_at = NOW()
         WHERE id = ?`,
        [reason || 'No reason provided', bookingId]
      );

      res.json({
        success: true,
        message: "Booking cancelled successfully"
      });
    } catch (error) {
      console.error("Cancel booking error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * PATCH /api/bookings/:id/complete
 * Marquer une réservation comme terminée
 */
router.patch("/:id/complete", authenticateToken, async (req, res) => {
  try {
    const bookingId = req.params.id;

    const [bookings] = await db.execute(
      `SELECT vb.*, t.captain_id
       FROM venue_bookings vb
       JOIN teams t ON vb.team_id = t.id
       WHERE vb.id = ?`,
      [bookingId]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const booking = bookings[0];

    // Seul le capitaine ou celui qui a réservé peut marquer comme terminé
    if (booking.captain_id !== req.user.id && booking.booked_by !== req.user.id) {
      return res.status(403).json({ error: "Only team captain or booking creator can mark as completed" });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({ error: "Only confirmed bookings can be marked as completed" });
    }

    await db.execute(
      "UPDATE venue_bookings SET status = 'completed' WHERE id = ?",
      [bookingId]
    );

    res.json({
      success: true,
      message: "Booking marked as completed"
    });
  } catch (error) {
    console.error("Complete booking error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /api/bookings/:id/payment
 * Mettre à jour le statut de paiement
 */
router.patch(
  "/:id/payment",
  [
    authenticateToken,
    body("paymentStatus").isIn(['pending', 'paid', 'refunded', 'cancelled']).withMessage("Valid payment status required"),
    body("paymentMethod").optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const bookingId = req.params.id;
      const { paymentStatus, paymentMethod } = req.body;

      const [bookings] = await db.execute(
        `SELECT vb.*, t.captain_id
         FROM venue_bookings vb
         JOIN teams t ON vb.team_id = t.id
         WHERE vb.id = ?`,
        [bookingId]
      );

      if (bookings.length === 0) {
        return res.status(404).json({ error: "Booking not found" });
      }

      const booking = bookings[0];

      // Seul le capitaine ou celui qui a réservé peut modifier le paiement
      if (booking.captain_id !== req.user.id && booking.booked_by !== req.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const paidAt = paymentStatus === 'paid' ? new Date() : null;

      await db.execute(
        `UPDATE venue_bookings
         SET payment_status = ?,
             payment_method = ?,
             paid_at = ?
         WHERE id = ?`,
        [paymentStatus, paymentMethod || null, paidAt, bookingId]
      );

      res.json({
        success: true,
        message: "Payment status updated successfully"
      });
    } catch (error) {
      console.error("Update payment error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

module.exports = router;
