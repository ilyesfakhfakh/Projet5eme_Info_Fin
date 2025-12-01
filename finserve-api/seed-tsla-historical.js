// Script to seed historical data for TSLA
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const db = require('./app/models');

async function seedTSLAHistoricalData() {
  console.log('🚀 Seeding TSLA historical data...\n');

  try {
    await db.sequelize.authenticate();
    console.log('✓ Database connection established\n');

    // Find TSLA asset
    const tslaAsset = await db.assets.findOne({ where: { symbol: 'TSLA' } });
    if (!tslaAsset) {
      console.log('❌ TSLA asset not found. Please seed assets first.');
      return;
    }

    console.log(`📊 Found TSLA asset: ${tslaAsset.asset_id}`);

    // Generate 252 days of historical data (1 year of trading days)
    const historicalData = [];
    const basePrice = 200; // Current price from position
    let currentPrice = basePrice;

    for (let i = 251; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      // Generate realistic daily returns (mean ~0.05%, std dev ~2.5%)
      const dailyReturn = (Math.random() - 0.5) * 0.05; // -2.5% to +2.5%
      currentPrice = currentPrice * (1 + dailyReturn);

      // Ensure price stays reasonable
      currentPrice = Math.max(currentPrice, 50);
      currentPrice = Math.min(currentPrice, 500);

      const openPrice = currentPrice * (1 + (Math.random() - 0.5) * 0.02);
      const highPrice = Math.max(openPrice, currentPrice) * (1 + Math.random() * 0.02);
      const lowPrice = Math.min(openPrice, currentPrice) * (1 - Math.random() * 0.02);
      const closePrice = currentPrice;
      const volume = Math.floor(Math.random() * 50000000) + 10000000; // 10M to 60M shares

      historicalData.push({
        asset_id: tslaAsset.asset_id,
        date: date.toISOString().split('T')[0],
        open_price: openPrice.toFixed(2),
        high_price: highPrice.toFixed(2),
        low_price: lowPrice.toFixed(2),
        close_price: closePrice.toFixed(2),
        volume: volume,
        adjusted_close: (closePrice * 0.98).toFixed(2) // Assume 2% adjustment
      });
    }

    console.log(`📈 Generated ${historicalData.length} days of historical data`);

    // Insert data in batches
    const batchSize = 50;
    let inserted = 0;

    for (let i = 0; i < historicalData.length; i += batchSize) {
      const batch = historicalData.slice(i, i + batchSize);

      for (const data of batch) {
        try {
          await db.historical_data.create(data);
          inserted++;
        } catch (error) {
          // Ignore duplicates
          if (!error.message.includes('duplicate') && !error.message.includes('UNIQUE')) {
            console.log(`⚠️  Error inserting data for ${data.date}: ${error.message}`);
          }
        }
      }

      console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(historicalData.length/batchSize)}`);
    }

    console.log(`\n🎉 Successfully seeded ${inserted} historical data points for TSLA`);
    console.log(`📊 Data range: ${historicalData[0].date} to ${historicalData[historicalData.length-1].date}`);

  } catch (error) {
    console.error('❌ Error seeding TSLA historical data:', error);
  } finally {
    await db.sequelize.close();
    process.exit(0);
  }
}

seedTSLAHistoricalData();