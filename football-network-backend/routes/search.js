const express = require("express");
const router = express.Router();
const db = require("../config/database");
const { authenticateToken } = require("../middleware/auth");

/**
 * @route   GET /api/search
 * @desc    Recherche globale (équipes, joueurs, matchs)
 * @query   q (query string), type (all|teams|players|matches)
 * @access  Private
 */
router.get("/", async (req, res) => {
  try {
    const { q, type = "all" } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "La recherche doit contenir au moins 2 caractères",
      });
    }

    const searchQuery = `%${q.trim()}%`;
    const results = {
      teams: [],
      players: [],
      matches: [],
    };

    // 1. Recherche d'équipes
    if (type === "all" || type === "teams") {
      const teamsQuery = `
        SELECT
          t.id,
          t.name,
          t.location_city,
          t.description,
          t.created_at,
          t.logo_id,
          t.banner_id,
          COUNT(DISTINCT tm.user_id) as members_count,
          logo_up.stored_filename as logo_filename,
          banner_up.stored_filename as banner_filename,
          banner_up.variants as banner_variants
        FROM teams t
        LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.is_active = true
        LEFT JOIN uploads logo_up ON t.logo_id = logo_up.id AND logo_up.is_active = true
        LEFT JOIN uploads banner_up ON t.banner_id = banner_up.id AND banner_up.is_active = true
        WHERE t.is_active = true 
          AND (t.name LIKE ? OR t.location_city LIKE ? OR t.description LIKE ?)
        GROUP BY t.id, t.name, t.location_city, t.description, t.created_at, t.logo_id, t.banner_id, logo_up.stored_filename, banner_up.stored_filename, banner_up.variants
        ORDER BY t.name ASC
        LIMIT 20
      `;

      const [teams] = await db.execute(teamsQuery, [
        searchQuery,
        searchQuery,
        searchQuery,
      ]);

      results.teams = teams.map((team) => {
        let bannerUrl = null;
        if (team.banner_variants) {
          try {
            const variants = JSON.parse(team.banner_variants);
            bannerUrl =
              variants.medium?.path ||
              variants.large?.path ||
              variants.small?.path ||
              null;
          } catch (e) {
            console.error("Error parsing banner variants:", e);
          }
        }

        return {
          id: team.id,
          name: team.name,
          city: team.location_city,
          description: team.description,
          logoUrl: team.logo_filename
            ? `/uploads/teams/${team.logo_filename}`
            : null,
          bannerUrl,
          members: parseInt(team.members_count) || 0,
          created_at: team.created_at,
        };
      });
    }

    // 2. Recherche de joueurs (utilisateurs)
    if (type === "all" || type === "players") {
      const playersQuery = `
        SELECT
          u.id,
          u.email,
          u.first_name,
          u.last_name,
          u.position,
          u.bio,
          u.profile_picture_id,
          pp.stored_filename as profile_picture_filename,
          COUNT(DISTINCT tm.team_id) as teams_count
        FROM users u
        LEFT JOIN team_members tm ON u.id = tm.user_id AND tm.is_active = true
        LEFT JOIN uploads pp ON u.profile_picture_id = pp.id AND pp.is_active = true
        WHERE
          u.is_active = true AND
          (u.first_name LIKE ?
          OR u.last_name LIKE ?
          OR CONCAT(u.first_name, ' ', u.last_name) LIKE ?)
        GROUP BY u.id, u.email, u.first_name, u.last_name, u.position, u.bio, u.profile_picture_id, pp.stored_filename
        ORDER BY u.first_name ASC, u.last_name ASC
        LIMIT 20
      `;

      const [players] = await db.execute(playersQuery, [
        searchQuery,
        searchQuery,
        searchQuery,
      ]);

      results.players = players.map((player) => ({
        id: player.id,
        name: `${player.first_name} ${player.last_name}`.trim() || player.email,
        first_name: player.first_name,
        last_name: player.last_name,
        position: player.position,
        profilePictureUrl: player.profile_picture_filename
          ? `/uploads/users/${player.profile_picture_filename}`
          : null,
        bio: player.bio,
        teams_count: parseInt(player.teams_count) || 0,
      }));
    }

    // 3. Recherche de matchs (CORRIGÉ)
    if (type === "all" || type === "matches") {
      const matchesQuery = `
        SELECT
          m.id,
          m.match_date,
          m.status,
          m.match_type,
          l.name as location_name,
          l.city as location_city,
          t1.id as home_team_id,
          t1.name as home_team_name,
          t1.logo_id as home_team_logo_id,
          logo1.stored_filename as home_team_logo_filename,
          t2.id as away_team_id,
          t2.name as away_team_name,
          t2.logo_id as away_team_logo_id,
          logo2.stored_filename as away_team_logo_filename
        FROM matches m
        LEFT JOIN teams t1 ON m.home_team_id = t1.id AND t1.is_active = true
        LEFT JOIN teams t2 ON m.away_team_id = t2.id AND t2.is_active = true
        LEFT JOIN uploads logo1 ON t1.logo_id = logo1.id AND logo1.is_active = true
        LEFT JOIN uploads logo2 ON t2.logo_id = logo2.id AND logo2.is_active = true
        LEFT JOIN locations l ON m.location_id = l.id
        WHERE
          (t1.name LIKE ? OR t2.name LIKE ? OR l.name LIKE ? OR l.city LIKE ?)
          AND m.status IN ('scheduled', 'in_progress', 'completed')
        ORDER BY m.match_date DESC
        LIMIT 20
      `;

      const [matches] = await db.execute(matchesQuery, [
        searchQuery,
        searchQuery,
        searchQuery,
        searchQuery,
      ]);

      results.matches = matches.map((match) => ({
        id: match.id,
        date: match.match_date,
        location:
          match.location_name +
          (match.location_city ? `, ${match.location_city}` : ""),
        status: match.status,
        match_type: match.match_type,
        team1: {
          id: match.home_team_id,
          name: match.home_team_name,
          logoUrl: match.home_team_logo_filename
            ? `/uploads/teams/${match.home_team_logo_filename}`
            : null,
        },
        team2: {
          id: match.away_team_id,
          name: match.away_team_name,
          logoUrl: match.away_team_logo_filename
            ? `/uploads/teams/${match.away_team_logo_filename}`
            : null,
        },
      }));
    }

    res.json({
      success: true,
      query: q,
      results,
      count: {
        teams: results.teams.length,
        players: results.players.length,
        matches: results.matches.length,
        total:
          results.teams.length +
          results.players.length +
          results.matches.length,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la recherche:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la recherche",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/search/suggestions
 * @desc    Suggestions de recherche basées sur les tendances
 * @access  Private
 */
router.get("/suggestions", async (req, res) => {
  try {
    // Équipes populaires
    const [popularTeams] = await db.execute(`
      SELECT
        t.id,
        t.name,
        COUNT(DISTINCT tm.user_id) as members_count
      FROM teams t
      LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.is_active = true
      WHERE t.is_active = true
      GROUP BY t.id, t.name
      ORDER BY members_count DESC
      LIMIT 5
    `);

    // Joueurs actifs
    const [activePlayers] = await db.execute(`
      SELECT
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        COUNT(DISTINCT tm.team_id) as teams_count
      FROM users u
      LEFT JOIN team_members tm ON u.id = tm.user_id AND tm.is_active = true
      WHERE u.is_active = true
      GROUP BY u.id, u.email, u.first_name, u.last_name
      HAVING teams_count > 0
      ORDER BY teams_count DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      suggestions: {
        teams: popularTeams.map((t) => ({
          id: t.id,
          name: t.name,
          members: parseInt(t.members_count) || 0,
        })),
        players: activePlayers.map((p) => ({
          id: p.id,
          username: p.email.split("@")[0],
          name: `${p.first_name} ${p.last_name}`.trim() || p.email,
          teams_count: parseInt(p.teams_count) || 0,
        })),
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des suggestions:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des suggestions",
      error: error.message,
    });
  }
});

module.exports = router;
