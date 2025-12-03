const db = require('../config/database');

(async () => {
  try {
    const tables = ['referee_availability', 'team_availability', 'venue_availability', 'venue_bookings'];

    for (const table of tables) {
      const [desc] = await db.execute(`DESCRIBE ${table}`);
      console.log(`\n=== ${table.toUpperCase()} ===`);
      desc.forEach(col => {
        console.log(`  ${col.Field} - ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key ? `[${col.Key}]` : ''}`);
      });
    }

    // Check if player_availability exists
    try {
      const [playerTable] = await db.execute("DESCRIBE player_availability");
      console.log(`\n=== PLAYER_AVAILABILITY ===`);
      playerTable.forEach(col => {
        console.log(`  ${col.Field} - ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key ? `[${col.Key}]` : ''}`);
      });
    } catch (e) {
      console.log(`\n=== PLAYER_AVAILABILITY ===`);
      console.log("  ❌ Table does not exist");
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
