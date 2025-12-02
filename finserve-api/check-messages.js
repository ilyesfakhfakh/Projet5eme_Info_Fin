// Vérifier les messages dans la DB
const db = require('./app/models');

async function checkMessages() {
  try {
    console.log('\n========================================');
    console.log('💬 VÉRIFICATION DES MESSAGES');
    console.log('========================================\n');

    await db.sequelize.authenticate();
    console.log('✅ Connexion OK\n');

    const messages = await db.stream_messages.findAll({
      order: [['created_at', 'DESC']],
      limit: 20
    });

    console.log(`📊 Total messages: ${messages.length}\n`);

    if (messages.length === 0) {
      console.log('ℹ️  Aucun message dans la DB\n');
    } else {
      messages.forEach((msg, index) => {
        console.log(`Message #${index + 1}:`);
        console.log(`  - Stream: ${msg.stream_id}`);
        console.log(`  - User: ${msg.username} (${msg.user_id})`);
        console.log(`  - Message: "${msg.message}"`);
        console.log(`  - Type: ${msg.message_type}`);
        console.log(`  - Date: ${msg.created_at}`);
        console.log('');
      });
    }

    console.log('========================================\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

checkMessages();
