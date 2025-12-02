// Script pour nettoyer les streams actifs
const db = require('./app/models');

async function cleanupStreams() {
  try {
    console.log('\n========================================');
    console.log('🧹 NETTOYAGE DES STREAMS');
    console.log('========================================\n');

    await db.sequelize.authenticate();
    console.log('✅ Connexion à la base de données OK\n');

    // 1. Lister les streams actifs
    const activeStreams = await db.streams.findAll({
      where: {
        status: 'LIVE'
      }
    });

    console.log(`📊 Streams actifs trouvés: ${activeStreams.length}\n`);

    if (activeStreams.length === 0) {
      console.log('✅ Aucun stream actif à nettoyer!\n');
    } else {
      // Afficher les streams actifs
      activeStreams.forEach((stream, index) => {
        console.log(`Stream #${index + 1}:`);
        console.log(`  - ID: ${stream.stream_id}`);
        console.log(`  - Streamer: ${stream.streamer_id}`);
        console.log(`  - Titre: ${stream.title}`);
        console.log(`  - Démarré: ${stream.started_at}`);
        console.log('');
      });

      // 2. Fermer tous les streams actifs
      const now = new Date();
      const [updatedCount] = await db.streams.update(
        {
          status: 'ENDED',
          ended_at: now,
          duration_seconds: db.sequelize.literal(
            `TIMESTAMPDIFF(SECOND, started_at, '${now.toISOString().slice(0, 19).replace('T', ' ')}')`
          )
        },
        {
          where: {
            status: 'LIVE'
          }
        }
      );

      console.log(`✅ ${updatedCount} stream(s) fermé(s) avec succès!\n`);
    }

    console.log('========================================');
    console.log('✅ NETTOYAGE TERMINÉ');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

cleanupStreams();
