// Script pour vérifier si les tables streaming existent
const db = require('./app/models');

async function checkTables() {
  try {
    console.log('\n========================================');
    console.log('VÉRIFICATION DES TABLES STREAMING');
    console.log('========================================\n');

    // Tester la connexion
    await db.sequelize.authenticate();
    console.log('✅ Connexion à la base de données OK\n');

    // Vérifier chaque table
    const tables = ['streams', 'stream_messages', 'stream_viewers', 'stream_tips'];
    
    for (const table of tables) {
      try {
        const [results] = await db.sequelize.query(`SHOW TABLES LIKE '${table}'`);
        if (results.length > 0) {
          console.log(`✅ Table '${table}' existe`);
        } else {
          console.log(`❌ Table '${table}' MANQUANTE!`);
        }
      } catch (error) {
        console.log(`❌ Erreur pour '${table}':`, error.message);
      }
    }

    console.log('\n========================================');
    console.log('VÉRIFICATION TERMINÉE');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

checkTables();
