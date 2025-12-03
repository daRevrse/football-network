const db = require('../config/database');

async function applySchema() {
  try {
    console.log('📝 Applying match status automation schema...');

    // 1. Ajouter les colonnes started_at et completed_at
    console.log('➡️ Adding started_at column...');
    try {
      await db.execute(`
        ALTER TABLE matches
        ADD COLUMN started_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Horodatage du démarrage automatique/manuel du match'
      `);
      console.log('✅ Column started_at added');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ Column started_at already exists');
      } else {
        throw err;
      }
    }

    console.log('➡️ Adding completed_at column...');
    try {
      await db.execute(`
        ALTER TABLE matches
        ADD COLUMN completed_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Horodatage de la fin automatique/manuelle du match'
      `);
      console.log('✅ Column completed_at added');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ Column completed_at already exists');
      } else {
        throw err;
      }
    }

    // 2. Ajouter les index
    console.log('➡️ Adding indexes...');
    try {
      await db.execute(`
        ALTER TABLE matches
        ADD INDEX idx_status_match_date (status, match_date)
      `);
      console.log('✅ Index idx_status_match_date added');
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️ Index idx_status_match_date already exists');
      } else {
        throw err;
      }
    }

    try {
      await db.execute(`
        ALTER TABLE matches
        ADD INDEX idx_started_at (started_at)
      `);
      console.log('✅ Index idx_started_at added');
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️ Index idx_started_at already exists');
      } else {
        throw err;
      }
    }

    try {
      await db.execute(`
        ALTER TABLE matches
        ADD INDEX idx_completed_at (completed_at)
      `);
      console.log('✅ Index idx_completed_at added');
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️ Index idx_completed_at already exists');
      } else {
        throw err;
      }
    }

    // 3. Mettre à jour les matchs existants
    console.log('➡️ Updating existing matches...');

    const [result1] = await db.execute(`
      UPDATE matches
      SET started_at = match_date
      WHERE status IN ('in_progress', 'completed')
        AND started_at IS NULL
        AND match_date <= NOW()
    `);
    console.log(`✅ Updated ${result1.affectedRows} match(es) with started_at`);

    const [result2] = await db.execute(`
      UPDATE matches
      SET completed_at = DATE_ADD(COALESCE(started_at, match_date), INTERVAL 120 MINUTE)
      WHERE status = 'completed'
        AND completed_at IS NULL
        AND (started_at IS NOT NULL OR match_date <= NOW())
    `);
    console.log(`✅ Updated ${result2.affectedRows} match(es) with completed_at`);

    console.log('🎉 Schema applied successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error applying schema:', error);
    process.exit(1);
  }
}

applySchema();
