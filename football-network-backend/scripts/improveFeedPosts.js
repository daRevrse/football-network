const mysql = require("mysql2/promise");
require("dotenv").config();

async function improveFeedPosts() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "football_network",
    });

    console.log("Connected to database...");

    // Ajouter de nouveaux types de posts si nécessaire
    console.log("Updating post types...");

    // Ajouter le type de publication "recruitment" (recrutement)
    await connection.execute(`
      ALTER TABLE feed_posts
      MODIFY COLUMN post_type ENUM(
        'match_announcement',
        'match_result',
        'recruitment',
        'team_search',
        'player_search',
        'media',
        'general'
      ) NOT NULL DEFAULT 'general'
    `).catch(() => console.log("Post types already updated or error occurred"));

    // Ajouter des colonnes pour les données de recrutement
    await connection.execute(`
      ALTER TABLE feed_posts
      ADD COLUMN IF NOT EXISTS recruitment_position VARCHAR(50),
      ADD COLUMN IF NOT EXISTS recruitment_skill_level VARCHAR(50),
      ADD COLUMN IF NOT EXISTS recruitment_description TEXT
    `).catch(() => console.log("Recruitment columns may already exist"));

    // Ajouter des colonnes pour les données de match
    await connection.execute(`
      ALTER TABLE feed_posts
      ADD COLUMN IF NOT EXISTS match_opponent VARCHAR(255),
      ADD COLUMN IF NOT EXISTS match_score_home INT,
      ADD COLUMN IF NOT EXISTS match_score_away INT,
      ADD COLUMN IF NOT EXISTS match_date DATETIME
    `).catch(() => console.log("Match columns may already exist"));

    console.log("✅ Feed posts table improved successfully!");
  } catch (error) {
    console.error("❌ Error improving feed posts:", error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

improveFeedPosts();
