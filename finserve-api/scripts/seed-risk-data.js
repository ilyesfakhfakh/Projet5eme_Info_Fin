// Script to seed risk management data
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const db = require('../app/models');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function seedRiskData() {
  console.log(`${colors.cyan}╔═══════════════════════════════════════════════════════════╗`);
  console.log(`║  SEEDING RISK MANAGEMENT DATA                            ║`);
  console.log(`╚═══════════════════════════════════════════════════════════╝${colors.reset}\n`);

  try {
    await db.sequelize.authenticate();
    console.log(`${colors.green}✓${colors.reset} Database connection established\n`);

    // Get existing portfolios and users
    const portfolios = await db.portfolios.findAll({ limit: 2 });
    const users = await db.users.findAll({ limit: 2 });

    if (portfolios.length === 0 || users.length === 0) {
      console.log(`${colors.red}✗${colors.reset} No portfolios or users found. Please seed basic data first.`);
      return;
    }

    console.log(`${colors.blue}Seeding risk limits...${colors.reset}`);

    // Create sample risk limits
    const riskLimits = [
      {
        portfolio_id: portfolios[0].portfolio_id,
        limit_type: 'EXPOSURE',
        limit_value: 1000000,
        currency: 'EUR',
        time_horizon: 'DAILY',
        instrument_type: 'ALL',
        breach_action: 'ALERT',
        is_active: true,
        created_by: users[0].user_id
      },
      {
        portfolio_id: portfolios[0].portfolio_id,
        limit_type: 'VAR',
        limit_value: 50000,
        currency: 'EUR',
        time_horizon: 'DAILY',
        confidence_level: 0.95,
        instrument_type: 'ALL',
        breach_action: 'ALERT',
        is_active: true,
        created_by: users[0].user_id
      },
      {
        limit_type: 'EXPOSURE',
        limit_value: 5000000,
        currency: 'EUR',
        time_horizon: 'DAILY',
        instrument_type: 'ALL',
        breach_action: 'RESTRICT',
        is_active: true,
        created_by: users[0].user_id
      }
    ];

    for (const limit of riskLimits) {
      try {
        await db.risk_limits.create(limit);
        console.log(`${colors.green}✓${colors.reset} Created risk limit: ${limit.limit_type} - ${limit.limit_value} ${limit.currency}`);
      } catch (error) {
        console.log(`${colors.red}✗${colors.reset} Error creating limit: ${error.message}`);
      }
    }

    console.log(`\n${colors.blue}Seeding comprehensive stress scenarios...${colors.reset}`);

    // Create comprehensive stress scenarios covering all major risk types
    const stressScenarios = [
      {
        name: 'Global Equity Market Crash',
        description: 'Simulates a severe 30% drop in global equity markets with contagion effects',
        scenario_type: 'HYPOTHETICAL',
        market_shocks: {
          equity: -0.30,
          rates: 0.015,
          fx: { USD: -0.08, GBP: -0.06, JPY: 0.05, CHF: 0.03 },
          commodities: { OIL: -0.25, GOLD: 0.15, COPPER: -0.20 }
        },
        time_horizon_days: 5,
        probability: 0.02,
        is_active: true,
        created_by: users[0].user_id
      },
      {
        name: 'Interest Rate Hike Cycle',
        description: 'Simulates aggressive 300bps interest rate increases over 12 months',
        scenario_type: 'HYPOTHETICAL',
        market_shocks: {
          rates: 0.03,
          equity: -0.15,
          bonds: -0.08,
          fx: { USD: 0.02, GBP: -0.01 }
        },
        time_horizon_days: 252,
        probability: 0.08,
        is_active: true,
        created_by: users[0].user_id
      },
      {
        name: 'FX Crisis - EUR/USD Devaluation',
        description: 'Simulates a 25% devaluation of EUR against USD with spillover effects',
        scenario_type: 'HYPOTHETICAL',
        market_shocks: {
          fx: { USD: -0.25, GBP: -0.15, JPY: 0.08 },
          equity: -0.12,
          commodities: { OIL: 0.20, GOLD: 0.10 }
        },
        time_horizon_days: 30,
        probability: 0.04,
        is_active: true,
        created_by: users[0].user_id
      },
      {
        name: 'Commodity Price Shock - Oil Spike',
        description: 'Simulates a 100% increase in oil prices due to supply disruption',
        scenario_type: 'HYPOTHETICAL',
        market_shocks: {
          commodities: { OIL: 1.0, GAS: 0.80, COAL: 0.60 },
          equity: -0.08,
          inflation: 0.025,
          rates: 0.008
        },
        time_horizon_days: 90,
        probability: 0.06,
        is_active: true,
        created_by: users[0].user_id
      },
      {
        name: 'Credit Spread Widening',
        description: 'Simulates a 200bps widening of corporate credit spreads',
        scenario_type: 'HYPOTHETICAL',
        market_shocks: {
          credit_spreads: 0.02,
          equity: -0.10,
          bonds: -0.05,
          rates: 0.005
        },
        time_horizon_days: 20,
        probability: 0.07,
        is_active: true,
        created_by: users[0].user_id
      },
      {
        name: 'Liquidity Crisis',
        description: 'Simulates severe liquidity constraints with 50% reduction in market depth',
        scenario_type: 'HYPOTHETICAL',
        market_shocks: {
          liquidity: -0.50,
          equity: -0.18,
          fx: { USD: -0.12, GBP: -0.10 },
          volatility: 0.25
        },
        time_horizon_days: 3,
        probability: 0.03,
        is_active: true,
        created_by: users[0].user_id
      },
      {
        name: 'Reverse Stress - Portfolio Survival',
        description: 'Reverse stress test: What market move would cause 50% portfolio loss?',
        scenario_type: 'REVERSE_STRESS',
        market_shocks: {
          equity: -0.35,
          rates: 0.025,
          fx: { USD: -0.20 }
        },
        time_horizon_days: 10,
        probability: null, // Reverse stress doesn't have probability
        is_active: true,
        created_by: users[0].user_id
      },
      {
        name: 'Historical - COVID-19 Crash',
        description: 'Based on March 2020 market crash with 35% equity drop',
        scenario_type: 'HISTORICAL',
        market_shocks: {
          equity: -0.35,
          rates: -0.005,
          fx: { USD: 0.03, GBP: -0.02 },
          volatility: 0.40
        },
        time_horizon_days: 30,
        probability: 0.01,
        is_active: true,
        created_by: users[0].user_id
      },
      {
        name: 'Geopolitical Crisis',
        description: 'Simulates geopolitical tension with 15% equity drop and safe-haven flows',
        scenario_type: 'HYPOTHETICAL',
        market_shocks: {
          equity: -0.15,
          fx: { USD: 0.05, JPY: 0.03, CHF: 0.04, GBP: -0.02 },
          commodities: { GOLD: 0.12, OIL: 0.08 },
          volatility: 0.20
        },
        time_horizon_days: 15,
        probability: 0.05,
        is_active: true,
        created_by: users[0].user_id
      },
      {
        name: 'Inflation Shock',
        description: 'Simulates unexpected 5% inflation spike with monetary policy response',
        scenario_type: 'HYPOTHETICAL',
        market_shocks: {
          inflation: 0.05,
          rates: 0.025,
          equity: -0.08,
          bonds: -0.12,
          commodities: { OIL: 0.15, GOLD: 0.08 }
        },
        time_horizon_days: 180,
        probability: 0.04,
        is_active: true,
        created_by: users[0].user_id
      }
    ];

    for (const scenario of stressScenarios) {
      try {
        await db.stress_scenarios.create(scenario);
        console.log(`${colors.green}✓${colors.reset} Created stress scenario: ${scenario.name}`);
      } catch (error) {
        console.log(`${colors.red}✗${colors.reset} Error creating scenario: ${error.message}`);
      }
    }

    console.log(`\n${colors.blue}Seeding sample risk metrics...${colors.reset}`);

    // Create sample risk metrics
    const riskMetrics = [
      {
        portfolio_id: portfolios[0].portfolio_id,
        calculation_date: new Date(),
        metric_type: 'VAR',
        value: 45000,
        currency: 'EUR',
        confidence_level: 0.95,
        time_horizon_days: 1,
        calculation_method: 'PARAMETRIC',
        status: 'CALCULATED',
        created_by: users[0].user_id
      },
      {
        portfolio_id: portfolios[0].portfolio_id,
        calculation_date: new Date(),
        metric_type: 'EXPOSURE',
        value: 750000,
        currency: 'EUR',
        time_horizon_days: 1,
        calculation_method: 'DIRECT',
        status: 'CALCULATED',
        created_by: users[0].user_id
      }
    ];

    for (const metric of riskMetrics) {
      try {
        await db.risk_metrics.create(metric);
        console.log(`${colors.green}✓${colors.reset} Created risk metric: ${metric.metric_type} - ${metric.value} ${metric.currency}`);
      } catch (error) {
        console.log(`${colors.red}✗${colors.reset} Error creating metric: ${error.message}`);
      }
    }

    console.log(`\n${colors.green}✓ Risk data seeding completed successfully!${colors.reset}`);

  } catch (error) {
    console.error(`${colors.red}Error seeding risk data:${colors.reset}`, error);
  } finally {
    await db.sequelize.close();
    process.exit(0);
  }
}

seedRiskData();