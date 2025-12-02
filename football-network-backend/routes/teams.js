const express = require("express");
const { body, validationResult } = require("express-validator");
const db = require("../config/database");
const { authenticateToken } = require("../middleware/auth");
const NotificationService = require("../services/NotificationService");
const crypto = require("node:crypto");

const router = express.Router();

// Middleware interne pour vérifier les permissions Admin d'équipe (Manager ou Capitaine)
const checkTeamAdminPermission = async (userId, teamId) => {
  const [membership] = await db.execute(
    "SELECT role FROM team_members WHERE team_id = ? AND user_id = ? AND is_active = true",
    [teamId, userId]
  );

  if (membership.length === 0) return false;
  return ["captain", "manager"].includes(membership[0].role);
};

// POST /api/teams - Créer une nouvelle équipe
router.post(
  "/",
  [
    authenticateToken,
    body("name")
      .trim()
      .isLength({ min: 3, max: 150 })
      .withMessage("Team name must be between 3 and 150 characters"),
    body("description").optional().isLength({ max: 1000 }),
    body("skillLevel")
      .optional()
      .isIn(["beginner", "amateur", "intermediate", "advanced", "semi_pro"]),
    body("maxPlayers").optional().isInt({ min: 8, max: 30 }),
    body("locationCity").optional().trim().isLength({ max: 100 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        name,
        description,
        skillLevel,
        maxPlayers,
        locationCity,
        coordinates,
      } = req.body;

      // Vérifier que l'utilisateur n'a pas déjà 3 équipes (limite)
      const [existingTeams] = await db.execute(
        "SELECT COUNT(*) as count FROM teams WHERE captain_id = ? AND is_active = true",
        [req.user.id]
      );

      if (existingTeams[0].count >= 3) {
        return res.status(400).json({ error: "Maximum 3 teams per user" });
      }

      // Créer l'équipe
      // NOTE: captain_id agit ici comme "Owner ID" / "Creator ID"
      const [result] = await db.execute(
        `INSERT INTO teams (name, description, captain_id, skill_level, max_players, 
                         location_city, location_lat, location_lng) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          description || null,
          req.user.id,
          skillLevel || "amateur",
          maxPlayers || 15,
          locationCity || null,
          coordinates?.lat || null,
          coordinates?.lng || null,
        ]
      );

      // Déterminer le rôle initial : si userType est manager -> 'manager', sinon 'captain'
      const initialRole =
        req.user.userType === "manager" ? "manager" : "captain";

      await db.execute(
        "INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)",
        [result.insertId, req.user.id, initialRole]
      );

      await db.execute("INSERT INTO team_stats (team_id) VALUES (?)", [
        result.insertId,
      ]);

      res.status(201).json({
        message: "Team created successfully",
        teamId: result.insertId,
        team: {
          id: result.insertId,
          name,
          description,
          captainId: req.user.id,
          role: initialRole,
        },
      });
    } catch (error) {
      console.error("Create team error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/teams/suggestions - Suggestions d'équipes à rejoindre (Public)
router.get("/suggestions", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    // On sélectionne des équipes actives aléatoires (ou les plus récentes)
    // On joint avec uploads pour avoir le logo
    const [teams] = await db.execute(
      `SELECT t.id, t.name, t.location_city, t.skill_level,
              u.stored_filename as logo_filename
       FROM teams t
       LEFT JOIN uploads u ON t.logo_id = u.id AND u.is_active = true
       WHERE t.is_active = true
       ORDER BY t.created_at DESC
       LIMIT ?`,
      [limit]
    );

    const formattedTeams = teams.map((t) => ({
      id: t.id,
      name: t.name,
      city: t.location_city,
      skill_level: t.skill_level,
      logo_url: t.logo_filename ? `/uploads/teams/${t.logo_filename}` : null,
    }));

    res.json({ teams: formattedTeams });
  } catch (error) {
    console.error("Get team suggestions error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/teams/feed/activities - Get activity feed from followed teams
router.get("/feed/activities", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;

    // Récupérer les activités des équipes suivies
    const [activities] = await db.execute(
      `SELECT
        'match' as activity_type,
        m.id as activity_id,
        m.match_date as activity_date,
        t.id as team_id,
        t.name as team_name,
        logo.stored_filename as team_logo,
        m.opponent_name,
        m.team_score,
        m.opponent_score,
        m.location,
        NULL as member_first_name,
        NULL as member_last_name
      FROM matches m
      INNER JOIN teams t ON m.team_id = t.id
      INNER JOIN team_followers tf ON tf.team_id = t.id
      LEFT JOIN uploads logo ON t.logo_id = logo.id AND logo.is_active = true
      WHERE tf.user_id = ? AND m.match_date <= NOW()

      UNION ALL

      SELECT
        'new_member' as activity_type,
        tm.id as activity_id,
        tm.joined_at as activity_date,
        t.id as team_id,
        t.name as team_name,
        logo.stored_filename as team_logo,
        NULL as opponent_name,
        NULL as team_score,
        NULL as opponent_score,
        NULL as location,
        u.first_name as member_first_name,
        u.last_name as member_last_name
      FROM team_members tm
      INNER JOIN teams t ON tm.team_id = t.id
      INNER JOIN team_followers tf ON tf.team_id = t.id
      INNER JOIN users u ON tm.user_id = u.id
      LEFT JOIN uploads logo ON t.logo_id = logo.id AND logo.is_active = true
      WHERE tf.user_id = ? AND tm.role != 'manager'

      ORDER BY activity_date DESC
      LIMIT ?`,
      [userId, userId, limit]
    );

    // Formater les activités
    const formattedActivities = activities.map((activity) => {
      const baseActivity = {
        id: activity.activity_id,
        type: activity.activity_type,
        date: activity.activity_date,
        team: {
          id: activity.team_id,
          name: activity.team_name,
          logoUrl: activity.team_logo
            ? `/uploads/teams/${activity.team_logo}`
            : null,
        },
      };

      if (activity.activity_type === "match") {
        return {
          ...baseActivity,
          match: {
            opponent: activity.opponent_name,
            teamScore: activity.team_score,
            opponentScore: activity.opponent_score,
            location: activity.location,
            result:
              activity.team_score > activity.opponent_score
                ? "win"
                : activity.team_score < activity.opponent_score
                ? "loss"
                : "draw",
          },
        };
      } else if (activity.activity_type === "new_member") {
        return {
          ...baseActivity,
          member: {
            firstName: activity.member_first_name,
            lastName: activity.member_last_name,
          },
        };
      }

      return baseActivity;
    });

    res.json({ activities: formattedActivities });
  } catch (error) {
    console.error("Get feed activities error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/teams/:id/follow - Follow a team
router.post("/:id/follow", authenticateToken, async (req, res) => {
  try {
    const teamId = parseInt(req.params.id);
    const userId = req.user.id;

    // Vérifier que l'équipe existe
    const [teams] = await db.execute(
      "SELECT id FROM teams WHERE id = ? AND is_active = true",
      [teamId]
    );

    if (teams.length === 0) {
      return res.status(404).json({ error: "Équipe non trouvée" });
    }

    // Vérifier si l'utilisateur n'est pas déjà abonné
    const [existing] = await db.execute(
      "SELECT id FROM team_followers WHERE user_id = ? AND team_id = ?",
      [userId, teamId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: "Vous suivez déjà cette équipe" });
    }

    // Ajouter l'abonnement
    await db.execute(
      "INSERT INTO team_followers (user_id, team_id) VALUES (?, ?)",
      [userId, teamId]
    );

    res.json({ success: true, message: "Équipe suivie avec succès" });
  } catch (error) {
    console.error("Follow team error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/teams/:id/unfollow - Unfollow a team
router.post("/:id/unfollow", authenticateToken, async (req, res) => {
  try {
    const teamId = parseInt(req.params.id);
    const userId = req.user.id;

    // Supprimer l'abonnement
    const [result] = await db.execute(
      "DELETE FROM team_followers WHERE user_id = ? AND team_id = ?",
      [userId, teamId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Vous ne suivez pas cette équipe" });
    }

    res.json({ success: true, message: "Équipe retirée des abonnements" });
  } catch (error) {
    console.error("Unfollow team error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/teams/:id/followers - Get team followers count and current user status
router.get("/:id/followers", authenticateToken, async (req, res) => {
  try {
    const teamId = parseInt(req.params.id);
    const userId = req.user.id;

    // Compter le nombre d'abonnés
    const [countResult] = await db.execute(
      "SELECT COUNT(*) as count FROM team_followers WHERE team_id = ?",
      [teamId]
    );

    // Vérifier si l'utilisateur actuel suit l'équipe
    const [userFollows] = await db.execute(
      "SELECT id FROM team_followers WHERE user_id = ? AND team_id = ?",
      [userId, teamId]
    );

    res.json({
      followersCount: countResult[0].count,
      isFollowing: userFollows.length > 0,
    });
  } catch (error) {
    console.error("Get followers error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/teams - Rechercher des équipes (Inchangé)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const {
      skillLevel,
      city,
      lat,
      lng,
      radius = 50,
      search,
      limit = 20,
      offset = 0,
    } = req.query;

    let query = `
      SELECT t.id, t.name, t.description, t.skill_level, t.max_players,
             t.location_city, t.location_lat, t.location_lng, t.created_at,
             t.logo_id, t.banner_id,
             u.first_name as captain_first_name, u.last_name as captain_last_name,
             
             COUNT(CASE WHEN u_mem.user_type = 'player' THEN 1 END) as current_players,
             
             ts.matches_played, ts.matches_won, ts.average_rating,
             logo_up.stored_filename as logo_filename,
             banner_up.stored_filename as banner_filename, banner_up.variants as banner_variants,
             ${
               lat && lng
                 ? `
             (6371 * acos(cos(radians(?)) * cos(radians(t.location_lat)) *
              cos(radians(t.location_lng) - radians(?)) + sin(radians(?)) *
              sin(radians(t.location_lat)))) AS distance
             `
                 : "NULL as distance"
             }
      FROM teams t
      LEFT JOIN users u ON t.captain_id = u.id
      LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.is_active = true
      LEFT JOIN users u_mem ON tm.user_id = u_mem.id  
      LEFT JOIN team_stats ts ON t.id = ts.team_id
      LEFT JOIN uploads logo_up ON t.logo_id = logo_up.id AND logo_up.is_active = true
      LEFT JOIN uploads banner_up ON t.banner_id = banner_up.id AND banner_up.is_active = true
      WHERE t.is_active = true
    `;

    const queryParams = [];

    if (lat && lng) {
      queryParams.push(lat, lng, lat);
    }

    if (skillLevel) {
      query += " AND t.skill_level = ?";
      queryParams.push(skillLevel);
    }

    if (city) {
      query += " AND t.location_city LIKE ?";
      queryParams.push(`%${city}%`);
    }

    if (search) {
      query += " AND (t.name LIKE ? OR t.description LIKE ?)";
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    query +=
      " GROUP BY t.id, u.first_name, u.last_name, ts.matches_played, ts.matches_won, ts.average_rating, logo_up.stored_filename, banner_up.stored_filename, banner_up.variants";

    if (lat && lng && radius) {
      query += ` HAVING distance < ?`;
      queryParams.push(radius);
      query += ` ORDER BY distance`;
    } else {
      query += ` ORDER BY t.created_at DESC`;
    }

    query += ` LIMIT ? OFFSET ?`;
    queryParams.push(parseInt(limit), parseInt(offset));

    const [teams] = await db.execute(query, queryParams);

    const formattedTeams = teams.map((team) => {
      let bannerUrl = null;
      if (team.banner_variants) {
        try {
          const variants = JSON.parse(team.banner_variants);
          bannerUrl = variants.medium?.path || variants.large?.path || null;
        } catch (e) {}
      }

      return {
        id: team.id,
        name: team.name,
        description: team.description,
        skillLevel: team.skill_level,
        maxPlayers: team.max_players,
        currentPlayers: team.current_players,
        locationCity: team.location_city,
        logoUrl: team.logo_filename
          ? `/uploads/teams/${team.logo_filename}`
          : null,
        bannerUrl,
        captain: {
          firstName: team.captain_first_name,
          lastName: team.captain_last_name,
        },
        stats: {
          matchesPlayed: team.matches_played || 0,
          matchesWon: team.matches_won || 0,
          averageRating: team.average_rating || 0,
        },
        distance: team.distance ? Math.round(team.distance * 10) / 10 : null,
        createdAt: team.created_at,
      };
    });

    res.json(formattedTeams);
  } catch (error) {
    console.error("Search teams error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/teams/my - Récupérer les équipes de l'utilisateur (Inchangé)
router.get("/my", authenticateToken, async (req, res) => {
  try {
    const [teams] = await db.execute(
      `SELECT
          t.id, t.name, t.description, t.skill_level, t.max_players, t.location_city, t.created_at,
          t.logo_id, t.banner_id,
          logo_up.stored_filename AS logo_filename,
          banner_up.stored_filename AS banner_filename,
          banner_up.variants AS banner_variants,
          tm.role,
          COUNT(CASE WHEN u_mem2.user_type = 'player' THEN 1 END) AS current_players,
          ts.matches_played, ts.matches_won, ts.average_rating
       FROM teams t
       JOIN team_members tm ON t.id = tm.team_id
       LEFT JOIN team_members tm2 ON t.id = tm2.team_id AND tm2.is_active = true
       LEFT JOIN users u_mem2 ON tm2.user_id = u_mem2.id
       LEFT JOIN team_stats ts ON t.id = ts.team_id
       LEFT JOIN uploads logo_up ON t.logo_id = logo_up.id AND logo_up.is_active = true
       LEFT JOIN uploads banner_up ON t.banner_id = banner_up.id AND banner_up.is_active = true
       WHERE tm.user_id = ? AND tm.is_active = true AND t.is_active = true
       GROUP BY t.id, tm.role, ts.matches_played, ts.matches_won, ts.average_rating, logo_up.stored_filename, banner_up.stored_filename, banner_up.variants
       ORDER BY tm.role DESC, t.created_at DESC`,
      [req.user.id]
    );

    const formattedTeams = teams.map((team) => {
      let bannerUrl = null;
      if (team.banner_variants) {
        try {
          const variants = JSON.parse(team.banner_variants);
          bannerUrl = variants.medium?.path || variants.large?.path || null;
        } catch (e) {}
      }

      return {
        id: team.id,
        name: team.name,
        description: team.description,
        skillLevel: team.skill_level,
        maxPlayers: team.max_players,
        currentPlayers: team.current_players,
        locationCity: team.location_city,
        role: team.role,
        logoUrl: team.logo_filename
          ? `/uploads/teams/${team.logo_filename}`
          : null,
        bannerUrl,
        stats: {
          matchesPlayed: team.matches_played || 0,
          matchesWon: team.matches_won || 0,
          averageRating: team.average_rating || 0,
        },
        createdAt: team.created_at,
      };
    });

    res.json(formattedTeams);
  } catch (error) {
    console.error("Get my teams error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/teams/:id - Récupérer les détails (CORRIGÉ voir réponse précédente)
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const teamId = req.params.id;

    const [teams] = await db.execute(
      `SELECT t.id, t.name, t.description, t.skill_level, t.max_players,
              t.location_city, t.location_lat, t.location_lng, t.created_at,
              t.logo_id, t.banner_id, t.banner_position,
              u.id as captain_id, u.first_name as captain_first_name,
              u.last_name as captain_last_name, u.email as captain_email,
              ts.matches_played, ts.matches_won, ts.matches_drawn, ts.matches_lost,
              ts.goals_scored, ts.goals_conceded, ts.average_rating,
              logo_up.stored_filename as logo_filename,
              banner_up.stored_filename as banner_filename, banner_up.variants as banner_variants
       FROM teams t
       JOIN users u ON t.captain_id = u.id
       LEFT JOIN team_stats ts ON t.id = ts.team_id
       LEFT JOIN uploads logo_up ON t.logo_id = logo_up.id AND logo_up.is_active = true
       LEFT JOIN uploads banner_up ON t.banner_id = banner_up.id AND banner_up.is_active = true
       WHERE t.id = ? AND t.is_active = true`,
      [teamId]
    );

    if (teams.length === 0) {
      return res.status(404).json({ error: "Team not found" });
    }

    const team = teams[0];
    const logoUrl = team.logo_filename
      ? `/uploads/teams/${team.logo_filename}`
      : null;
    let bannerUrl = null;
    if (team.banner_variants) {
      try {
        const variants = JSON.parse(team.banner_variants);
        bannerUrl = variants.medium?.path || variants.large?.path || null;
      } catch (e) {}
    }

    // CORRECTION : Tri pour mettre Manager/Captain en premier
    const [members] = await db.execute(
      `SELECT u.id, u.first_name, u.last_name, u.position, u.skill_level, u.user_type,
              tm.role, tm.joined_at, pp.stored_filename as profile_picture
       FROM team_members tm
       JOIN users u ON tm.user_id = u.id
       LEFT JOIN uploads pp ON u.profile_picture_id = pp.id
       WHERE tm.team_id = ? AND tm.is_active = true
       ORDER BY 
         CASE 
           WHEN tm.role = 'manager' THEN 1
           WHEN tm.role = 'captain' THEN 2
           WHEN tm.role = 'vice-captain' THEN 3
           ELSE 4
         END ASC, tm.joined_at ASC`,
      [teamId]
    );

    const userMembership = members.find((member) => member.id === req.user.id);
    const playerCount = members.filter((m) => m.user_type === "player").length;

    // Trouver le vrai leader (manager ou captain) dans la liste des membres
    const leader =
      members.find((m) => m.role === "manager") ||
      members.find((m) => m.role === "captain") ||
      {};

    res.json({
      id: team.id,
      name: team.name,
      description: team.description,
      skillLevel: team.skill_level,
      maxPlayers: team.max_players,
      currentPlayers: playerCount,
      locationCity: team.location_city,
      coordinates: { lat: team.location_lat, lng: team.location_lng },
      // On renvoie le rôle réel du leader
      captain: {
        id: team.captain_id,
        firstName: team.captain_first_name,
        lastName: team.captain_last_name,
        email: team.captain_email,
        role: leader.role || "captain",
      },
      logoUrl,
      bannerUrl,
      bannerPosition: team.banner_position || "center",
      members: members.map((member) => ({
        id: member.id,
        firstName: member.first_name,
        lastName: member.last_name,
        position: member.position,
        skillLevel: member.skill_level,
        userType: member.user_type,
        role: member.role,
        joinedAt: member.joined_at,
        profilePictureUrl: member.profile_picture
          ? `/uploads/users/${member.profile_picture}`
          : null,
      })),
      stats: {
        matchesPlayed: team.matches_played || 0,
        matchesWon: team.matches_won || 0,
        matchesDrawn: team.matches_drawn || 0,
        matchesLost: team.matches_lost || 0,
        goalsScored: team.goals_scored || 0,
        goalsConceded: team.goals_conceded || 0,
        averageRating: team.average_rating || 0,
      },
      userRole: userMembership?.role || null,
      createdAt: team.created_at,
    });
  } catch (error) {
    console.error("Get team details error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/teams/:id/join (Inchangé)
router.post("/:id/join", authenticateToken, async (req, res) => {
  try {
    const teamId = req.params.id;
    const [teams] = await db.execute(
      `SELECT t.max_players, COUNT(CASE WHEN u.user_type = 'player' THEN 1 END) as current_players, t.name
       FROM teams t
       LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.is_active = true
       LEFT JOIN users u ON tm.user_id = u.id
       WHERE t.id = ? AND t.is_active = true
       GROUP BY t.id, t.max_players, t.name`,
      [teamId]
    );

    if (teams.length === 0)
      return res.status(404).json({ error: "Team not found" });
    if (teams[0].current_players >= teams[0].max_players)
      return res.status(400).json({ error: "Team is full" });

    const [acceptedInvitation] = await db.execute(
      'SELECT id FROM player_invitations WHERE team_id = ? AND user_id = ? AND status = "accepted"',
      [teamId, req.user.id]
    );

    if (acceptedInvitation.length === 0) {
      return res
        .status(403)
        .json({ error: "You need an accepted invitation to join this team." });
    }

    const [existingMember] = await db.execute(
      "SELECT id, is_active FROM team_members WHERE team_id = ? AND user_id = ?",
      [teamId, req.user.id]
    );

    if (existingMember.length > 0) {
      if (existingMember[0].is_active)
        return res.status(400).json({ error: "Already a member" });
      await db.execute(
        "UPDATE team_members SET is_active = true, joined_at = CURRENT_TIMESTAMP WHERE team_id = ? AND user_id = ?",
        [teamId, req.user.id]
      );
    } else {
      await db.execute(
        "INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)",
        [teamId, req.user.id, "player"]
      );
    }

    res.json({ message: "Successfully joined team", teamName: teams[0].name });
  } catch (error) {
    console.error("Join team error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/teams/:id/leave (CORRIGÉ : Support Manager)
router.delete("/:id/leave", authenticateToken, async (req, res) => {
  try {
    const teamId = req.params.id;
    const [membership] = await db.execute(
      "SELECT role FROM team_members WHERE team_id = ? AND user_id = ? AND is_active = true",
      [teamId, req.user.id]
    );

    if (membership.length === 0)
      return res.status(400).json({ error: "Not a member" });

    // Bloquer le départ si c'est le leader (Captain OU Manager)
    if (["captain", "manager"].includes(membership[0].role)) {
      return res.status(400).json({
        error:
          "Team leader cannot leave team. Transfer leadership or delete team.",
      });
    }

    await db.execute(
      "UPDATE team_members SET is_active = false WHERE team_id = ? AND user_id = ?",
      [teamId, req.user.id]
    );

    res.json({ message: "Successfully left team" });
  } catch (error) {
    console.error("Leave team error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/teams/:id - Update Team (CORRIGÉ : Support Manager)
router.put(
  "/:id",
  [
    authenticateToken,
    body("name").optional().trim().isLength({ min: 3, max: 150 }),
    body("description").optional().isLength({ max: 1000 }),
    body("skillLevel")
      .optional()
      .isIn(["beginner", "amateur", "intermediate", "advanced", "semi_pro"]),
    body("maxPlayers").optional().isInt({ min: 8, max: 30 }),
    body("locationCity").optional().trim().isLength({ max: 100 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });

      const teamId = req.params.id;

      // Vérification permissions étendue (Manager OU Captain)
      const isAdmin = await checkTeamAdminPermission(req.user.id, teamId);
      if (!isAdmin) {
        return res
          .status(403)
          .json({ error: "Only team leader can update team" });
      }

      const {
        name,
        description,
        skillLevel,
        maxPlayers,
        locationCity,
        coordinates,
      } = req.body;
      const updateFields = [];
      const values = [];

      if (name !== undefined) {
        updateFields.push("name = ?");
        values.push(name);
      }
      if (description !== undefined) {
        updateFields.push("description = ?");
        values.push(description);
      }
      if (skillLevel !== undefined) {
        updateFields.push("skill_level = ?");
        values.push(skillLevel);
      }
      if (maxPlayers !== undefined) {
        updateFields.push("max_players = ?");
        values.push(maxPlayers);
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

      if (updateFields.length === 0)
        return res.status(400).json({ error: "No fields to update" });

      updateFields.push("updated_at = CURRENT_TIMESTAMP");
      values.push(teamId);

      await db.execute(
        `UPDATE teams SET ${updateFields.join(", ")} WHERE id = ?`,
        values
      );

      res.json({ message: "Team updated successfully" });
    } catch (error) {
      console.error("Update team error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /api/teams/:id/invite (CORRIGÉ : Support Manager)
router.post(
  "/:id/invite",
  [
    authenticateToken,
    body("userIdOrEmail")
      .trim()
      .notEmpty()
      .withMessage("User ID or email required"),
    body("message").optional().isLength({ max: 500 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });

      const teamId = req.params.id;
      const { userIdOrEmail, message } = req.body;

      // Vérification permissions (via team_members, plus fiable que captain_id)
      const isAdmin = await checkTeamAdminPermission(req.user.id, teamId);
      if (!isAdmin) {
        return res
          .status(403)
          .json({ error: "Only team leader can invite players" });
      }

      let userId = null;
      let invitedEmail = null;
      let invitedName = null;

      if (!isNaN(userIdOrEmail)) {
        userId = parseInt(userIdOrEmail);
        const [users] = await db.execute(
          "SELECT id, email, first_name, last_name FROM users WHERE id = ? AND user_type = 'player'",
          [userId]
        );
        if (users.length === 0)
          return res.status(404).json({ error: "Player not found" });
        invitedEmail = users[0].email;
        invitedName = `${users[0].first_name} ${users[0].last_name}`;
      } else {
        const isEmail = userIdOrEmail.includes("@");
        if (isEmail) {
          invitedEmail = userIdOrEmail;
          const [users] = await db.execute(
            "SELECT id, first_name, last_name FROM users WHERE email = ? AND user_type = 'player'",
            [invitedEmail]
          );
          if (users.length > 0) {
            userId = users[0].id;
            invitedName = `${users[0].first_name} ${users[0].last_name}`;
          }
        } else {
          invitedName = userIdOrEmail;
          const searchPattern = `%${userIdOrEmail}%`;
          const [users] = await db.execute(
            `SELECT id, email, first_name, last_name FROM users 
             WHERE (CONCAT(first_name, ' ', last_name) LIKE ? OR first_name LIKE ? OR last_name LIKE ?) AND user_type = 'player' LIMIT 5`,
            [searchPattern, searchPattern, searchPattern]
          );
          if (users.length === 0)
            return res.status(404).json({ error: "No player found" });
          if (users.length > 1)
            return res.status(300).json({
              message: "Multiple players found",
              players: users.map((u) => ({
                id: u.id,
                name: `${u.first_name} ${u.last_name}`,
                email: u.email,
              })),
            });
          userId = users[0].id;
          invitedEmail = users[0].email;
          invitedName = `${users[0].first_name} ${users[0].last_name}`;
        }
      }

      if (userId) {
        const [existing] = await db.execute(
          "SELECT id FROM team_members WHERE team_id = ? AND user_id = ? AND is_active = true",
          [teamId, userId]
        );
        if (existing.length > 0)
          return res
            .status(400)
            .json({ error: "Player is already a team member" });
        const [pending] = await db.execute(
          "SELECT id FROM player_invitations WHERE team_id = ? AND user_id = ? AND status = 'pending'",
          [teamId, userId]
        );
        if (pending.length > 0)
          return res.status(400).json({ error: "Invitation already sent" });
      }

      const token = !userId ? crypto.randomBytes(32).toString("hex") : null;
      const tokenExpires = !userId
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        : null;

      const [result] = await db.execute(
        `INSERT INTO player_invitations (team_id, user_id, invited_by, invited_email, invited_name, message, invitation_token, token_expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          teamId,
          userId,
          req.user.id,
          invitedEmail,
          invitedName,
          message || null,
          token,
          tokenExpires,
        ]
      );

      if (req.notificationService && userId) {
        req.notificationService.notifyInvitationStatusUpdate(userId);
      }

      res.status(201).json({
        message: "Invitation sent successfully",
        invitationId: result.insertId,
        invitedPlayer: { email: invitedEmail, name: invitedName },
        requiresEmailConfirmation: !userId,
      });
    } catch (error) {
      console.error("Invite player error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /api/teams/:id/invite-email (CORRIGÉ : Support Manager)
router.post(
  "/:id/invite-email",
  [
    authenticateToken,
    body("email").isEmail().withMessage("Valid email is required"),
    body("message").optional().isLength({ max: 500 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });

      const teamId = req.params.id;
      const { email, message } = req.body;

      const isAdmin = await checkTeamAdminPermission(req.user.id, teamId);
      if (!isAdmin)
        return res
          .status(403)
          .json({ error: "Only team leader can invite players" });

      const [users] = await db.execute(
        "SELECT id, email, first_name, last_name FROM users WHERE email = ?",
        [email]
      );
      if (users.length === 0)
        return res.status(404).json({ error: "Email not registered" });

      const targetUser = users[0];
      const [existing] = await db.execute(
        "SELECT id FROM team_members WHERE team_id = ? AND user_id = ? AND is_active = true",
        [teamId, targetUser.id]
      );
      if (existing.length > 0)
        return res.status(400).json({ error: "Already member" });

      const [pending] = await db.execute(
        "SELECT id FROM player_invitations WHERE team_id = ? AND user_id = ? AND status = 'pending'",
        [teamId, targetUser.id]
      );
      if (pending.length > 0)
        return res.status(400).json({ error: "Invitation already sent" });

      const [result] = await db.execute(
        `INSERT INTO player_invitations (team_id, user_id, invited_by, invited_email, invited_name, message)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          teamId,
          targetUser.id,
          req.user.id,
          targetUser.email,
          `${targetUser.first_name} ${targetUser.last_name}`,
          message || null,
        ]
      );

      if (req.notificationService) {
        req.notificationService.notifyInvitationStatusUpdate(targetUser.id);
      }

      res.status(201).json({
        message: "Invitation sent successfully",
        invitationId: result.insertId,
      });
    } catch (e) {
      console.error("Invite email error:", e);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// GET /api/teams/:id/invitations (CORRIGÉ : Support Manager)
router.get("/:id/invitations", authenticateToken, async (req, res) => {
  try {
    const teamId = req.params.id;
    const { status = "all", limit = 20, offset = 0 } = req.query;

    const isAdmin = await checkTeamAdminPermission(req.user.id, teamId);
    if (!isAdmin) return res.status(403).json({ error: "Access denied" });

    let query = `
      SELECT pi.id, pi.user_id, pi.message, pi.status, pi.sent_at, pi.expires_at,
             pi.response_message, pi.responded_at,
             u.first_name, u.last_name, u.email, u.position, u.skill_level
      FROM player_invitations pi
      JOIN users u ON pi.user_id = u.id
      WHERE pi.team_id = ?`;

    const queryParams = [teamId];
    if (status && status !== "all") {
      query += " AND pi.status = ?";
      queryParams.push(status);
    }
    query += " ORDER BY pi.sent_at DESC LIMIT ? OFFSET ?";
    queryParams.push(parseInt(limit), parseInt(offset));

    const [invitations] = await db.execute(query, queryParams);
    const formatted = invitations.map((inv) => ({
      id: inv.id,
      status: inv.status,
      message: inv.message,
      sentAt: inv.sent_at,
      expiresAt: inv.expires_at,
      responseMessage: inv.response_message,
      respondedAt: inv.responded_at,
      player: {
        id: inv.user_id,
        firstName: inv.first_name,
        lastName: inv.last_name,
        email: inv.email,
        position: inv.position,
        skillLevel: inv.skill_level,
      },
      isExpired: inv.expires_at && new Date() > new Date(inv.expires_at),
    }));

    res.json(formatted);
  } catch (error) {
    console.error("Get team invitations error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/teams/:id/invitations/:invitationId (CORRIGÉ : Support Manager)
router.delete(
  "/:id/invitations/:invitationId",
  authenticateToken,
  async (req, res) => {
    try {
      const teamId = req.params.id;
      const invitationId = req.params.invitationId;

      const isAdmin = await checkTeamAdminPermission(req.user.id, teamId);
      if (!isAdmin) return res.status(403).json({ error: "Access denied" });

      const [invitation] = await db.execute(
        'SELECT id, status, user_id FROM player_invitations WHERE id = ? AND team_id = ? AND status = "pending"',
        [invitationId, teamId]
      );

      if (invitation.length === 0)
        return res.status(404).json({ error: "Invitation not found" });

      await db.execute("DELETE FROM player_invitations WHERE id = ?", [
        invitationId,
      ]);

      if (req.notificationService) {
        req.notificationService.notifyInvitationStatusUpdate(
          invitation[0].user_id
        );
        req.notificationService.notifyInvitationStatusUpdate(req.user.id);
      }

      res.json({ message: "Invitation cancelled successfully" });
    } catch (error) {
      console.error("Cancel invitation error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /api/teams/:id/set-captain - Nommer un nouveau capitaine
router.post(
  "/:id/set-captain",
  [
    authenticateToken,
    body("newCaptainId").isInt().withMessage("Valid member ID is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const teamId = req.params.id;
      const { newCaptainId } = req.body;
      const requesterId = req.user.id;

      // 1. Vérifier les permissions (Manager ou Capitaine actuel)
      const isAdmin = await checkTeamAdminPermission(requesterId, teamId);
      if (!isAdmin) {
        return res
          .status(403)
          .json({ error: "Only team leader can assign a new captain" });
      }

      // 2. Vérifier que le nouveau capitaine est bien membre de l'équipe
      const [targetMember] = await db.execute(
        "SELECT id, role FROM team_members WHERE team_id = ? AND user_id = ? AND is_active = true",
        [teamId, newCaptainId]
      );

      if (targetMember.length === 0) {
        return res
          .status(404)
          .json({ error: "Target user is not a member of this team" });
      }

      // 3. Transaction pour la mise à jour des rôles
      const connection = await db.getConnection();
      await connection.beginTransaction();

      try {
        // A. Rétrograder l'ancien capitaine (s'il y en a un)
        // On cherche le membre qui est actuellement 'captain'
        const [currentCaptain] = await connection.execute(
          "SELECT user_id FROM team_members WHERE team_id = ? AND role = 'captain' AND is_active = true",
          [teamId]
        );

        if (currentCaptain.length > 0) {
          await connection.execute(
            "UPDATE team_members SET role = 'player' WHERE team_id = ? AND user_id = ?",
            [teamId, currentCaptain[0].user_id]
          );
        }

        // B. Si c'est un transfert de soi-même (ex: le capitaine actuel quitte son poste)
        // et qu'il n'a pas été traité par l'étape A (ex: il était manager et devient joueur ?)
        // Dans notre logique, si le Manager nomme un capitaine, le Manager RESTE Manager.
        // Si un Capitaine nomme un capitaine, le Capitaine DEVIENT Joueur (traité par l'étape A).

        // C. Promouvoir le nouveau capitaine
        await connection.execute(
          "UPDATE team_members SET role = 'captain' WHERE team_id = ? AND user_id = ?",
          [teamId, newCaptainId]
        );

        // D. Mettre à jour la table teams (propriétaire principal pour compatibilité)
        // Note : On laisse le Manager comme 'owner' s'il l'était, sinon on met le nouveau capitaine
        // Ici, on met à jour captain_id pour refléter le leader sur le terrain
        await connection.execute(
          "UPDATE teams SET captain_id = ? WHERE id = ?",
          [newCaptainId, teamId]
        );

        await connection.commit();

        // Notification (Optionnel)
        if (req.notificationService) {
          // Notifier le nouveau capitaine
          req.notificationService.notifyTeamRoleChange(
            newCaptainId,
            teamId,
            "captain"
          );
          // Notifier l'ancien capitaine s'il est différent du demandeur
          if (
            currentCaptain.length > 0 &&
            currentCaptain[0].user_id !== requesterId
          ) {
            req.notificationService.notifyTeamRoleChange(
              currentCaptain[0].user_id,
              teamId,
              "player"
            );
          }
        }

        res.json({
          message: "Captain updated successfully",
          newCaptainId: newCaptainId,
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("Set captain error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

module.exports = router;
