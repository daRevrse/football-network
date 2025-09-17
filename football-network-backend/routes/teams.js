const express = require("express");
const { body, validationResult } = require("express-validator");
const db = require("../config/database");
const { authenticateToken } = require("../middleware/auth");

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
             u.first_name as captain_first_name, u.last_name as captain_last_name,
             COUNT(tm.user_id) as current_players,
             ts.matches_played, ts.matches_won, ts.average_rating,
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
      " GROUP BY t.id, u.first_name, u.last_name, ts.matches_played, ts.matches_won, ts.average_rating";

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

    const formattedTeams = teams.map((team) => ({
      id: team.id,
      name: team.name,
      description: team.description,
      skillLevel: team.skill_level,
      maxPlayers: team.max_players,
      currentPlayers: team.current_players,
      locationCity: team.location_city,
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
    }));

    res.json(formattedTeams);
  } catch (error) {
    console.error("Search teams error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/teams/my - Récupérer les équipes de l'utilisateur
router.get("/my", authenticateToken, async (req, res) => {
  try {
    const [teams] = await db.execute(
      `SELECT t.id, t.name, t.description, t.skill_level, t.max_players,
              t.location_city, t.created_at,
              tm.role,
              COUNT(tm2.user_id) as current_players,
              ts.matches_played, ts.matches_won, ts.average_rating
       FROM teams t
       JOIN team_members tm ON t.id = tm.team_id
       LEFT JOIN team_members tm2 ON t.id = tm2.team_id AND tm2.is_active = true
       LEFT JOIN team_stats ts ON t.id = ts.team_id
       WHERE tm.user_id = ? AND tm.is_active = true AND t.is_active = true
       GROUP BY t.id, tm.role, ts.matches_played, ts.matches_won, ts.average_rating
       ORDER BY tm.role DESC, t.created_at DESC`,
      [req.user.id]
    );

    const formattedTeams = teams.map((team) => ({
      id: team.id,
      name: team.name,
      description: team.description,
      skillLevel: team.skill_level,
      maxPlayers: team.max_players,
      currentPlayers: team.current_players,
      locationCity: team.location_city,
      role: team.role,
      stats: {
        matchesPlayed: team.matches_played || 0,
        matchesWon: team.matches_won || 0,
        averageRating: team.average_rating || 0,
      },
      createdAt: team.created_at,
    }));

    res.json(formattedTeams);
  } catch (error) {
    console.error("Get my teams error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/teams/:id - Récupérer les détails d'une équipe
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const teamId = req.params.id;

    // Récupérer les informations de l'équipe
    const [teams] = await db.execute(
      `SELECT t.id, t.name, t.description, t.skill_level, t.max_players,
              t.location_city, t.location_lat, t.location_lng, t.created_at,
              u.id as captain_id, u.first_name as captain_first_name, 
              u.last_name as captain_last_name, u.email as captain_email,
              ts.matches_played, ts.matches_won, ts.matches_drawn, ts.matches_lost,
              ts.goals_scored, ts.goals_conceded, ts.average_rating
       FROM teams t
       JOIN users u ON t.captain_id = u.id
       LEFT JOIN team_stats ts ON t.id = ts.team_id
       WHERE t.id = ? AND t.is_active = true`,
      [teamId]
    );

    if (teams.length === 0) {
      return res.status(404).json({ error: "Team not found" });
    }

    const team = teams[0];

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
      `SELECT t.max_players, COUNT(tm.user_id) as current_players
       FROM teams t
       LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.is_active = true
       WHERE t.id = ? AND t.is_active = true
       GROUP BY t.id, t.max_players`,
      [teamId]
    );

    if (teams.length === 0) {
      return res.status(404).json({ error: "Team not found" });
    }

    const team = teams[0];
    if (team.current_players >= team.max_players) {
      return res.status(400).json({ error: "Team is full" });
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

    res.json({ message: "Successfully joined team" });
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
      return res
        .status(400)
        .json({
          error:
            "Captain cannot leave team. Transfer captaincy or delete team.",
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

module.exports = router;
