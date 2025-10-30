// ============================
// Routes pour le Feed Public
// ============================

const express = require("express");
const { body, query, validationResult } = require("express-validator");
const db = require("../config/database");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// ============================
// FEED POSTS
// ============================

/**
 * GET /api/feed
 * Récupérer le feed public avec pagination et filtres
 */
router.get(
  "/",
  [
    query("limit").optional().isInt({ min: 1, max: 50 }).toInt(),
    query("offset").optional().isInt({ min: 0 }).toInt(),
    query("type")
      .optional()
      .isIn([
        "match_announcement",
        "match_result",
        "team_search",
        "player_search",
        "media",
        "general",
        "all",
      ]),
    query("city").optional().trim(),
    query("userId").optional().isInt().toInt(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { limit = 20, offset = 0, type, city, userId } = req.query;
      const currentUserId = req.user?.id;

      let query = `
        SELECT 
          fp.*,
          u.first_name, u.last_name, u.profile_picture, u.skill_level,
          t.name AS team_name,
          m.home_team_id, m.away_team_id, m.status AS match_status,
          m.match_date AS match_date,
          ${
            currentUserId
              ? `
            EXISTS(SELECT 1 FROM feed_likes WHERE post_id = fp.id AND user_id = ?) AS user_liked
          `
              : "FALSE AS user_liked"
          }
        FROM feed_posts fp
        JOIN users u ON fp.user_id = u.id
        LEFT JOIN teams t ON fp.team_id = t.id
        LEFT JOIN matches m ON fp.match_id = m.id
        WHERE fp.is_active = TRUE 
          AND fp.visibility = 'public'
      `;

      const queryParams = currentUserId ? [currentUserId] : [];

      // Filtres
      if (type && type !== "all") {
        query += " AND fp.post_type = ?";
        queryParams.push(type);
      }

      if (city) {
        query += " AND fp.location_city LIKE ?";
        queryParams.push(`%${city}%`);
      }

      if (userId) {
        query += " AND fp.user_id = ?";
        queryParams.push(userId);
      }

      // Ordre et pagination
      query +=
        " ORDER BY fp.is_pinned DESC, fp.created_at DESC LIMIT ? OFFSET ?";
      queryParams.push(limit, offset);

      const [posts] = await db.execute(query, queryParams);

      // Formatter les résultats
      const formattedPosts = posts.map((post) => ({
        id: post.id,
        type: post.post_type,
        content: post.content,
        author: {
          id: post.user_id,
          firstName: post.first_name,
          lastName: post.last_name,
          profilePicture: post.profile_picture,
          skillLevel: post.skill_level,
        },
        team: post.team_id
          ? {
              id: post.team_id,
              name: post.team_name,
            }
          : null,
        match: post.match_id
          ? {
              id: post.match_id,
              homeTeamId: post.home_team_id,
              awayTeamId: post.away_team_id,
              status: post.match_status,
              date: post.match_date,
            }
          : null,
        media: post.media_url
          ? {
              url: post.media_url,
              type: post.media_type,
            }
          : null,
        location: post.location_city
          ? {
              city: post.location_city,
              coordinates:
                post.location_lat && post.location_lng
                  ? {
                      lat: parseFloat(post.location_lat),
                      lng: parseFloat(post.location_lng),
                    }
                  : null,
            }
          : null,
        stats: {
          likes: post.likes_count,
          comments: post.comments_count,
          shares: post.shares_count,
          views: post.views_count,
        },
        userLiked: Boolean(post.user_liked),
        isPinned: Boolean(post.is_pinned),
        createdAt: post.created_at,
        updatedAt: post.updated_at,
      }));

      res.json({
        posts: formattedPosts,
        pagination: {
          limit,
          offset,
          total: formattedPosts.length,
          hasMore: formattedPosts.length === limit,
        },
      });
    } catch (error) {
      console.error("Get feed error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * GET /api/feed/trending
 * Récupérer les posts tendance
 */
router.get("/trending", async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const currentUserId = req.user?.id;

    const [posts] = await db.execute(
      `SELECT 
        fp.*,
        u.first_name, u.last_name, u.profile_picture,
        (fp.likes_count * 2 + fp.comments_count * 3 + fp.shares_count * 5) AS popularity_score,
        ${
          currentUserId
            ? `
          EXISTS(SELECT 1 FROM feed_likes WHERE post_id = fp.id AND user_id = ?) AS user_liked
        `
            : "FALSE AS user_liked"
        }
      FROM feed_posts fp
      JOIN users u ON fp.user_id = u.id
      WHERE fp.is_active = TRUE
        AND fp.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      ORDER BY popularity_score DESC
      LIMIT ?`,
      currentUserId ? [currentUserId, parseInt(limit)] : [parseInt(limit)]
    );

    res.json({ posts });
  } catch (error) {
    console.error("Get trending posts error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/feed
 * Créer un nouveau post
 */
router.post(
  "/",
  [
    authenticateToken,
    body("type").isIn([
      "match_announcement",
      "match_result",
      "team_search",
      "player_search",
      "media",
      "general",
    ]),
    body("content").trim().isLength({ min: 1, max: 5000 }),
    body("matchId").optional().isInt(),
    body("teamId").optional().isInt(),
    body("mediaUrl").optional().isURL(),
    body("mediaType").optional().isIn(["image", "video"]),
    body("locationCity").optional().trim(),
    body("coordinates").optional().isObject(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        type,
        content,
        matchId,
        teamId,
        mediaUrl,
        mediaType,
        locationCity,
        coordinates,
      } = req.body;

      // Vérifier que l'utilisateur a le droit de poster sur l'équipe si teamId fourni
      if (teamId) {
        const [membership] = await db.execute(
          "SELECT id FROM team_members WHERE team_id = ? AND user_id = ? AND is_active = TRUE",
          [teamId, req.user.id]
        );

        if (membership.length === 0) {
          return res.status(403).json({ error: "Not a member of this team" });
        }
      }

      // Insérer le post
      const [result] = await db.execute(
        `INSERT INTO feed_posts (
          user_id, post_type, content, match_id, team_id,
          media_url, media_type, location_city, location_lat, location_lng
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.id,
          type,
          content,
          matchId || null,
          teamId || null,
          mediaUrl || null,
          mediaType || null,
          locationCity || null,
          coordinates?.lat || null,
          coordinates?.lng || null,
        ]
      );

      // Extraire et créer les hashtags
      const hashtags = content.match(/#[\w\u00C0-\u024F]+/g) || [];
      if (hashtags.length > 0) {
        for (const tag of hashtags) {
          const cleanTag = tag.substring(1).toLowerCase();

          // Insérer ou incrémenter le hashtag
          await db.execute(
            `INSERT INTO feed_hashtags (tag, usage_count) 
             VALUES (?, 1) 
             ON DUPLICATE KEY UPDATE usage_count = usage_count + 1`,
            [cleanTag]
          );

          // Lier le hashtag au post
          const [hashtagRow] = await db.execute(
            "SELECT id FROM feed_hashtags WHERE tag = ?",
            [cleanTag]
          );

          await db.execute(
            "INSERT INTO feed_post_hashtags (post_id, hashtag_id) VALUES (?, ?)",
            [result.insertId, hashtagRow[0].id]
          );
        }
      }

      // Récupérer le post créé avec toutes ses infos
      const [newPost] = await db.execute(
        `SELECT 
          fp.*,
          u.id as author_id,
          u.first_name,
          u.last_name,
          u.profile_picture,
          u.skill_level
         FROM feed_posts fp
         JOIN users u ON fp.user_id = u.id
         WHERE fp.id = ?`,
        [result.insertId]
      );

      // Formater le post pour le frontend
      const formattedPost = {
        id: newPost[0].id,
        type: newPost[0].post_type,
        content: newPost[0].content,
        author: {
          id: newPost[0].author_id,
          firstName: newPost[0].first_name,
          lastName: newPost[0].last_name,
          profilePicture: newPost[0].profile_picture,
          skillLevel: newPost[0].skill_level,
        },
        team: newPost[0].team_id
          ? {
              id: newPost[0].team_id,
            }
          : null,
        match: newPost[0].match_id
          ? {
              id: newPost[0].match_id,
            }
          : null,
        media: newPost[0].media_url
          ? {
              url: newPost[0].media_url,
              type: newPost[0].media_type,
            }
          : null,
        location: newPost[0].location_city
          ? {
              city: newPost[0].location_city,
              coordinates:
                newPost[0].location_lat && newPost[0].location_lng
                  ? {
                      lat: parseFloat(newPost[0].location_lat),
                      lng: parseFloat(newPost[0].location_lng),
                    }
                  : null,
            }
          : null,
        stats: {
          likes: newPost[0].likes_count || 0,
          comments: newPost[0].comments_count || 0,
          shares: newPost[0].shares_count || 0,
          views: newPost[0].views_count || 0,
        },
        userLiked: false,
        isPinned: Boolean(newPost[0].is_pinned),
        createdAt: newPost[0].created_at,
        updatedAt: newPost[0].updated_at,
      };

      console.log("✅ Post created and formatted:", formattedPost);

      res.status(201).json({
        message: "Post created successfully",
        post: formattedPost,
      });
    } catch (error) {
      console.error("Create post error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * DELETE /api/feed/:id
 * Supprimer un post (soft delete)
 */
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const postId = req.params.id;

    // Vérifier que l'utilisateur est l'auteur du post
    const [posts] = await db.execute(
      "SELECT user_id FROM feed_posts WHERE id = ?",
      [postId]
    );

    if (posts.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (posts[0].user_id !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Soft delete
    await db.execute("UPDATE feed_posts SET is_active = FALSE WHERE id = ?", [
      postId,
    ]);

    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Delete post error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ============================
// LIKES
// ============================

/**
 * POST /api/feed/:id/like
 * Liker un post
 */
router.post("/:id/like", authenticateToken, async (req, res) => {
  try {
    const postId = req.params.id;

    // Vérifier que le post existe
    const [posts] = await db.execute(
      "SELECT id FROM feed_posts WHERE id = ? AND is_active = TRUE",
      [postId]
    );

    if (posts.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Insérer le like (le trigger incrémentera automatiquement le compteur)
    try {
      await db.execute(
        "INSERT INTO feed_likes (post_id, user_id) VALUES (?, ?)",
        [postId, req.user.id]
      );

      res.json({ message: "Post liked successfully" });
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({ error: "Already liked" });
      }
      throw err;
    }
  } catch (error) {
    console.error("Like post error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * DELETE /api/feed/:id/like
 * Unliker un post
 */
router.delete("/:id/like", authenticateToken, async (req, res) => {
  try {
    const postId = req.params.id;

    await db.execute(
      "DELETE FROM feed_likes WHERE post_id = ? AND user_id = ?",
      [postId, req.user.id]
    );

    res.json({ message: "Like removed successfully" });
  } catch (error) {
    console.error("Unlike post error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ============================
// COMMENTAIRES
// ============================

/**
 * GET /api/feed/:id/comments
 * Récupérer les commentaires d'un post
 */
router.get("/:id/comments", async (req, res) => {
  try {
    const postId = req.params.id;
    const { limit = 20, offset = 0 } = req.query;

    const [comments] = await db.execute(
      `SELECT 
        fc.*,
        u.first_name, u.last_name, u.profile_picture
      FROM feed_comments fc
      JOIN users u ON fc.user_id = u.id
      WHERE fc.post_id = ? AND fc.is_active = TRUE AND fc.parent_comment_id IS NULL
      ORDER BY fc.created_at DESC
      LIMIT ? OFFSET ?`,
      [postId, parseInt(limit), parseInt(offset)]
    );

    // Récupérer les réponses pour chaque commentaire
    for (let comment of comments) {
      const [replies] = await db.execute(
        `SELECT 
          fc.*,
          u.first_name, u.last_name, u.profile_picture
        FROM feed_comments fc
        JOIN users u ON fc.user_id = u.id
        WHERE fc.parent_comment_id = ? AND fc.is_active = TRUE
        ORDER BY fc.created_at ASC
        LIMIT 5`,
        [comment.id]
      );
      comment.replies = replies;
    }

    res.json({ comments });
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/feed/:id/comments
 * Ajouter un commentaire
 */
router.post(
  "/:id/comments",
  [
    authenticateToken,
    body("content").trim().isLength({ min: 1, max: 1000 }),
    body("parentCommentId").optional().isInt(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const postId = req.params.id;
      const { content, parentCommentId } = req.body;

      // Vérifier que le post existe
      const [posts] = await db.execute(
        "SELECT id FROM feed_posts WHERE id = ? AND is_active = TRUE",
        [postId]
      );

      if (posts.length === 0) {
        return res.status(404).json({ error: "Post not found" });
      }

      // Insérer le commentaire
      const [result] = await db.execute(
        `INSERT INTO feed_comments (post_id, user_id, parent_comment_id, content)
         VALUES (?, ?, ?, ?)`,
        [postId, req.user.id, parentCommentId || null, content]
      );

      // Récupérer le commentaire avec les infos utilisateur
      const [newComment] = await db.execute(
        `SELECT fc.*, u.first_name, u.last_name, u.profile_picture
         FROM feed_comments fc
         JOIN users u ON fc.user_id = u.id
         WHERE fc.id = ?`,
        [result.insertId]
      );

      res.status(201).json({
        message: "Comment added successfully",
        comment: newComment[0],
      });
    } catch (error) {
      console.error("Add comment error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * DELETE /api/feed/comments/:commentId
 * Supprimer un commentaire
 */
router.delete("/comments/:commentId", authenticateToken, async (req, res) => {
  try {
    const commentId = req.params.commentId;

    // Vérifier que l'utilisateur est l'auteur
    const [comments] = await db.execute(
      "SELECT user_id FROM feed_comments WHERE id = ?",
      [commentId]
    );

    if (comments.length === 0) {
      return res.status(404).json({ error: "Comment not found" });
    }

    if (comments[0].user_id !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Soft delete
    await db.execute(
      "UPDATE feed_comments SET is_active = FALSE WHERE id = ?",
      [commentId]
    );

    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ============================
// PARTAGES
// ============================

/**
 * POST /api/feed/:id/share
 * Partager un post
 */
router.post(
  "/:id/share",
  [
    authenticateToken,
    body("sharedTo").isIn(["feed", "team", "direct"]),
    body("message").optional().trim().isLength({ max: 500 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const postId = req.params.id;
      const { sharedTo, message } = req.body;

      // Vérifier que le post existe
      const [posts] = await db.execute(
        "SELECT id FROM feed_posts WHERE id = ? AND is_active = TRUE",
        [postId]
      );

      if (posts.length === 0) {
        return res.status(404).json({ error: "Post not found" });
      }

      // Enregistrer le partage
      await db.execute(
        "INSERT INTO feed_shares (post_id, user_id, shared_to, message) VALUES (?, ?, ?, ?)",
        [postId, req.user.id, sharedTo, message || null]
      );

      res.json({ message: "Post shared successfully" });
    } catch (error) {
      console.error("Share post error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ============================
// SIGNALEMENTS
// ============================

/**
 * POST /api/feed/:id/report
 * Signaler un post
 */
router.post(
  "/:id/report",
  [
    authenticateToken,
    body("reason").isIn([
      "spam",
      "harassment",
      "inappropriate",
      "false_info",
      "other",
    ]),
    body("description").optional().trim().isLength({ max: 500 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const postId = req.params.id;
      const { reason, description } = req.body;

      await db.execute(
        `INSERT INTO feed_reports (post_id, reported_by, reason, description)
         VALUES (?, ?, ?, ?)`,
        [postId, req.user.id, reason, description || null]
      );

      res.json({ message: "Report submitted successfully" });
    } catch (error) {
      console.error("Report post error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

module.exports = router;
