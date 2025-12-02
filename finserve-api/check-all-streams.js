// Vérifier TOUS les streams (pas seulement LIVE)
const db = require('./app/models');

async function checkAllStreams() {
  try {
    console.log('\n========================================');
    console.log('🔍 VÉRIFICATION DE TOUS LES STREAMS');
    console.log('========================================\n');

    await db.sequelize.authenticate();
    console.log('✅ Connexion à la base de données OK\n');

    // Lister TOUS les streams
    const allStreams = await db.streams.findAll({
      order: [['created_at', 'DESC']],
      limit: 10
    });

    console.log(`📊 Total streams trouvés: ${allStreams.length}\n`);

    if (allStreams.length === 0) {
      console.log('✅ Aucun stream dans la base de données!\n');
    } else {
      allStreams.forEach((stream, index) => {
        console.log(`Stream #${index + 1}:`);
        console.log(`  - ID: ${stream.stream_id}`);
        console.log(`  - Streamer: ${stream.streamer_id}`);
        console.log(`  - Status: ${stream.status}`);
        console.log(`  - Titre: ${stream.title}`);
        console.log(`  - Démarré: ${stream.started_at}`);
        console.log(`  - Terminé: ${stream.ended_at || 'N/A'}`);
        console.log('');
      });
    }

    console.log('========================================');
    console.log('✅ VÉRIFICATION TERMINÉE');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

checkAllStreams();
