require("dotenv").config();
const db = require("../config/database");

async function createPasswordResetTable() {
  try {
    console.log("🔨 Creating password_reset_tokens table...");

    await db.execute(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_token (token),
        INDEX idx_user_id (user_id),
        INDEX idx_expires_at (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log("✅ Table password_reset_tokens created successfully!");

    // Vérifier que la table existe
    const [tables] = await db.execute(
      "SHOW TABLES LIKE 'password_reset_tokens'"
    );
    console.log("📋 Table verification:", tables);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating table:", error);
    process.exit(1);
  }
}

createPasswordResetTable();
