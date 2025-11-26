const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Middleware pour vérifier que l'utilisateur est superadmin
const requireSuperadmin = requireRole('superadmin');

/**
 * GET /api/admin/dashboard
 * Récupérer les statistiques du dashboard admin
 */
router.get('/dashboard', [authenticateToken, requireSuperadmin], async (req, res) => {
  try {
    // Statistiques générales
    const [stats] = await db.execute(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE is_active = true) as total_users,
        (SELECT COUNT(*) FROM users WHERE user_type = 'player' AND is_active = true) as total_players,
        (SELECT COUNT(*) FROM users WHERE user_type = 'manager' AND is_active = true) as total_managers,
        (SELECT COUNT(*) FROM teams WHERE is_active = true) as total_teams,
        (SELECT COUNT(*) FROM matches) as total_matches,
        (SELECT COUNT(*) FROM matches WHERE status = 'confirmed') as confirmed_matches,
        (SELECT COUNT(*) FROM locations WHERE is_active = true) as total_venues,
        (SELECT COUNT(*) FROM referees WHERE is_active = true) as total_referees,
        (SELECT COUNT(*) FROM reports WHERE status = 'open') as open_reports,
        (SELECT COUNT(*) FROM bans WHERE is_active = true) as active_bans
    `);

    // Utilisateurs récents
    const [recentUsers] = await db.execute(`
      SELECT id, first_name, last_name, email, user_type, created_at
      FROM users
      WHERE is_active = true
      ORDER BY created_at DESC
      LIMIT 10
    `);

    // Rapports récents
    const [recentReports] = await db.execute(`
      SELECT r.id, r.reason, r.status, r.created_at,
             u1.first_name as reporter_first_name, u1.last_name as reporter_last_name,
             u2.first_name as reported_first_name, u2.last_name as reported_last_name
      FROM reports r
      JOIN users u1 ON r.reporter_id = u1.id
      LEFT JOIN users u2 ON r.reported_user_id = u2.id
      WHERE r.status = 'open'
      ORDER BY r.created_at DESC
      LIMIT 10
    `);

    res.json({
      stats: stats[0],
      recentUsers,
      recentReports
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/users
 * Liste des utilisateurs avec filtres
 */
router.get('/users', [authenticateToken, requireSuperadmin], async (req, res) => {
  try {
    const { userType, search, isActive, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT u.id, u.first_name, u.last_name, u.email, u.user_type,
             u.is_active, u.created_at, u.last_login,
             (SELECT COUNT(*) FROM bans WHERE user_id = u.id AND is_active = true) as active_bans
      FROM users u
      WHERE 1=1
    `;

    const params = [];

    if (userType) {
      query += ' AND u.user_type = ?';
      params.push(userType);
    }

    if (isActive !== undefined) {
      query += ' AND u.is_active = ?';
      params.push(isActive === 'true' ? 1 : 0);
    }

    if (search) {
      query += ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    query += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [users] = await db.execute(query, params);

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/admin/users/:id/activate
 * Activer un utilisateur
 */
router.patch('/users/:id/activate', [authenticateToken, requireSuperadmin], async (req, res) => {
  try {
    const userId = req.params.id;

    await db.execute(
      'UPDATE users SET is_active = true WHERE id = ?',
      [userId]
    );

    // Log l'action
    await db.execute(
      `INSERT INTO admin_logs (admin_id, action, entity_type, entity_id, details)
       VALUES (?, 'activate_user', 'user', ?, ?)`,
      [req.user.id, userId, JSON.stringify({ activated_by: req.user.email })]
    );

    res.json({ message: 'User activated successfully' });
  } catch (error) {
    console.error('Activate user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/admin/users/:id/deactivate
 * Désactiver un utilisateur
 */
router.patch('/users/:id/deactivate', [authenticateToken, requireSuperadmin], async (req, res) => {
  try {
    const userId = req.params.id;

    // Empêcher la désactivation des superadmins
    const [user] = await db.execute('SELECT user_type FROM users WHERE id = ?', [userId]);
    if (user.length > 0 && user[0].user_type === 'superadmin') {
      return res.status(403).json({ error: 'Cannot deactivate a superadmin' });
    }

    await db.execute(
      'UPDATE users SET is_active = false WHERE id = ?',
      [userId]
    );

    // Log l'action
    await db.execute(
      `INSERT INTO admin_logs (admin_id, action, entity_type, entity_id, details)
       VALUES (?, 'deactivate_user', 'user', ?, ?)`,
      [req.user.id, userId, JSON.stringify({ deactivated_by: req.user.email })]
    );

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/admin/bans
 * Bannir un utilisateur
 */
router.post('/bans', [
  authenticateToken,
  requireSuperadmin,
  body('userId').isInt(),
  body('reason').trim().isLength({ min: 10, max: 1000 }),
  body('duration').optional().isInt({ min: 1 }),
  body('isPermanent').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, reason, duration, isPermanent } = req.body;

    // Empêcher le bannissement des superadmins
    const [user] = await db.execute('SELECT user_type FROM users WHERE id = ?', [userId]);
    if (user.length > 0 && user[0].user_type === 'superadmin') {
      return res.status(403).json({ error: 'Cannot ban a superadmin' });
    }

    const expiresAt = isPermanent ? null : new Date(Date.now() + duration * 24 * 60 * 60 * 1000);

    const [result] = await db.execute(
      `INSERT INTO bans (user_id, banned_by, reason, expires_at)
       VALUES (?, ?, ?, ?)`,
      [userId, req.user.id, reason, expiresAt]
    );

    // Log l'action
    await db.execute(
      `INSERT INTO admin_logs (admin_id, action, entity_type, entity_id, details)
       VALUES (?, 'ban_user', 'user', ?, ?)`,
      [req.user.id, userId, JSON.stringify({ reason, duration, isPermanent, ban_id: result.insertId })]
    );

    res.status(201).json({
      message: 'User banned successfully',
      banId: result.insertId
    });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/admin/bans/:id/revoke
 * Révoquer un bannissement
 */
router.patch('/bans/:id/revoke', [authenticateToken, requireSuperadmin], async (req, res) => {
  try {
    const banId = req.params.id;

    await db.execute(
      'UPDATE bans SET is_active = false, revoked_at = NOW(), revoked_by = ? WHERE id = ?',
      [req.user.id, banId]
    );

    // Log l'action
    await db.execute(
      `INSERT INTO admin_logs (admin_id, action, entity_type, entity_id, details)
       VALUES (?, 'revoke_ban', 'ban', ?, ?)`,
      [req.user.id, banId, JSON.stringify({ revoked_by: req.user.email })]
    );

    res.json({ message: 'Ban revoked successfully' });
  } catch (error) {
    console.error('Revoke ban error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/reports
 * Liste des signalements
 */
router.get('/reports', [authenticateToken, requireSuperadmin], async (req, res) => {
  try {
    const { status = 'all', limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT r.id, r.reason, r.description, r.status, r.created_at,
             u1.first_name as reporter_first_name, u1.last_name as reporter_last_name,
             u2.first_name as reported_user_first_name, u2.last_name as reported_user_last_name,
             t.name as reported_team_name,
             m.id as reported_match_id
      FROM reports r
      JOIN users u1 ON r.reporter_id = u1.id
      LEFT JOIN users u2 ON r.reported_user_id = u2.id
      LEFT JOIN teams t ON r.reported_team_id = t.id
      LEFT JOIN matches m ON r.reported_match_id = m.id
      WHERE 1=1
    `;

    const params = [];

    if (status !== 'all') {
      query += ' AND r.status = ?';
      params.push(status);
    }

    query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [reports] = await db.execute(query, params);

    res.json({ reports });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/admin/reports/:id
 * Mettre à jour le statut d'un signalement
 */
router.patch('/reports/:id', [
  authenticateToken,
  requireSuperadmin,
  body('status').isIn(['open', 'investigating', 'resolved', 'dismissed']),
  body('adminNotes').optional().trim().isLength({ max: 2000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const reportId = req.params.id;
    const { status, adminNotes } = req.body;

    await db.execute(
      `UPDATE reports
       SET status = ?, admin_notes = ?, handled_by = ?, handled_at = NOW()
       WHERE id = ?`,
      [status, adminNotes || null, req.user.id, reportId]
    );

    // Log l'action
    await db.execute(
      `INSERT INTO admin_logs (admin_id, action, entity_type, entity_id, details)
       VALUES (?, 'update_report', 'report', ?, ?)`,
      [req.user.id, reportId, JSON.stringify({ status, adminNotes })]
    );

    res.json({ message: 'Report updated successfully' });
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/logs
 * Récupérer les logs d'administration
 */
router.get('/logs', [authenticateToken, requireSuperadmin], async (req, res) => {
  try {
    const { action, limit = 100, offset = 0 } = req.query;

    let query = `
      SELECT l.id, l.action, l.entity_type, l.entity_id, l.details, l.created_at,
             u.first_name as admin_first_name, u.last_name as admin_last_name
      FROM admin_logs l
      JOIN users u ON l.admin_id = u.id
      WHERE 1=1
    `;

    const params = [];

    if (action) {
      query += ' AND l.action = ?';
      params.push(action);
    }

    query += ' ORDER BY l.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [logs] = await db.execute(query, params);

    res.json({ logs });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/settings
 * Récupérer les paramètres système
 */
router.get('/settings', [authenticateToken, requireSuperadmin], async (req, res) => {
  try {
    const [settings] = await db.execute(
      'SELECT setting_key, setting_value, description FROM system_settings ORDER BY setting_key'
    );

    res.json({ settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/admin/settings/:key
 * Mettre à jour un paramètre système
 */
router.patch('/settings/:key', [
  authenticateToken,
  requireSuperadmin,
  body('value').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const settingKey = req.params.key;
    const { value } = req.body;

    await db.execute(
      'UPDATE system_settings SET setting_value = ? WHERE setting_key = ?',
      [value, settingKey]
    );

    // Log l'action
    await db.execute(
      `INSERT INTO admin_logs (admin_id, action, entity_type, entity_id, details)
       VALUES (?, 'update_setting', 'setting', NULL, ?)`,
      [req.user.id, JSON.stringify({ setting_key: settingKey, new_value: value })]
    );

    res.json({ message: 'Setting updated successfully' });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/stats
 * Statistiques avancées pour graphiques
 */
router.get('/stats', [authenticateToken, requireSuperadmin], async (req, res) => {
  try {
    // Utilisateurs par mois (12 derniers mois)
    const [usersByMonth] = await db.execute(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count
      FROM users
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY month
      ORDER BY month
    `);

    // Matchs par mois
    const [matchesByMonth] = await db.execute(`
      SELECT DATE_FORMAT(match_date, '%Y-%m') as month, COUNT(*) as count
      FROM matches
      WHERE match_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY month
      ORDER BY month
    `);

    // Distribution des utilisateurs par type
    const [usersByType] = await db.execute(`
      SELECT user_type, COUNT(*) as count
      FROM users
      WHERE is_active = true
      GROUP BY user_type
    `);

    res.json({
      usersByMonth,
      matchesByMonth,
      usersByType
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
