// Test script to check yield curves in database
require('dotenv').config({ path: './finserve-api/.env' });
const db = require('./finserve-api/app/models');

async function checkYieldCurves() {
  try {
    await db.sequelize.authenticate();
    console.log('Connected to database');

    // Check if table exists
    const [results] = await db.sequelize.query("SELECT name FROM sqlite_master WHERE type='table' AND name='yield_curves'");
    console.log('Table exists:', results.length > 0);

    if (results.length > 0) {
      const curves = await db.yield_curves.findAll({
        where: { is_active: true },
        attributes: ['yield_curve_id', 'curve_name', 'currency', 'curve_type', 'valuation_date', 'maturity_points', 'interpolation_method', 'is_active', 'created_by', 'createdAt', 'updatedAt']
      });

      console.log('Found curves:', curves.length);
      curves.forEach(curve => {
        console.log('Curve:', curve.get({ plain: true }));
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.sequelize.close();
  }
}

checkYieldCurves();