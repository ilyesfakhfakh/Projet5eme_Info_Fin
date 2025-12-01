async function createTestRiskLimits() {
  console.log('Creating test risk limits directly in database...');

  try {
    // Try to insert directly into database
    const db = require('./finserve-api/app/models');

    await db.sequelize.authenticate();
    console.log('Database connected');

    // Check if limits already exist
    const existingLimits = await db.risk_limits.findAll({
      where: { portfolio_id: 'b318b362-d33f-462f-bc7c-ed24caf9c6b0' }
    });

    if (existingLimits.length > 0) {
      console.log('Risk limits already exist for this portfolio');
      return;
    }

    // Create exposure limit (lower than current exposure of ~300k to trigger alert)
    await db.risk_limits.create({
      portfolio_id: 'b318b362-d33f-462f-bc7c-ed24caf9c6b0',
      limit_type: 'EXPOSURE',
      limit_value: 200000, // Should trigger alert since portfolio has ~300k exposure
      currency: 'EUR',
      time_horizon: 'DAILY',
      instrument_type: 'ALL',
      breach_action: 'ALERT',
      is_active: true,
      created_by: 'system'
    });

    // Create VaR limit (very low to trigger alert)
    await db.risk_limits.create({
      portfolio_id: 'b318b362-d33f-462f-bc7c-ed24caf9c6b0',
      limit_type: 'VAR',
      limit_value: 0.005, // 0.5% VaR limit - should trigger alert
      currency: 'EUR',
      time_horizon: 'DAILY',
      instrument_type: 'ALL',
      breach_action: 'ALERT',
      is_active: true,
      created_by: 'system'
    });

    console.log('Test risk limits created successfully!');
    console.log('- Exposure limit: 200,000 EUR (portfolio has ~300,000 EUR exposure)');
    console.log('- VaR limit: 0.005 (0.5% - should trigger with calculated VaR)');

  } catch (error) {
    console.error('Error creating limits directly:', error);
  }
}

createTestRiskLimits();