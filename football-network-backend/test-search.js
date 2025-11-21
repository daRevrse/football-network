/**
 * Script de test simple pour l'API de recherche
 * Usage: node test-search.js [query] [type]
 * Exemple: node test-search.js "paris" "teams"
 */

require('dotenv').config();

const API_URL = process.env.API_URL || 'http://localhost:5000/api';

async function testSearch() {
  const query = process.argv[2] || 'test';
  const type = process.argv[3] || 'all';

  console.log('\n🔍 Test de l\'API de recherche');
  console.log('================================');
  console.log(`Query: "${query}"`);
  console.log(`Type: ${type}`);
  console.log('');

  try {
    // Note: Ce test nécessite un token valide
    // Pour un test complet, vous devez d'abord vous authentifier
    console.log('⚠️  Avertissement: Ce test nécessite un token JWT valide');
    console.log('   Pour tester complètement, utilisez Postman ou l\'application mobile\n');

    // Afficher l'URL qui serait appelée
    const testUrl = `${API_URL}/search?q=${encodeURIComponent(query)}&type=${type}`;
    console.log('URL de test:', testUrl);
    console.log('');

    // Afficher les commandes curl pour tester manuellement
    console.log('📝 Commandes pour tester manuellement:');
    console.log('');
    console.log('1. Obtenir un token (login):');
    console.log(`   curl -X POST "${API_URL}/auth/login" \\`);
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -d \'{"email":"votre@email.com","password":"votremotdepasse"}\'');
    console.log('');
    console.log('2. Tester la recherche (remplacez YOUR_TOKEN):');
    console.log(`   curl -X GET "${testUrl}" \\`);
    console.log('     -H "Authorization: Bearer YOUR_TOKEN"');
    console.log('');

    console.log('✅ Configuration terminée');
    console.log('\n💡 Utilisez les commandes ci-dessus pour tester l\'API de recherche.');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

// Afficher l'aide si demandé
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('\n📖 Aide - Test de l\'API de recherche');
  console.log('=====================================');
  console.log('');
  console.log('Usage: node test-search.js [query] [type]');
  console.log('');
  console.log('Arguments:');
  console.log('  query  - Terme de recherche (défaut: "test")');
  console.log('  type   - Type de recherche: all, teams, players, matches (défaut: "all")');
  console.log('');
  console.log('Exemples:');
  console.log('  node test-search.js "paris"');
  console.log('  node test-search.js "jean" "players"');
  console.log('  node test-search.js "fc" "teams"');
  console.log('');
  process.exit(0);
}

testSearch();
