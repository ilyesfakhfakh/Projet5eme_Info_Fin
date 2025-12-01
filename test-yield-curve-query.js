const db = require('./finserve-api/app/models');

async function testYieldCurveQuery() {
  try {
    console.log('Testing yield curve query...');

    const curves = await db.yield_curves.findAll({
      where: { is_active: true }
    });

    console.log('Found curves:', curves.length);
    console.log('Curves:', curves);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.sequelize.close();
  }
}

testYieldCurveQuery();