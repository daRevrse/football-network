const mysql = require("mysql2/promise");
require("dotenv").config();

async function createTeamFollowersTable() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "football_network",
    });

    console.log("Connected to database...");

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS team_followers (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        team_id INT NOT NULL,
        followed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
        UNIQUE KEY unique_follower (user_id, team_id),
        INDEX idx_user_id (user_id),
        INDEX idx_team_id (team_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log("✅ Table team_followers created successfully!");
  } catch (error) {
    console.error("❌ Error creating table:", error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createTeamFollowersTable();
