// Test VAR calculation directly
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const db = require('./app/models');

// We need to extract the RiskCalculator class from the controller file
// Since it's not exported, we'll define it here or copy the logic

async function testVARCalculation() {
  console.log('Testing VAR calculation for obligs portfolio...\n');

  try {
    await db.sequelize.authenticate();
    console.log('✓ Database connection established\n');

    // Get the obligs portfolio
    const portfolio = await db.portfolios.findOne({ where: { portfolio_name: 'obligs' } });
    if (!portfolio) {
      console.log('❌ Obligs portfolio not found');
      return;
    }

    console.log(`📊 Testing portfolio: ${portfolio.portfolio_name} (ID: ${portfolio.portfolio_id})`);

    // Test historical returns calculation directly
    console.log('\n📈 Calculating historical portfolio returns...');

    // Get current positions
    const positions = await db.positions.findAll({
      where: { portfolio_id: portfolio.portfolio_id },
      include: [{ model: db.assets, as: 'asset' }]
    });

    console.log(`Found ${positions.length} positions in portfolio`);

    if (positions.length === 0) {
      console.log('❌ No positions found in portfolio');
      return;
    }

    // Get historical data for all assets
    const assetIds = positions.map(p => p.asset_id).filter(id => id);
    console.log(`Assets in portfolio: ${assetIds.join(', ')}`);

    if (assetIds.length === 0) {
      console.log('❌ No valid asset IDs found');
      return;
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 252);

    const historicalData = await db.historical_data.findAll({
      where: {
        asset_id: assetIds,
        date: {
          [db.Sequelize.Op.between]: [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
        }
      },
      order: [['date', 'ASC']]
    });

    console.log(`Found ${historicalData.length} historical data points`);

    if (historicalData.length === 0) {
      console.log('❌ No historical data found - VAR will use mock data');
    } else {
      // Group by date and calculate portfolio returns
      const dataByDate = {};
      historicalData.forEach(record => {
        if (!dataByDate[record.date]) {
          dataByDate[record.date] = {};
        }
        dataByDate[record.date][record.asset_id] = record.adjusted_close || record.close_price;
      });

      const dates = Object.keys(dataByDate).sort();
      const portfolioReturns = [];

      for (let i = 1; i < dates.length; i++) {
        const currentDate = dates[i];
        const previousDate = dates[i - 1];
        const currentPrices = dataByDate[currentDate];
        const previousPrices = dataByDate[previousDate];

        let portfolioValueCurrent = 0;
        let portfolioValuePrevious = 0;

        positions.forEach(position => {
          const assetId = position.asset_id;
          const quantity = position.quantity;

          if (currentPrices[assetId] && previousPrices[assetId]) {
            portfolioValueCurrent += quantity * currentPrices[assetId];
            portfolioValuePrevious += quantity * previousPrices[assetId];
          }
        });

        if (portfolioValuePrevious > 0) {
          const dailyReturn = (portfolioValueCurrent - portfolioValuePrevious) / portfolioValuePrevious;
          portfolioReturns.push(dailyReturn);
        }
      }

      console.log(`Calculated ${portfolioReturns.length} portfolio returns`);
      console.log(`Sample returns: ${portfolioReturns.slice(0, 5).map(r => r.toFixed(4)).join(', ')}`);

      if (portfolioReturns.length > 0) {
        // Calculate VAR using historical data
        const sortedReturns = [...portfolioReturns].sort((a, b) => a - b);
        const index = Math.floor((1 - 0.95) * sortedReturns.length);
        const var95 = Math.abs(sortedReturns[index]);

        console.log(`\n📊 VAR (95%) calculated: €${var95.toFixed(4)}`);

        // Check if this matches what we expect
        const expectedValue = 0.01; // What user sees
        const tolerance = 0.005;

        if (Math.abs(var95 - expectedValue) < tolerance) {
          console.log(`✅ VAR calculation matches expected value (€${expectedValue})`);
        } else {
          console.log(`❌ VAR calculation differs from expected value (€${expectedValue})`);
          console.log(`   Calculated: €${var95.toFixed(4)}, Expected: €${expectedValue}`);
        }
      }
    }

    // Test with mock data (fallback)
    console.log('\n🎭 Testing fallback calculation with mock data...');
    const mockReturns = Array.from({ length: 252 }, () => (Math.random() - 0.5) * 0.02);
    const mockVar = RiskCalculator.RiskCalculator.calculateVaR(mockReturns, 0.95, 1);
    console.log(`Mock VAR (95%): €${mockVar.toFixed(4)}`);

    // This should be around 0.01
    if (Math.abs(mockVar - 0.01) < 0.005) {
      console.log('✅ Mock data produces expected small VAR values');
    }

  } catch (error) {
    console.error('❌ Error testing VAR calculation:', error);
  } finally {
    await db.sequelize.close();
    process.exit(0);
  }
}

testVARCalculation();