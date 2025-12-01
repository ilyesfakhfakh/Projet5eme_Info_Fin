const db = require('./app/models');

async function setupRiskLimits() {
  try {
    console.log('🔄 Connecting to database...');
    await db.sequelize.authenticate();
    console.log('✅ Database connected');

    // Find any existing user
    let user = await db.users.findOne();
    if (!user) {
      console.log('❌ No users found. Please run seed-auth.js first.');
      return;
    }
    console.log(`👤 Using user: ${user.username} (ID: ${user.user_id})`);

    // Get all portfolios for this user
    const portfolios = await db.portfolios.findAll({
      where: { user_id: user.user_id }
    });

    console.log(`📁 Setting up risk limits for ${portfolios.length} portfolios:`);

    for (const portfolio of portfolios) {
      console.log(`\n📊 Portfolio: ${portfolio.portfolio_name} (ID: ${portfolio.portfolio_id})`);
      console.log(`   Current P&L: ${portfolio.profit_loss} (${portfolio.profit_loss_percentage}%)`);

      // Check existing limits
      const existingLimits = await db.risk_limits.findAll({
        where: { portfolio_id: portfolio.portfolio_id, is_active: true }
      });

      console.log(`   Existing limits: ${existingLimits.length}`);

      // Set up P&L limit if not exists
      const pnlLimitExists = existingLimits.find(l => l.limit_type === 'PNL_MAX');
      if (!pnlLimitExists) {
        // Set limit at 50% of current absolute P&L value, but at least 1000
        const currentPnLAbs = Math.abs(portfolio.profit_loss);
        const limitValue = Math.max(currentPnLAbs * 0.5, 1000);

        console.log(`   Creating P&L limit: ${limitValue} ${portfolio.base_currency}`);

        await db.risk_limits.create({
          portfolio_id: portfolio.portfolio_id,
          limit_type: 'PNL_MAX',
          limit_value: limitValue,
          instrument_type: 'ALL',
          time_horizon: 'DAILY',
          breach_action: 'ALERT',
          currency: portfolio.base_currency,
          is_active: true,
          created_by: user.user_id
        });
      } else {
        console.log(`   P&L limit already exists: ${pnlLimitExists.limit_value} ${portfolio.base_currency}`);
      }

      // Set up exposure limit if not exists
      const exposureLimitExists = existingLimits.find(l => l.limit_type === 'EXPOSURE');
      if (!exposureLimitExists) {
        // Set exposure limit at 2x current total value
        const limitValue = Math.abs(portfolio.total_value) * 2;

        console.log(`   Creating exposure limit: ${limitValue} ${portfolio.base_currency}`);

        await db.risk_limits.create({
          portfolio_id: portfolio.portfolio_id,
          limit_type: 'EXPOSURE',
          limit_value: limitValue,
          instrument_type: 'ALL',
          time_horizon: 'DAILY',
          breach_action: 'ALERT',
          currency: portfolio.base_currency,
          is_active: true,
          created_by: user.user_id
        });
      } else {
        console.log(`   Exposure limit already exists: ${exposureLimitExists.limit_value} ${portfolio.base_currency}`);
      }

      // Set up VaR limit if not exists
      const varLimitExists = existingLimits.find(l => l.limit_type === 'VAR');
      if (!varLimitExists) {
        // Set VaR limit at 5% of portfolio value
        const limitValue = Math.abs(portfolio.total_value) * 0.05;

        console.log(`   Creating VaR limit: ${limitValue} ${portfolio.base_currency}`);

        await db.risk_limits.create({
          portfolio_id: portfolio.portfolio_id,
          limit_type: 'VAR',
          limit_value: limitValue,
          instrument_type: 'ALL',
          time_horizon: 'DAILY',
          breach_action: 'ALERT',
          currency: portfolio.base_currency,
          is_active: true,
          created_by: user.user_id
        });
      } else {
        console.log(`   VaR limit already exists: ${varLimitExists.limit_value} ${portfolio.base_currency}`);
      }
    }

    console.log('\n🔍 Running risk monitoring for all portfolios...');

    // Run risk monitoring for each portfolio
    for (const portfolio of portfolios) {
      console.log(`\n🔍 Monitoring portfolio: ${portfolio.portfolio_name}`);

      const mockReq = {
        query: { portfolio_id: portfolio.portfolio_id },
        user: { user_id: user.user_id }
      };
      const mockRes = {
        json: (data) => {
          if (data.data.alerts_generated > 0) {
            console.log(`   🚨 ${data.data.alerts_generated} alerts generated`);
          } else {
            console.log(`   ✅ No breaches detected`);
          }
          return data;
        },
        status: (code) => ({
          json: (data) => {
            console.log(`   ❌ Monitoring failed (${code}):`, data.message);
            return data;
          }
        })
      };

      await require('./app/controllers/risk.controller').monitorRiskLimits(mockReq, mockRes);
    }

    // Final check
    console.log('\n📋 Final status:');
    for (const portfolio of portfolios) {
      const alerts = await db.risk_alerts.findAll({
        where: { portfolio_id: portfolio.portfolio_id, status: 'ACTIVE' }
      });
      console.log(`   ${portfolio.portfolio_name}: ${alerts.length} active alerts`);
    }

    console.log('\n🎉 Risk limits setup completed!');

  } catch (error) {
    console.error('❌ Risk limits setup failed:', error);
    process.exit(1);
  }
}

setupRiskLimits();