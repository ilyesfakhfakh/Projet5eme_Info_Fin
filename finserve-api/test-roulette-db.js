// TEST ROULETTE DATABASE CONNECTION
// Run this with: node test-roulette-db.js

const db = require('./app/models');

async function testRouletteDatabase() {
  console.log('\n🔍 TESTING ROULETTE DATABASE CONNECTION...\n');

  try {
    // Test 1: Database connection
    console.log('1️⃣ Testing database connection...');
    await db.sequelize.authenticate();
    console.log('✅ Database connected!\n');

    // Test 2: Check if roulette tables exist
    console.log('2️⃣ Checking if roulette tables exist...');
    const tables = ['wallets', 'roulette_games', 'roulette_bets', 'jackpots'];
    
    for (const table of tables) {
      try {
        const [results] = await db.sequelize.query(`SHOW TABLES LIKE '${table}'`);
        if (results.length > 0) {
          console.log(`   ✅ ${table} exists`);
        } else {
          console.log(`   ❌ ${table} MISSING!`);
        }
      } catch (err) {
        console.log(`   ❌ ${table} ERROR: ${err.message}`);
      }
    }
    console.log('');

    // Test 3: Check table structures
    console.log('3️⃣ Checking table structures...');
    
    if (db.wallets) {
      console.log('   ✅ Wallets model loaded');
    } else {
      console.log('   ❌ Wallets model NOT loaded!');
    }
    
    if (db.roulette_games) {
      console.log('   ✅ Roulette Games model loaded');
    } else {
      console.log('   ❌ Roulette Games model NOT loaded!');
    }
    
    if (db.roulette_bets) {
      console.log('   ✅ Roulette Bets model loaded');
    } else {
      console.log('   ❌ Roulette Bets model NOT loaded!');
    }
    
    if (db.jackpots) {
      console.log('   ✅ Jackpots model loaded');
    } else {
      console.log('   ❌ Jackpots model NOT loaded!');
    }
    console.log('');

    // Test 4: Count rows
    console.log('4️⃣ Counting rows in tables...');
    
    try {
      const walletCount = await db.wallets.count();
      console.log(`   Wallets: ${walletCount} rows`);
    } catch (err) {
      console.log(`   ❌ Wallets count error: ${err.message}`);
    }
    
    try {
      const gameCount = await db.roulette_games.count();
      console.log(`   Games: ${gameCount} rows`);
    } catch (err) {
      console.log(`   ❌ Games count error: ${err.message}`);
    }
    
    try {
      const betCount = await db.roulette_bets.count();
      console.log(`   Bets: ${betCount} rows`);
    } catch (err) {
      console.log(`   ❌ Bets count error: ${err.message}`);
    }
    
    try {
      const jackpotCount = await db.jackpots.count();
      console.log(`   Jackpots: ${jackpotCount} rows`);
    } catch (err) {
      console.log(`   ❌ Jackpots count error: ${err.message}`);
    }
    console.log('');

    // Test 5: Try to get jackpot
    console.log('5️⃣ Testing jackpot retrieval...');
    try {
      const jackpot = await db.jackpots.findOne();
      if (jackpot) {
        console.log(`   ✅ Jackpot found: $${jackpot.current_amount}`);
        console.log(`   Details:`, {
          jackpot_id: jackpot.jackpot_id,
          current_amount: jackpot.current_amount,
          contribution_rate: jackpot.contribution_rate,
          total_paid: jackpot.total_paid
        });
      } else {
        console.log('   ⚠️  No jackpot found in database');
        console.log('   Run this SQL in phpMyAdmin:');
        console.log('   INSERT INTO jackpots (jackpot_id, current_amount, contribution_rate, total_paid)');
        console.log('   VALUES (UUID(), 1000.00, 0.0100, 0.00);');
      }
    } catch (err) {
      console.log(`   ❌ Jackpot retrieval error: ${err.message}`);
      console.log(`   Full error:`, err);
    }
    console.log('');

    // Test 6: Try to create a test wallet
    console.log('6️⃣ Testing wallet creation...');
    try {
      const testWallet = await db.wallets.findOrCreate({
        where: { user_id: 'test-user-123' },
        defaults: {
          wallet_id: require('uuid').v4(),
          balance: 1000.00,
          currency: 'USD'
        }
      });
      console.log(`   ✅ Test wallet created/found for user: test-user-123`);
      console.log(`   Balance: $${testWallet[0].balance}`);
    } catch (err) {
      console.log(`   ❌ Wallet creation error: ${err.message}`);
      console.log(`   Full error:`, err);
    }
    console.log('');

    console.log('✅ ALL TESTS COMPLETED!\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testRouletteDatabase();
