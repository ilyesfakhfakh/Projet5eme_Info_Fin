// Supprimer TOUS les streams
const db = require('./app/models');

async function deleteAllStreams() {
  try {
    console.log('\n========================================');
    console.log('🗑️  SUPPRESSION DE TOUS LES STREAMS');
    console.log('========================================\n');

    await db.sequelize.authenticate();
    console.log('✅ Connexion à la base de données OK\n');

    // Compter les streams
    const count = await db.streams.count();
    console.log(`📊 Streams à supprimer: ${count}\n`);

    if (count === 0) {
      console.log('✅ Aucun stream à supprimer!\n');
    } else {
      // Supprimer TOUS les streams
      await db.streams.destroy({ where: {} });
      console.log(`✅ ${count} stream(s) supprimé(s) avec succès!\n`);
    }

    console.log('========================================');
    console.log('✅ SUPPRESSION TERMINÉE');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

deleteAllStreams();
