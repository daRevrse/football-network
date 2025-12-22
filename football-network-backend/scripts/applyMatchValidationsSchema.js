require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function applySchema() {
  let connection;

  try {
    // Connexion à la base de données
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'football_network',
      multipleStatements: true
    });

    console.log('✅ Connected to database');

    // Lire le fichier SQL
    const sqlPath = path.join(__dirname, '../sql/match_validations_schema.sql');
    const sql = await fs.readFile(sqlPath, 'utf8');

    console.log('📄 Executing SQL schema...');

    // Exécuter le script SQL
    await connection.query(sql);

    console.log('✅ Schema applied successfully!');
    console.log('');
    console.log('📊 Tables created:');
    console.log('  - match_validations (historique des validations)');
    console.log('  - match_statistics (stats par match et équipe)');
    console.log('  - player_match_statistics (stats joueur par match)');
    console.log('  - team_season_statistics (stats équipe par saison)');
    console.log('  - player_season_statistics (stats joueur par saison)');
    console.log('');

  } catch (error) {
    console.error('❌ Error applying schema:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Exécuter le script
if (require.main === module) {
  applySchema()
    .then(() => {
      console.log('✨ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = applySchema;
