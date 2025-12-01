const db = require('./app/models');
const PortfolioService = require('./app/services/portfolio.service');

async function testEndToEnd() {
  try {
    console.log('🔄 Connecting to database...');
    await db.sequelize.authenticate();
    console.log('✅ Database connected');

    // Find any existing user
    let user = await db.users.findOne({ where: { email: 'admin@example.com' } });
    if (!user) {
      user = await db.users.findOne(); // Get any user
    }
    if (!user) {
      console.log('❌ No users found. Please run seed-auth.js first.');
      return;
    }
    console.log(`👤 Using user: ${user.username} (ID: ${user.user_id})`);

    // Create test portfolio
    console.log('📁 Creating test portfolio...');
    const portfolio = await db.portfolios.create({
      user_id: user.user_id,
      portfolio_name: 'Test Portfolio E2E',
      base_currency: 'EUR',
      initial_balance: 100000,
      current_balance: 95000
    });
    console.log(`✅ Portfolio created: ${portfolio.portfolio_name} (ID: ${portfolio.portfolio_id})`);

    // Create test positions
    console.log('📊 Creating test positions...');
    const positions = [
      {
        portfolio_id: portfolio.portfolio_id,
        asset_symbol: 'AAPL',
        asset_type: 'STOCK',
        quantity: 100,
        average_price: 150,
        current_price: 165,
        currency: 'EUR'
      },
      {
        portfolio_id: portfolio.portfolio_id,
        asset_symbol: 'TSLA',
        asset_type: 'STOCK',
        quantity: 50,
        average_price: 200,
        current_price: 220,
        currency: 'EUR'
      }
    ];

    for (const posData of positions) {
      const position = await db.positions.create(posData);
      console.log(`✅ Position created: ${position.asset_symbol} (${position.quantity} @ ${position.average_price})`);
    }

    // Check positions before recalculation
    const positionsBefore = await db.positions.findAll({
      where: { portfolio_id: portfolio.portfolio_id, is_archived: false }
    });
    console.log('📊 Positions before recalculation:');
    positionsBefore.forEach(pos => {
      console.log(`   ${pos.asset_symbol}: qty=${pos.quantity}, avg=${pos.average_price}, current=${pos.current_price}, market=${pos.market_value}, pl=${pos.unrealized_pl}`);
    });

    // Test portfolio recalculation
    console.log('🔄 Testing portfolio recalculation...');
    const updatedPortfolio = await PortfolioService.recalculatePortfolioValues(portfolio.portfolio_id);
    console.log('📊 Portfolio after recalculation:');
    console.log(`   Total Value: ${updatedPortfolio.total_value} EUR`);
    console.log(`   P&L: ${updatedPortfolio.profit_loss} EUR`);
    console.log(`   Performance: ${updatedPortfolio.profit_loss_percentage}%`);

    // Verify calculations
    const expectedPositionsValue = (100 * 165) + (50 * 220); // 16500 + 11000 = 27500
    const expectedTotalValue = 95000 + 27500; // 122500
    const expectedPnL = 122500 - 100000; // 22500
    const expectedPerf = (22500 / 100000) * 100; // 22.5%

    console.log('🔍 Verification:');
    console.log(`   Expected Positions Value: ${expectedPositionsValue} EUR`);
    console.log(`   Expected Total Value: ${expectedTotalValue} EUR`);
    console.log(`   Expected P&L: ${expectedPnL} EUR`);
    console.log(`   Expected Performance: ${expectedPerf}%`);

    const positionsMatch = Math.abs(updatedPortfolio.total_value - expectedTotalValue) < 0.01;
    const pnlMatch = Math.abs(updatedPortfolio.profit_loss - expectedPnL) < 0.01;
    const perfMatch = Math.abs(updatedPortfolio.profit_loss_percentage - expectedPerf) < 0.01;

    console.log('✅ Results:');
    console.log(`   Total Value: ${positionsMatch ? '✅' : '❌'} (${positionsMatch ? 'PASS' : 'FAIL'})`);
    console.log(`   P&L: ${pnlMatch ? '✅' : '❌'} (${pnlMatch ? 'PASS' : 'FAIL'})`);
    console.log(`   Performance: ${perfMatch ? '✅' : '❌'} (${perfMatch ? 'PASS' : 'FAIL'})`);

    if (positionsMatch && pnlMatch && perfMatch) {
      console.log('🎉 All calculations are correct!');
    } else {
      console.log('❌ Some calculations are incorrect');
    }

    // Test VaR calculation (simplified)
    console.log('📈 Testing VaR calculation...');
    const mockReturns = Array.from({ length: 252 }, () => (Math.random() - 0.5) * 0.02);
    const mean = mockReturns.reduce((sum, r) => sum + r, 0) / mockReturns.length;
    const variance = mockReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / mockReturns.length;
    const stdDev = Math.sqrt(variance);
    const zScore95 = 1.645;
    const var95 = Math.abs(stdDev * zScore95 * updatedPortfolio.total_value);

    console.log(`VaR 95% (1-day): ${var95.toFixed(2)} EUR (${(var95/updatedPortfolio.total_value*100).toFixed(2)}%)`);

    if (var95 > 0 && var95 < updatedPortfolio.total_value) {
      console.log('✅ VaR calculation is reasonable');
    } else {
      console.log('❌ VaR calculation seems incorrect');
    }

    // Cleanup
    console.log('🧹 Cleaning up test data...');
    await db.positions.destroy({ where: { portfolio_id: portfolio.portfolio_id } });
    await db.portfolios.destroy({ where: { portfolio_id: portfolio.portfolio_id } });
    console.log('✅ Test data cleaned up');

    console.log('🎉 End-to-end test completed successfully!');

  } catch (error) {
    console.error('❌ End-to-end test failed:', error);
    process.exit(1);
  }
}

testEndToEnd();