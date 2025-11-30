const { exec } = require('child_process');
const path = require('path');

console.log('🚀 Starting Complete Data Seeding Process...\n');
console.log('This will populate both Market and News modules with test data.\n');

// Fonction pour exécuter un script
function runScript(scriptName) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, scriptName);
    console.log(`\n${'='.repeat(60)}`);
    console.log(`▶️  Running: ${scriptName}`);
    console.log('='.repeat(60) + '\n');
    
    const child = exec(`node "${scriptPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error executing ${scriptName}:`, error);
        reject(error);
        return;
      }
      if (stderr) {
        console.error(`⚠️  Warnings from ${scriptName}:`, stderr);
      }
      console.log(stdout);
      resolve();
    });
    
    child.stdout.on('data', (data) => {
      process.stdout.write(data);
    });
    
    child.stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}

// Fonction principale
async function seedAllData() {
  try {
    console.log('📋 Seeding Order:');
    console.log('  1. Market Data (Assets, Market Data, Historical Data, Price Alerts)');
    console.log('  2. News Data (News Articles, Economic Events, Market News)\n');
    
    const startTime = Date.now();
    
    // 1. Seed Market Data
    await runScript('seed-market-data.js');
    
    // Attendre 2 secondes entre les scripts
    console.log('\n⏳ Waiting 2 seconds before next script...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 2. Seed News Data
    await runScript('seed-news-data.js');
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    // Résumé final
    console.log('\n\n' + '🎊'.repeat(30));
    console.log('\n✅ ALL DATA SEEDING COMPLETED SUCCESSFULLY!\n');
    console.log('📊 Summary:');
    console.log('  ✅ Market Module: Fully populated');
    console.log('  ✅ News Module: Fully populated');
    console.log(`  ⏱️  Total Time: ${duration} seconds\n`);
    console.log('🎯 You can now test all advanced features in your application!');
    console.log('🌐 Visit: http://localhost:3000/free/modules/market');
    console.log('🌐 Visit: http://localhost:3000/free/modules/news\n');
    console.log('🎊'.repeat(30) + '\n');
    
  } catch (error) {
    console.error('\n❌ Seeding process failed:', error.message);
    process.exit(1);
  }
}

// Exécuter
seedAllData();
