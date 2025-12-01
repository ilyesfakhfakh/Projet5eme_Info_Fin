// Test script for risk management APIs
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

async function testRiskAPIs() {
  console.log(`${colors.cyan}╔═══════════════════════════════════════════════════════════╗`);
  console.log(`║  TESTING RISK MANAGEMENT APIs                           ║`);
  console.log(`╚═══════════════════════════════════════════════════════════╝${colors.reset}\n`);

  try {
    await db.sequelize.authenticate();
    console.log(`${colors.green}✓${colors.reset} Database connection established\n`);

    // Check if risk tables exist
    console.log(`${colors.blue}Checking risk tables...${colors.reset}`);

    const riskTables = ['risk_limits', 'risk_metrics', 'risk_alerts', 'risk_logs', 'stress_scenarios'];

    for (const table of riskTables) {
      try {
        const [result] = await db.sequelize.query(`SELECT name FROM sqlite_master WHERE type='table' AND name='${table}'`);
        if (result.length > 0) {
          console.log(`${colors.green}✓${colors.reset} Table '${table}' exists`);
        } else {
          console.log(`${colors.red}✗${colors.reset} Table '${table}' does not exist`);
        }
      } catch (error) {
        console.log(`${colors.red}✗${colors.reset} Error checking table '${table}': ${error.message}`);
      }
    }

    console.log(`\n${colors.blue}Checking data in risk tables...${colors.reset}`);

    // Check data in each table
    for (const table of riskTables) {
      try {
        const [rows] = await db.sequelize.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = rows[0].count;
        console.log(`${colors.yellow}${table}:${colors.reset} ${count} records`);
      } catch (error) {
        console.log(`${colors.red}${table}:${colors.reset} Error - ${error.message}`);
      }
    }

    // Test exposure calculation
    console.log(`\n${colors.blue}Testing exposure calculation...${colors.reset}`);

    try {
      // Get some test data
      const portfolios = await db.portfolios.findAll({ limit: 1 });
      const positions = await db.positions.findAll({ limit: 5 });

      console.log(`${colors.yellow}Found ${portfolios.length} portfolios and ${positions.length} positions${colors.reset}`);

      if (positions.length > 0) {
        console.log(`${colors.green}✓${colors.reset} Position data available for exposure calculations`);
      } else {
        console.log(`${colors.yellow}⚠${colors.reset} No position data found - exposure calculations will return empty results`);
      }

    } catch (error) {
      console.log(`${colors.red}✗${colors.reset} Error testing exposure calculation: ${error.message}`);
    }

    // Test risk limits
    console.log(`\n${colors.blue}Testing risk limits...${colors.reset}`);

    try {
      const limits = await db.risk_limits.findAll({ limit: 5 });
      console.log(`${colors.yellow}Found ${limits.length} risk limits${colors.reset}`);

      if (limits.length === 0) {
        console.log(`${colors.yellow}⚠${colors.reset} No risk limits configured - frontend will show empty limits table`);
      }

    } catch (error) {
      console.log(`${colors.red}✗${colors.reset} Error testing risk limits: ${error.message}`);
    }

    // Test risk metrics
    console.log(`\n${colors.blue}Testing risk metrics...${colors.reset}`);

    try {
      const metrics = await db.risk_metrics.findAll({ limit: 5 });
      console.log(`${colors.yellow}Found ${metrics.length} risk metrics${colors.reset}`);

      if (metrics.length === 0) {
        console.log(`${colors.yellow}⚠${colors.reset} No risk metrics calculated - frontend will show 'No risk metrics calculated yet'`);
      }

    } catch (error) {
      console.log(`${colors.red}✗${colors.reset} Error testing risk metrics: ${error.message}`);
    }

    // Test alerts
    console.log(`\n${colors.blue}Testing risk alerts...${colors.reset}`);

    try {
      const alerts = await db.risk_alerts.findAll({ limit: 5 });
      console.log(`${colors.yellow}Found ${alerts.length} risk alerts${colors.reset}`);

      if (alerts.length === 0) {
        console.log(`${colors.yellow}⚠${colors.reset} No risk alerts - frontend will show 'No active alerts'`);
      }

    } catch (error) {
      console.log(`${colors.red}✗${colors.reset} Error testing risk alerts: ${error.message}`);
    }

    console.log(`\n${colors.cyan}API Test Summary:${colors.reset}`);
    console.log(`${colors.yellow}If frontend shows empty data, you may need to:${colors.reset}`);
    console.log(`1. Run database migration: ${colors.green}npm run migrate:with-risk${colors.reset}`);
    console.log(`2. Seed risk data: ${colors.green}npm run seed:risk${colors.reset}`);
    console.log(`3. Check browser console for API errors (authentication, CORS, etc.)`);
    console.log(`4. Ensure you're logged in with proper permissions`);

  } catch (error) {
    console.error(`${colors.red}Error testing risk APIs:${colors.reset}`, error);
  } finally {
    await db.sequelize.close();
    process.exit(0);
  }
}

testRiskAPIs();