const db = require('../config/database');
const fs = require('fs');
const path = require('path');

async function addMercatoStatus() {
  try {
    console.log('🔄 Ajout du champ mercato_actif à la table teams...');

    const sqlPath = path.join(__dirname, '../sql/add_mercato_status.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Séparer les requêtes SQL
    const queries = sql
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0 && !q.startsWith('--'));

    for (const query of queries) {
      await db.execute(query);
    }

    console.log('✅ Champ mercato_actif ajouté avec succès!');
    console.log('📊 Toutes les équipes ont maintenant le mercato activé par défaut.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout du champ mercato_actif:', error);
    process.exit(1);
  }
}

addMercatoStatus();
