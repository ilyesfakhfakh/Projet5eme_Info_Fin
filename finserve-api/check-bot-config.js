const db = require('./app/models');

const botId = 'c562143a-d671-41b0-b124-4fd9e72bf871';

async function checkBot() {
  try {
    await db.sequelize.authenticate();
    console.log('\n✅ Database connected\n');

    const bot = await db.trading_bots.findByPk(botId);

    if (!bot) {
      console.log('❌ Bot not found');
      process.exit(1);
    }

    // Parser le JSON si c'est une string
    let config = bot.config;
    let settings = bot.settings;
    
    if (typeof config === 'string') {
      console.log('⚠️ Config is stored as STRING, parsing...');
      config = JSON.parse(config);
    }
    
    if (typeof settings === 'string') {
      console.log('⚠️ Settings is stored as STRING, parsing...');
      settings = JSON.parse(settings);
    }

    console.log('🤖 Bot Information:');
    console.log('-------------------');
    console.log(`ID: ${bot.bot_id}`);
    console.log(`Name: ${bot.name}`);
    console.log(`Description: ${bot.description}`);
    console.log(`Status: ${bot.status}`);
    console.log(`Category: ${bot.category}`);
    console.log(`Risk Level: ${bot.risk_level}`);
    console.log('\n📦 Config:');
    console.log(JSON.stringify(config, null, 2));
    console.log('\n⚙️ Settings:');
    console.log(JSON.stringify(settings, null, 2));
    console.log('\n✅ Config has nodes:', !!config?.nodes);
    console.log('✅ Config has edges:', !!config?.edges);
    console.log('✅ Number of nodes:', config?.nodes?.length || 0);
    console.log('✅ Number of edges:', config?.edges?.length || 0);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkBot();
