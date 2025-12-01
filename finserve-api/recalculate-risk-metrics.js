// Script to recalculate risk metrics for obligs portfolio
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const db = require('./app/models');

async function recalculateRiskMetrics() {
  console.log('🔄 Recalculating risk metrics for obligs portfolio...\n');

  try {
    await db.sequelize.authenticate();
    console.log('✓ Database connection established\n');

    // Get the obligs portfolio
    const portfolio = await db.portfolios.findOne({ where: { portfolio_name: 'obligs' } });
    if (!portfolio) {
      console.log('❌ Obligs portfolio not found');
      return;
    }

    console.log(`📊 Portfolio: ${portfolio.portfolio_name} (ID: ${portfolio.portfolio_id})`);

    // Calculate VAR
    console.log('\n📊 Calculating VAR...');
    const positions = await db.positions.findAll({
      where: { portfolio_id: portfolio.portfolio_id },
      include: [{ model: db.assets, as: 'asset' }]
    });

    if (positions.length === 0) {
      console.log('❌ No positions found');
      return;
    }

    // Get historical data
    const assetIds = positions.map(p => p.asset_id).filter(id => id);
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

    let varValue;
    let calculationMethod;

    if (historicalData.length > 0) {
      // Calculate portfolio returns
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

      if (portfolioReturns.length > 0) {
        // Calculate VAR (95%)
        const sortedReturns = [...portfolioReturns].sort((a, b) => a - b);
        const index = Math.floor((1 - 0.95) * sortedReturns.length);
        varValue = Math.abs(sortedReturns[index]);
        calculationMethod = 'HISTORICAL';
        console.log(`✓ VAR calculated: €${varValue.toFixed(4)} using ${portfolioReturns.length} historical returns`);
      } else {
        varValue = 0.01; // fallback
        calculationMethod = 'PARAMETRIC';
        console.log('⚠️  Using fallback VAR calculation');
      }
    } else {
      varValue = 0.01; // fallback
      calculationMethod = 'PARAMETRIC';
      console.log('⚠️  No historical data, using fallback VAR calculation');
    }

    // Save VAR to database
    await db.risk_metrics.create({
      portfolio_id: portfolio.portfolio_id,
      calculation_date: new Date(),
      metric_type: 'VAR',
      value: varValue,
      currency: 'EUR',
      confidence_level: 0.95,
      time_horizon_days: 1,
      calculation_method: calculationMethod,
      status: 'CALCULATED',
      created_by: 'system'
    });

    console.log(`💾 Saved VAR: €${varValue.toFixed(4)}`);

    // Run stress test
    console.log('\n🎯 Running stress test...');
    const scenario = await db.stress_scenarios.findOne({ where: { name: 'Global Equity Market Crash' } });

    if (scenario) {
      console.log(`Using scenario: ${scenario.name}`);

      // Calculate P&L impact
      let totalPnL = 0;
      const scenarioShocks = typeof scenario.market_shocks === 'string' ? JSON.parse(scenario.market_shocks) : scenario.market_shocks;

      positions.forEach(position => {
        const asset = position.asset;
        const quantity = position.quantity;
        const currentPrice = position.current_price || position.entry_price;
        const assetType = asset?.asset_type || 'EQUITY';

        let positionPnL = 0;

        console.log(`Position: ${asset?.symbol}, Type: ${assetType}, Quantity: ${quantity}, Price: ${currentPrice}`);

        if (assetType.toUpperCase() === 'EQUITY' || assetType.toUpperCase() === 'STOCK') {
          if (scenarioShocks?.equity) {
            positionPnL = quantity * currentPrice * scenarioShocks.equity;
            console.log(`Equity shock applied: ${scenarioShocks.equity} -> PnL: ${positionPnL}`);
          }
        }

        totalPnL += positionPnL;
      });

      // Save stress test result
      await db.risk_metrics.create({
        portfolio_id: portfolio.portfolio_id,
        calculation_date: new Date(),
        metric_type: 'STRESS_LOSS',
        value: Math.abs(totalPnL), // Store as positive loss
        currency: 'EUR',
        time_horizon_days: scenario.time_horizon_days,
        calculation_method: 'STRESS_TEST',
        status: 'CALCULATED',
        created_by: 'system',
        metadata: {
          scenario_id: scenario.scenario_id,
          scenario_name: scenario.name,
          market_shocks: scenario.market_shocks
        }
      });

      console.log(`💾 Saved STRESS_LOSS: €${Math.abs(totalPnL).toFixed(4)}`);
    } else {
      console.log('⚠️  No stress scenario found');
    }

    console.log('\n✅ Risk metrics recalculated successfully!');

  } catch (error) {
    console.error('❌ Error recalculating risk metrics:', error);
  } finally {
    await db.sequelize.close();
    process.exit(0);
  }
}

recalculateRiskMetrics();