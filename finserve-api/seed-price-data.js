/**
 * Script to seed price history data for technical indicator calculations
 * Run with: node seed-price-data.js
 */

const db = require('./app/models');

async function seedPriceData() {
  try {
    console.log('🌱 Starting price data seeding...');

    // Generate 100 days of price data for BTC
    const assets = ['btc-001', 'eth-001'];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 100);
    
    for (const assetId of assets) {
      console.log(`\n📊 Generating prices for ${assetId}...`);
      
      let basePrice = assetId === 'btc-001' ? 50000 : 3000;
      let previousClose = basePrice;
      
      for (let i = 0; i < 100; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        
        // Simulate realistic price movement
        const volatility = basePrice * 0.02; // 2% volatility
        const change = (Math.random() - 0.5) * volatility;
        
        const open = previousClose;
        const close = open + change;
        const high = Math.max(open, close) * (1 + Math.random() * 0.01);
        const low = Math.min(open, close) * (1 - Math.random() * 0.01);
        const volume = Math.random() * 1000000 + 500000;
        
        try {
          // Check if price already exists for this date
          const [existing] = await db.sequelize.query(`
            SELECT price_id FROM prices 
            WHERE asset_id = :asset_id 
            AND DATE(date) = DATE(:date)
            AND interval = '1d'
            LIMIT 1
          `, {
            replacements: { asset_id: assetId, date: date },
            type: db.Sequelize.QueryTypes.SELECT
          });
          
          if (!existing) {
            await db.sequelize.query(`
              INSERT INTO prices (asset_id, open, high, low, close, price, volume, date, interval, created_at, updated_at)
              VALUES (:asset_id, :open, :high, :low, :close, :price, :volume, :date, '1d', NOW(), NOW())
            `, {
              replacements: {
                asset_id: assetId,
                open: open.toFixed(2),
                high: high.toFixed(2),
                low: low.toFixed(2),
                close: close.toFixed(2),
                price: close.toFixed(2),
                volume: volume.toFixed(2),
                date: date
              }
            });
          }
        } catch (err) {
          console.log(`⚠️  Could not insert price for ${date.toISOString().split('T')[0]}: ${err.message}`);
        }
        
        previousClose = close;
        
        if ((i + 1) % 20 === 0) {
          console.log(`  ✅ ${i + 1}/100 prices created`);
        }
      }
      
      console.log(`✅ Completed ${assetId}: 100 price points`);
    }

    console.log('\n🎉 Price data seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Assets: ${assets.join(', ')}`);
    console.log('- Period: 100 days');
    console.log('- Interval: 1d (daily)');
    console.log('\n💡 You can now use the "Calculate" function in the indicators page!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding price data:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the seeder
seedPriceData();
