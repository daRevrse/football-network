const express = require("express");
const { body, validationResult } = require("express-validator");
const db = require("../config/database");
const { authenticateToken } = require("../middleware/auth");
const NotificationService = require("../services/NotificationService");

const router = express.Router();
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

      // Ajouter le capitaine à l'équipe
      await db.execute(
        "INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)",
        [result.insertId, req.user.id, "captain"]
      );

      // Initialiser les stats de l'équipe
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
          skillLevel: skillLevel || "amateur",
          maxPlayers: maxPlayers || 15,
        },
      });
    } catch (error) {
      console.error("Create team error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/teams - Rechercher des équipes
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
             COUNT(tm.user_id) as current_players,
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
          bannerUrl = variants.medium?.path || variants.large?.path || variants.small?.path || null;
        } catch (e) {
          console.error('Error parsing banner variants:', e);
        }
      }

      return {
        id: team.id,
        name: team.name,
        description: team.description,
        skillLevel: team.skill_level,
        maxPlayers: team.max_players,
        currentPlayers: team.current_players,
        locationCity: team.location_city,
        logoUrl: team.logo_filename ? `/uploads/teams/${team.logo_filename}` : null,
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

// GET /api/teams/my - Récupérer les équipes de l'utilisateur
// router.get("/my", authenticateToken, async (req, res) => {
//   try {
//     const [teams] = await db.execute(
//       `SELECT t.id, t.name, t.description, t.skill_level, t.max_players,
//               t.location_city, t.created_at,
//               tm.role,
//               COUNT(tm2.user_id) as current_players,
//               ts.matches_played, ts.matches_won, ts.average_rating
//        FROM teams t
//        JOIN team_members tm ON t.id = tm.team_id
//        LEFT JOIN team_members tm2 ON t.id = tm2.team_id AND tm2.is_active = true
//        LEFT JOIN team_stats ts ON t.id = ts.team_id
//        WHERE tm.user_id = ? AND tm.is_active = true AND t.is_active = true
//        GROUP BY t.id, tm.role, ts.matches_played, ts.matches_won, ts.average_rating
//        ORDER BY tm.role DESC, t.created_at DESC`,
//       [req.user.id]
//     );

//     const formattedTeams = teams.map((team) => ({
//       id: team.id,
//       name: team.name,
//       description: team.description,
//       skillLevel: team.skill_level,
//       maxPlayers: team.max_players,
//       currentPlayers: team.current_players,
//       locationCity: team.location_city,
//       role: team.role,
//       stats: {
//         matchesPlayed: team.matches_played || 0,
//         matchesWon: team.matches_won || 0,
//         averageRating: team.average_rating || 0,
//       },
//       createdAt: team.created_at,
//     }));

//     res.json(formattedTeams);
//   } catch (error) {
//     console.error("Get my teams error:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });
// GET /api/teams/my - Récupérer les équipes de l'utilisateur (avec logo)
router.get("/my", authenticateToken, async (req, res) => {
  try {
    const [teams] = await db.execute(
      `SELECT
          t.id,
          t.name,
          t.description,
          t.skill_level,
          t.max_players,
          t.location_city,
          t.created_at,
          t.logo_id,
          t.banner_id,
          logo_up.stored_filename AS logo_filename,
          logo_up.file_path AS logo_path,
          banner_up.stored_filename AS banner_filename,
          banner_up.variants AS banner_variants,
          tm.role,
          COUNT(tm2.user_id) AS current_players,
          ts.matches_played,
          ts.matches_won,
          ts.average_rating
       FROM teams t
       JOIN team_members tm ON t.id = tm.team_id
       LEFT JOIN team_members tm2 ON t.id = tm2.team_id AND tm2.is_active = true
       LEFT JOIN team_stats ts ON t.id = ts.team_id
       LEFT JOIN uploads logo_up ON t.logo_id = logo_up.id AND logo_up.is_active = true
       LEFT JOIN uploads banner_up ON t.banner_id = banner_up.id AND banner_up.is_active = true
       WHERE tm.user_id = ?
         AND tm.is_active = true
         AND t.is_active = true
       GROUP BY
         t.id,
         tm.role,
         ts.matches_played,
         ts.matches_won,
         ts.average_rating,
         logo_up.stored_filename,
         logo_up.file_path,
         banner_up.stored_filename,
         banner_up.variants
       ORDER BY tm.role DESC, t.created_at DESC`,
      [req.user.id]
    );

    const formattedTeams = teams.map((team) => {
      let bannerUrl = null;
      if (team.banner_variants) {
        try {
          const variants = JSON.parse(team.banner_variants);
          bannerUrl = variants.medium?.path || variants.large?.path || variants.small?.path || null;
        } catch (e) {
          console.error('Error parsing banner variants:', e);
        }
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

// // GET /api/teams/:id - Récupérer les détails d'une équipe
// router.get("/:id", authenticateToken, async (req, res) => {
//   try {
//     const teamId = req.params.id;

//     // Récupérer les informations de l'équipe
//     const [teams] = await db.execute(
//       `SELECT t.id, t.name, t.description, t.skill_level, t.max_players,
//               t.location_city, t.location_lat, t.location_lng, t.created_at,
//               u.id as captain_id, u.first_name as captain_first_name,
//               u.last_name as captain_last_name, u.email as captain_email,
//               ts.matches_played, ts.matches_won, ts.matches_drawn, ts.matches_lost,
//               ts.goals_scored, ts.goals_conceded, ts.average_rating
//        FROM teams t
//        JOIN users u ON t.captain_id = u.id
//        LEFT JOIN team_stats ts ON t.id = ts.team_id
//        WHERE t.id = ? AND t.is_active = true`,
//       [teamId]
//     );

//     if (teams.length === 0) {
//       return res.status(404).json({ error: "Team not found" });
//     }

//     const team = teams[0];

//     // Récupérer les membres de l'équipe
//     const [members] = await db.execute(
//       `SELECT u.id, u.first_name, u.last_name, u.position, u.skill_level,
//               tm.role, tm.joined_at
//        FROM team_members tm
//        JOIN users u ON tm.user_id = u.id
//        WHERE tm.team_id = ? AND tm.is_active = true
//        ORDER BY tm.role DESC, tm.joined_at ASC`,
//       [teamId]
//     );

//     // Vérifier si l'utilisateur fait partie de l'équipe
//     const userMembership = members.find((member) => member.id === req.user.id);

//     res.json({
//       id: team.id,
//       name: team.name,
//       description: team.description,
//       skillLevel: team.skill_level,
//       maxPlayers: team.max_players,
//       currentPlayers: members.length,
//       locationCity: team.location_city,
//       coordinates: {
//         lat: team.location_lat,
//         lng: team.location_lng,
//       },
//       captain: {
//         id: team.captain_id,
//         firstName: team.captain_first_name,
//         lastName: team.captain_last_name,
//         email: team.captain_email,
//       },
//       members: members.map((member) => ({
//         id: member.id,
//         firstName: member.first_name,
//         lastName: member.last_name,
//         position: member.position,
//         skillLevel: member.skill_level,
//         role: member.role,
//         joinedAt: member.joined_at,
//       })),
//       stats: {
//         matchesPlayed: team.matches_played || 0,
//         matchesWon: team.matches_won || 0,
//         matchesDrawn: team.matches_drawn || 0,
//         matchesLost: team.matches_lost || 0,
//         goalsScored: team.goals_scored || 0,
//         goalsConceded: team.goals_conceded || 0,
//         averageRating: team.average_rating || 0,
//       },
//       userRole: userMembership?.role || null,
//       createdAt: team.created_at,
//     });
//   } catch (error) {
//     console.error("Get team details error:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });
// GET /api/teams/:id - Récupérer les détails d'une équipe avec logo
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const teamId = req.params.id;

    // Récupérer les informations de l'équipe + logo + banner
    const [teams] = await db.execute(
      `SELECT t.id, t.name, t.description, t.skill_level, t.max_players,
              t.location_city, t.location_lat, t.location_lng, t.created_at,
              t.logo_id, t.banner_id, t.banner_position,
              u.id as captain_id, u.first_name as captain_first_name,
              u.last_name as captain_last_name, u.email as captain_email,
              ts.matches_played, ts.matches_won, ts.matches_drawn, ts.matches_lost,
              ts.goals_scored, ts.goals_conceded, ts.average_rating,
              logo_up.stored_filename as logo_filename, logo_up.file_path as logo_path,
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

    // Construire l'URL du logo
    const logoUrl = team.logo_filename
      ? `/uploads/teams/${team.logo_filename}`
      : null;

    // Construire l'URL de la bannière à partir des variants
    let bannerUrl = null;
    if (team.banner_variants) {
      try {
        const variants = JSON.parse(team.banner_variants);
        bannerUrl = variants.medium?.path || variants.large?.path || variants.small?.path || null;
      } catch (e) {
        console.error('Error parsing banner variants:', e);
      }
    }

    // Récupérer les membres de l'équipe
    const [members] = await db.execute(
      `SELECT u.id, u.first_name, u.last_name, u.position, u.skill_level,
              tm.role, tm.joined_at
       FROM team_members tm
       JOIN users u ON tm.user_id = u.id
       WHERE tm.team_id = ? AND tm.is_active = true
       ORDER BY tm.role DESC, tm.joined_at ASC`,
      [teamId]
    );

    // Vérifier si l'utilisateur fait partie de l'équipe
    const userMembership = members.find((member) => member.id === req.user.id);

    // Réponse finale formatée
    res.json({
      id: team.id,
      name: team.name,
      description: team.description,
      skillLevel: team.skill_level,
      maxPlayers: team.max_players,
      currentPlayers: members.length,
      locationCity: team.location_city,
      coordinates: {
        lat: team.location_lat,
        lng: team.location_lng,
      },
      captain: {
        id: team.captain_id,
        firstName: team.captain_first_name,
        lastName: team.captain_last_name,
        email: team.captain_email,
      },
      logoUrl,
      bannerUrl,
      bannerPosition: team.banner_position || 'center',
      members: members.map((member) => ({
        id: member.id,
        firstName: member.first_name,
        lastName: member.last_name,
        position: member.position,
        skillLevel: member.skill_level,
        role: member.role,
        joinedAt: member.joined_at,
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

// POST /api/teams/:id/join - Rejoindre une équipe
router.post("/:id/join", authenticateToken, async (req, res) => {
  try {
    const teamId = req.params.id;

    // Vérifier que l'équipe existe et a de la place
    const [teams] = await db.execute(
      `SELECT t.max_players, COUNT(tm.user_id) as current_players, t.name
       FROM teams t
       LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.is_active = true
       WHERE t.id = ? AND t.is_active = true
       GROUP BY t.id, t.max_players, t.name`,
      [teamId]
    );

    if (teams.length === 0) {
      return res.status(404).json({ error: "Team not found" });
    }

    const team = teams[0];
    if (team.current_players >= team.max_players) {
      return res.status(400).json({ error: "Team is full" });
    }

    // NOUVELLE SÉCURITÉ : Vérifier qu'il existe une invitation acceptée
    const [acceptedInvitation] = await db.execute(
      'SELECT id FROM player_invitations WHERE team_id = ? AND user_id = ? AND status = "accepted"',
      [teamId, req.user.id]
    );

    if (acceptedInvitation.length === 0) {
      return res.status(403).json({
        error:
          "You need an accepted invitation to join this team. Please ask the team captain to invite you.",
      });
    }

    // Vérifier si l'utilisateur a déjà un enregistrement pour cette équipe
    const [existingMember] = await db.execute(
      "SELECT id, is_active FROM team_members WHERE team_id = ? AND user_id = ?",
      [teamId, req.user.id]
    );

    if (existingMember.length > 0) {
      if (existingMember[0].is_active) {
        return res.status(400).json({ error: "Already a member of this team" });
      } else {
        // Réactiver le membership existant
        await db.execute(
          "UPDATE team_members SET is_active = true, joined_at = CURRENT_TIMESTAMP WHERE team_id = ? AND user_id = ?",
          [teamId, req.user.id]
        );
      }
    } else {
      // Créer un nouvel enregistrement
      await db.execute(
        "INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)",
        [teamId, req.user.id, "player"]
      );
    }

    res.json({
      message: "Successfully joined team",
      teamName: team.name,
    });
  } catch (error) {
    console.error("Join team error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/teams/:id/leave - Quitter une équipe
router.delete("/:id/leave", authenticateToken, async (req, res) => {
  try {
    const teamId = req.params.id;

    // Vérifier que l'utilisateur est membre de l'équipe
    const [membership] = await db.execute(
      "SELECT role FROM team_members WHERE team_id = ? AND user_id = ? AND is_active = true",
      [teamId, req.user.id]
    );

    if (membership.length === 0) {
      return res.status(400).json({ error: "Not a member of this team" });
    }

    // Un capitaine ne peut pas quitter son équipe (il doit la supprimer ou transférer le capitanat)
    if (membership[0].role === "captain") {
      return res.status(400).json({
        error: "Captain cannot leave team. Transfer captaincy or delete team.",
      });
    }

    // Retirer l'utilisateur de l'équipe
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

// PUT /api/teams/:id - Mettre à jour une équipe (capitaine seulement)
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
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const teamId = req.params.id;

      // Vérifier que l'utilisateur est le capitaine
      const [membership] = await db.execute(
        "SELECT role FROM team_members WHERE team_id = ? AND user_id = ? AND is_active = true",
        [teamId, req.user.id]
      );

      if (membership.length === 0 || membership[0].role !== "captain") {
        return res
          .status(403)
          .json({ error: "Only team captain can update team" });
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

      if (updateFields.length === 0) {
        return res.status(400).json({ error: "No fields to update" });
      }

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

// POST /api/teams/:id/invite - Inviter un joueur (par ID utilisateur)
router.post(
  "/:id/invite",
  [
    authenticateToken,
    body("playerId").isInt().withMessage("Player ID is required"),
    body("message")
      .optional({ nullable: true, checkFalsy: true })
      .isLength({ max: 500 })
      .withMessage("Message too long"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const teamId = req.params.id;
      const { playerId, message } = req.body;

      // Vérifier que l'utilisateur est capitaine de l'équipe
      const [captainCheck] = await db.execute(
        'SELECT tm.team_id, t.name as team_name, t.max_players FROM team_members tm JOIN teams t ON tm.team_id = t.id WHERE tm.user_id = ? AND tm.team_id = ? AND tm.role = "captain" AND tm.is_active = true AND t.is_active = true',
        [req.user.id, teamId]
      );

      if (captainCheck.length === 0) {
        return res
          .status(403)
          .json({ error: "Only team captain can send invitations" });
      }

      const team = captainCheck[0];

      // Vérifier que le joueur à inviter existe
      const [playerCheck] = await db.execute(
        "SELECT id, first_name, last_name, email FROM users WHERE id = ? AND is_active = true",
        [playerId]
      );

      if (playerCheck.length === 0) {
        return res.status(404).json({ error: "Player not found" });
      }

      const player = playerCheck[0];

      // Vérifier que le joueur n'est pas déjà membre de l'équipe
      const [memberCheck] = await db.execute(
        "SELECT id FROM team_members WHERE team_id = ? AND user_id = ? AND is_active = true",
        [teamId, playerId]
      );

      if (memberCheck.length > 0) {
        return res
          .status(400)
          .json({ error: "Player is already a member of this team" });
      }

      // Vérifier qu'il n'y a pas déjà une invitation pending
      const [existingInvitation] = await db.execute(
        'SELECT id FROM player_invitations WHERE team_id = ? AND user_id = ? AND status = "pending"',
        [teamId, playerId]
      );

      if (existingInvitation.length > 0) {
        return res
          .status(400)
          .json({ error: "Invitation already sent to this player" });
      }

      // Vérifier que l'équipe a encore de la place
      const [memberCount] = await db.execute(
        "SELECT COUNT(*) as count FROM team_members WHERE team_id = ? AND is_active = true",
        [teamId]
      );

      if (memberCount[0].count >= team.max_players) {
        return res.status(400).json({ error: "Team is full" });
      }

      // Créer l'invitation avec expiration dans 7 jours
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const [result] = await db.execute(
        "INSERT INTO player_invitations (team_id, user_id, invited_by, message, expires_at) VALUES (?, ?, ?, ?, ?)",
        [teamId, playerId, req.user.id, message || null, expiresAt]
      );

      // CORRECTION : Vérifier si le service de notification est disponible
      if (
        req.notificationService &&
        req.notificationService.notifyPlayerInvitation
      ) {
        try {
          await req.notificationService.notifyPlayerInvitation(playerId, {
            invitationId: result.insertId,
            teamId: teamId,
            teamName: team.team_name,
            inviterName: `${req.user.firstName || "Capitaine"} ${
              req.user.lastName || ""
            }`,
          });
          console.log("📨 Notification sent for invitation:", result.insertId);
        } catch (notifError) {
          console.error("⚠️ Failed to send notification:", notifError);
          // Ne pas faire échouer la création de l'invitation si la notification échoue
        }
      } else {
        console.log("⚠️ Notification service not available");
      }

      res.status(201).json({
        message: "Invitation sent successfully",
        invitationId: result.insertId,
        playerName: `${player.first_name} ${player.last_name}`,
        teamName: team.team_name,
        expiresAt: expiresAt,
      });
    } catch (error) {
      console.error("Send player invitation error:", error);

      // Gérer l'erreur de contrainte unique
      if (error.code === "ER_DUP_ENTRY") {
        return res
          .status(400)
          .json({ error: "Invitation already exists for this player" });
      }

      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /api/teams/:id/invite-email - Inviter un joueur par email
router.post(
  "/:id/invite-email",
  [
    authenticateToken,
    body("email").isEmail().withMessage("Valid email is required"),
    body("message")
      .optional({ nullable: true, checkFalsy: true })
      .isLength({ max: 500 })
      .withMessage("Message too long"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const teamId = req.params.id;
      const { email, message } = req.body;

      // Vérifier que l'utilisateur est capitaine de l'équipe
      const [captainCheck] = await db.execute(
        'SELECT tm.team_id, t.name as team_name FROM team_members tm JOIN teams t ON tm.team_id = t.id WHERE tm.user_id = ? AND tm.team_id = ? AND tm.role = "captain" AND tm.is_active = true AND t.is_active = true',
        [req.user.id, teamId]
      );

      if (captainCheck.length === 0) {
        return res
          .status(403)
          .json({ error: "Only team captain can send invitations" });
      }

      // Vérifier si un utilisateur avec cet email existe déjà
      const [userCheck] = await db.execute(
        "SELECT id FROM users WHERE email = ?",
        [email]
      );

      if (userCheck.length > 0) {
        // Si l'utilisateur existe, créer une invitation normale
        const playerId = userCheck[0].id;

        // Réutiliser la logique de la route d'invitation normale
        req.body.playerId = playerId;
        delete req.body.email; // Supprimer l'email du body

        // Appeler la logique d'invitation par ID
        return router.stack
          .find(
            (layer) =>
              layer.route &&
              layer.route.path === "/:id/invite" &&
              layer.route.methods.post
          )
          .route.stack.find((layer) => layer.name === "bound dispatch")
          .handle(req, res);
      }

      // TODO: Implémenter l'envoi d'email pour les utilisateurs non inscrits
      // Pour l'instant, on retourne une erreur explicative
      res.status(400).json({
        error:
          "This email is not registered on the platform. Please ask the person to register first, then you can invite them by searching their name.",
      });
    } catch (error) {
      console.error("Send email invitation error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/teams/:id/invitations - Récupérer les invitations envoyées par l'équipe
router.get("/:id/invitations", authenticateToken, async (req, res) => {
  try {
    const teamId = req.params.id;
    const { status = "all", limit = 20, offset = 0 } = req.query;

    // Vérifier que l'utilisateur est capitaine de l'équipe
    const [captainCheck] = await db.execute(
      'SELECT team_id FROM team_members WHERE user_id = ? AND team_id = ? AND role = "captain" AND is_active = true',
      [req.user.id, teamId]
    );

    if (captainCheck.length === 0) {
      return res
        .status(403)
        .json({ error: "Only team captain can view team invitations" });
    }

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

    const formattedInvitations = invitations.map((inv) => ({
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

    res.json(formattedInvitations);
  } catch (error) {
    console.error("Get team invitations error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/teams/:id/invitations/:invitationId - Annuler une invitation
router.delete(
  "/:id/invitations/:invitationId",
  authenticateToken,
  async (req, res) => {
    try {
      const teamId = req.params.id;
      const invitationId = req.params.invitationId;

      // Vérifier que l'utilisateur est capitaine de l'équipe
      const [captainCheck] = await db.execute(
        'SELECT team_id FROM team_members WHERE user_id = ? AND team_id = ? AND role = "captain" AND is_active = true',
        [req.user.id, teamId]
      );

      if (captainCheck.length === 0) {
        return res
          .status(403)
          .json({ error: "Only team captain can cancel invitations" });
      }

      // Vérifier que l'invitation existe et est en attente
      const [invitation] = await db.execute(
        'SELECT id, status FROM player_invitations WHERE id = ? AND team_id = ? AND status = "pending"',
        [invitationId, teamId]
      );

      if (invitation.length === 0) {
        return res.status(404).json({ error: "Pending invitation not found" });
      }

      // Supprimer l'invitation
      await db.execute("DELETE FROM player_invitations WHERE id = ?", [
        invitationId,
      ]);

      req.notificationService.notifyInvitationStatusUpdate(invitation.user_id);
      req.notificationService.notifyInvitationStatusUpdate(req.user.id);

      res.json({ message: "Invitation cancelled successfully" });
    } catch (error) {
      console.error("Cancel invitation error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

module.exports = router;
