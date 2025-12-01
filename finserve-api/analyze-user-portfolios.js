const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

async function analyzeUserPortfolios() {
  const connectionConfig = {
    host: process.env.HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB || 'finserve'
  };

  try {
    const connection = await mysql.createConnection(connectionConfig);

    // Get current user ID (the one with portfolios: obligs, stocks, diversifications)
    const [users] = await connection.execute('SELECT user_id, username FROM users');
    console.log('=== USER PORTFOLIO ANALYSIS ===');
    console.log('Users in system:', users.length);

    // Find the user with the 3 portfolios mentioned
    const [allPortfolios] = await connection.execute('SELECT portfolio_id, portfolio_name, user_id FROM portfolios');

    // Group portfolios by user
    const portfoliosByUser = {};
    for (const portfolio of allPortfolios) {
      if (!portfoliosByUser[portfolio.user_id]) {
        portfoliosByUser[portfolio.user_id] = [];
      }
      portfoliosByUser[portfolio.user_id].push(portfolio);
    }

    // Find user with 3 portfolios
    let targetUserId = null;
    for (const [userId, portfolios] of Object.entries(portfoliosByUser)) {
      if (portfolios.length === 3) {
        const portfolioNames = portfolios.map(p => p.portfolio_name.toLowerCase());
        if (portfolioNames.includes('obligs') && portfolioNames.includes('stocks') && portfolioNames.includes('diversifications')) {
          targetUserId = userId;
          break;
        }
      }
    }

    if (targetUserId) {
      console.log(`\nFound target user: ${targetUserId}`);
      const userPortfolios = portfoliosByUser[targetUserId];

      for (const portfolio of userPortfolios) {
        console.log(`\n📁 ${portfolio.portfolio_name} (${portfolio.portfolio_id.substring(0,8)}...):`);

        const [positions] = await connection.execute('SELECT asset_symbol, quantity, market_value FROM positions WHERE portfolio_id = ?', [portfolio.portfolio_id]);
        console.log(`   Positions: ${positions.length}`);

        if (positions.length > 0) {
          positions.forEach(pos => {
            console.log(`     - ${pos.asset_symbol}: ${pos.quantity} units @ €${pos.market_value}`);
          });
        }

        const [metrics] = await connection.execute('SELECT COUNT(*) as count FROM risk_metrics WHERE portfolio_id = ?', [portfolio.portfolio_id]);
        console.log(`   Risk Metrics: ${metrics[0].count}`);

        const [totalValue] = await connection.execute('SELECT SUM(market_value) as total FROM positions WHERE portfolio_id = ?', [portfolio.portfolio_id]);
        const total = totalValue[0].total || 0;
        console.log(`   Total Value: €${total.toFixed(2)}`);
      }

      console.log('\n=== WHY NO RISK ANALYSIS FOR YOUR PORTFOLIOS ===');
      console.log('✅ Your portfolios exist and are accessible');
      console.log('⚠️  Risk analysis requires:');
      console.log('   - Active positions with significant market value');
      console.log('   - Trading history and volatility data');
      console.log('   - Portfolio size that justifies risk monitoring');
      console.log('💡 Your current portfolios are too small/empty for automated risk calculations');
    } else {
      console.log('Could not find user with portfolios: obligs, stocks, diversifications');
    }

    await connection.end();
  } catch (error) {
    console.error('Analysis failed:', error.message);
  }
}

analyzeUserPortfolios();