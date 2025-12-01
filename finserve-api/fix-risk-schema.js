// Force recreate risk tables with correct schema
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const db = require('./app/models');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function fixRiskSchema() {
  console.log(`${colors.cyan}╔═══════════════════════════════════════════════════════════╗`);
  console.log(`║  FIXING RISK TABLES SCHEMA                              ║`);
  console.log(`╚═══════════════════════════════════════════════════════════╝${colors.reset}\n`);

  try {
    await db.sequelize.authenticate();
    console.log(`${colors.green}✓${colors.reset} Database connection established\n`);

    console.log(`${colors.blue}Dropping existing risk tables...${colors.reset}`);

    // Drop tables in correct order (reverse dependencies)
    const tablesToDrop = [
      'risk_logs',
      'risk_alerts',
      'risk_limits',
      'risk_metrics',
      'stress_scenarios'
    ];

    for (const table of tablesToDrop) {
      try {
        await db.sequelize.query(`DROP TABLE IF EXISTS \`${table}\``);
        console.log(`${colors.yellow}Dropped table: ${table}${colors.reset}`);
      } catch (error) {
        console.log(`${colors.red}Warning dropping ${table}: ${error.message}${colors.reset}`);
      }
    }

    console.log(`\n${colors.blue}Recreating risk tables with correct schema...${colors.reset}`);

    // Force sync the risk models
    await db.risk_limits.sync({ force: true });
    console.log(`${colors.green}✓${colors.reset} Created risk_limits table`);

    await db.risk_metrics.sync({ force: true });
    console.log(`${colors.green}✓${colors.reset} Created risk_metrics table`);

    await db.risk_alerts.sync({ force: true });
    console.log(`${colors.green}✓${colors.reset} Created risk_alerts table`);

    await db.risk_logs.sync({ force: true });
    console.log(`${colors.green}✓${colors.reset} Created risk_logs table`);

    await db.stress_scenarios.sync({ force: true });
    console.log(`${colors.green}✓${colors.reset} Created stress_scenarios table`);

    console.log(`\n${colors.blue}Seeding risk data...${colors.reset}`);

    // Seed some basic data
    const users = await db.users.findAll({ limit: 1 });
    const portfolios = await db.portfolios.findAll({ limit: 1 });

    if (users.length > 0 && portfolios.length > 0) {
      // Create sample risk limits
      await db.risk_limits.create({
        portfolio_id: portfolios[0].portfolio_id,
        limit_type: 'EXPOSURE',
        limit_value: 1000000,
        currency: 'EUR',
        time_horizon: 'DAILY',
        instrument_type: 'ALL',
        breach_action: 'ALERT',
        is_active: true,
        created_by: users[0].user_id
      });

      await db.risk_limits.create({
        limit_type: 'EXPOSURE',
        limit_value: 5000000,
        currency: 'EUR',
        time_horizon: 'DAILY',
        instrument_type: 'ALL',
        breach_action: 'RESTRICT',
        is_active: true,
        created_by: users[0].user_id
      });

      console.log(`${colors.green}✓${colors.reset} Created sample risk limits`);

      // Create stress scenarios
      await db.stress_scenarios.create({
        name: 'Equity Market Crash',
        description: 'Simulates a 20% drop in global equity markets',
        scenario_type: 'HYPOTHETICAL',
        market_shocks: JSON.stringify({
          equity: -0.20,
          rates: 0.01,
          fx: { USD: -0.05, GBP: -0.03 }
        }),
        time_horizon_days: 1,
        probability: 0.05,
        is_active: true,
        created_by: users[0].user_id
      });

      console.log(`${colors.green}✓${colors.reset} Created stress scenarios`);
    }

    console.log(`\n${colors.green}🎉 Risk schema fixed successfully!${colors.reset}`);
    console.log(`${colors.cyan}You can now restart the server and test the risk module.${colors.reset}`);

  } catch (error) {
    console.error(`${colors.red}Error fixing risk schema:${colors.reset}`, error);
  } finally {
    await db.sequelize.close();
    process.exit(0);
  }
}

fixRiskSchema();