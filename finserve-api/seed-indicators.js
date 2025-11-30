/**
 * Script to seed technical indicators test data
 * Run with: node seed-indicators.js
 */

const db = require('./app/models');

async function seedIndicators() {
  try {
    console.log('🌱 Starting indicators seeding...');

    // Create sample technical indicators for BTC
    const indicators = [
      {
        asset_id: 'btc-001',
        indicator_type: 'SMA',
        period: 20,
        parameters: { source: 'close' },
        values: [],
        last_calculation_date: null
      },
      {
        asset_id: 'btc-001',
        indicator_type: 'RSI',
        period: 14,
        parameters: { overbought: 70, oversold: 30 },
        values: [],
        last_calculation_date: null
      },
      {
        asset_id: 'btc-001',
        indicator_type: 'EMA',
        period: 50,
        parameters: { source: 'close' },
        values: [],
        last_calculation_date: null
      },
      {
        asset_id: 'eth-001',
        indicator_type: 'MACD',
        period: 12,
        parameters: { fast: 12, slow: 26, signal: 9 },
        values: [],
        last_calculation_date: null
      },
      {
        asset_id: 'eth-001',
        indicator_type: 'BOLLINGER',
        period: 20,
        parameters: { stdDev: 2 },
        values: [],
        last_calculation_date: null
      }
    ];

    for (const indicatorData of indicators) {
      const [indicator, created] = await db.technical_indicators.findOrCreate({
        where: {
          asset_id: indicatorData.asset_id,
          indicator_type: indicatorData.indicator_type,
          period: indicatorData.period
        },
        defaults: indicatorData
      });
      
      if (created) {
        console.log(`✅ Created ${indicatorData.indicator_type} for ${indicatorData.asset_id}`);
      } else {
        console.log(`ℹ️  ${indicatorData.indicator_type} for ${indicatorData.asset_id} already exists`);
      }
    }

    console.log('\n🎉 Indicators seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log('- 5 technical indicators created/verified');
    console.log('- Types: SMA, RSI, EMA, MACD, Bollinger Bands');
    console.log('- Assets: BTC, ETH');
    console.log('\n💡 You can now test the indicators page!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding indicators:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the seeder
seedIndicators();
