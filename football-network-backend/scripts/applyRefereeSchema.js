const db = require('../config/database');

async function applySchema() {
  try {
    console.log('📝 Applying referee match management schema...');

    // 1. Ajouter les colonnes à la table matches
    console.log('➡️ Adding started_by_referee column...');
    try {
      await db.execute(`
        ALTER TABLE matches
        ADD COLUMN started_by_referee BOOLEAN DEFAULT FALSE COMMENT 'Match démarré par l''arbitre'
      `);
      console.log('✅ Column started_by_referee added');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ Column started_by_referee already exists');
      } else {
        throw err;
      }
    }

    console.log('➡️ Adding is_referee_verified column...');
    try {
      await db.execute(`
        ALTER TABLE matches
        ADD COLUMN is_referee_verified BOOLEAN DEFAULT FALSE COMMENT 'Score vérifié et certifié par l''arbitre'
      `);
      console.log('✅ Column is_referee_verified added');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ Column is_referee_verified already exists');
      } else {
        throw err;
      }
    }

    console.log('➡️ Adding referee_validation_notes column...');
    try {
      await db.execute(`
        ALTER TABLE matches
        ADD COLUMN referee_validation_notes TEXT COMMENT 'Notes de validation de l''arbitre'
      `);
      console.log('✅ Column referee_validation_notes added');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ Column referee_validation_notes already exists');
      } else {
        throw err;
      }
    }

    console.log('➡️ Adding referee_validated_at column...');
    try {
      await db.execute(`
        ALTER TABLE matches
        ADD COLUMN referee_validated_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Date de validation par l''arbitre'
      `);
      console.log('✅ Column referee_validated_at added');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ Column referee_validated_at already exists');
      } else {
        throw err;
      }
    }

    console.log('➡️ Adding referee_validated_by column...');
    try {
      await db.execute(`
        ALTER TABLE matches
        ADD COLUMN referee_validated_by INT COMMENT 'ID de l''arbitre qui a validé'
      `);
      console.log('✅ Column referee_validated_by added');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ Column referee_validated_by already exists');
      } else {
        throw err;
      }
    }

    // 2. Ajouter les index
    console.log('➡️ Adding indexes...');
    try {
      await db.execute(`
        ALTER TABLE matches
        ADD INDEX idx_referee_verified (is_referee_verified)
      `);
      console.log('✅ Index idx_referee_verified added');
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️ Index idx_referee_verified already exists');
      } else {
        throw err;
      }
    }

    try {
      await db.execute(`
        ALTER TABLE matches
        ADD INDEX idx_referee_validated_at (referee_validated_at)
      `);
      console.log('✅ Index idx_referee_validated_at added');
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️ Index idx_referee_validated_at already exists');
      } else {
        throw err;
      }
    }

    // 3. Créer la table des incidents de match
    console.log('➡️ Creating match_incidents table...');
    try {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS match_incidents (
          id INT PRIMARY KEY AUTO_INCREMENT,
          match_id INT NOT NULL,
          referee_id INT NOT NULL,
          team_id INT NOT NULL,
          player_id INT,
          incident_type ENUM('yellow_card', 'red_card', 'injury', 'misconduct', 'other') NOT NULL,
          description TEXT NOT NULL,
          minute_occurred INT COMMENT 'Minute du match où l''incident s''est produit',
          reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
          FOREIGN KEY (referee_id) REFERENCES referees(id) ON DELETE CASCADE,
          FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
          FOREIGN KEY (player_id) REFERENCES users(id) ON DELETE SET NULL,
          INDEX idx_match_incidents (match_id),
          INDEX idx_referee_incidents (referee_id),
          INDEX idx_incident_type (incident_type),
          INDEX idx_reported_at (reported_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ Table match_incidents created');
    } catch (err) {
      if (err.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log('ℹ️ Table match_incidents already exists');
      } else {
        throw err;
      }
    }

    // 4. Créer la table des statistiques de cartes
    console.log('➡️ Creating player_card_statistics table...');
    try {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS player_card_statistics (
          id INT PRIMARY KEY AUTO_INCREMENT,
          player_id INT NOT NULL,
          team_id INT NOT NULL,
          season VARCHAR(20) DEFAULT '2024-2025',
          yellow_cards INT DEFAULT 0,
          red_cards INT DEFAULT 0,
          total_matches_played INT DEFAULT 0,
          last_card_date TIMESTAMP NULL DEFAULT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (player_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
          UNIQUE KEY unique_player_team_season (player_id, team_id, season),
          INDEX idx_player_cards (player_id),
          INDEX idx_team_cards (team_id),
          INDEX idx_season (season)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ Table player_card_statistics created');
    } catch (err) {
      if (err.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log('ℹ️ Table player_card_statistics already exists');
      } else {
        throw err;
      }
    }

    console.log('🎉 Referee schema applied successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error applying schema:', error);
    process.exit(1);
  }
}

applySchema();
