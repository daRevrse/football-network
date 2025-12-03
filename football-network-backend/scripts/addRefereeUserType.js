const db = require('../config/database');

async function addRefereeUserType() {
  try {
    console.log('📝 Adding referee user type...');

    // Modifier l'ENUM pour ajouter 'referee'
    await db.execute(`
      ALTER TABLE users
      MODIFY COLUMN user_type ENUM('player', 'manager', 'superadmin', 'venue_owner', 'referee') DEFAULT 'player'
    `);

    console.log('✅ Referee user type added successfully!');

    // Mettre à jour automatiquement les utilisateurs qui sont déjà arbitres
    const [result] = await db.execute(`
      UPDATE users u
      JOIN referees r ON r.user_id = u.id
      SET u.user_type = 'referee'
      WHERE u.user_type = 'player'
      AND r.is_active = true
    `);

    console.log(`✅ Updated ${result.affectedRows} user(s) to referee type`);

    console.log('🎉 Migration completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error adding referee user type:', error);
    process.exit(1);
  }
}

addRefereeUserType();
