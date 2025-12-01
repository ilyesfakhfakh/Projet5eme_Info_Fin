// Test direct creation of yield curve
require('dotenv').config({ path: './finserve-api/.env' });
const db = require('./finserve-api/app/models');

async function testDirectCreate() {
  try {
    await db.sequelize.authenticate();
    console.log('Connected to database');

    const payload = {
      curve_name: 'Test Curve Direct',
      currency: 'EUR',
      curve_type: 'GOVERNMENT',
      maturity_points: [{ maturity: 1, rate: 0.04 }],
      interpolation_method: 'LINEAR',
      created_by: 'dc25e004-bd97-4d59-a422-bd78851dace8'
    };

    console.log('Creating yield curve with payload:', payload);

    const yieldCurve = await db.yield_curves.create(payload);

    console.log('Success! Created yield curve:', yieldCurve.toJSON());

  } catch (error) {
    console.error('Error creating yield curve:', error);
    console.error('Error details:', error.errors || error.message);
  } finally {
    await db.sequelize.close();
  }
}

testDirectCreate();