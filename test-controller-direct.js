require('dotenv').config({ path: './finserve-api/.env' });
const db = require('./finserve-api/app/models');

async function testControllerDirect() {
  try {
    console.log('Testing controller directly...');

    await db.sequelize.authenticate();
    console.log('Database connected');

    // Check table structure
    const [columns] = await db.sequelize.query("PRAGMA table_info(yield_curves)");
    console.log('Table structure:', columns);

    // Check if created_by allows NULL
    const createdByColumn = columns.find(col => col.name === 'created_by');
    console.log('created_by column:', createdByColumn);

    if (createdByColumn && createdByColumn.notnull === 1) {
      console.log('created_by is NOT NULL, recreating table...');
      // Drop and recreate table with correct schema
      await db.sequelize.query("DROP TABLE yield_curves");
      await db.yield_curves.sync({ force: true });
      console.log('Table recreated with correct schema');
    }

    const YieldCurve = db.yield_curves;
    console.log('YieldCurve model:', !!YieldCurve);

    const payload = {
      curve_name: 'Test Curve Direct',
      currency: 'EUR',
      curve_type: 'GOVERNMENT',
      maturity_points: [{ maturity: 1, rate: 0.04 }]
    };

    console.log('Creating yield curve with:', payload);

    const result = await YieldCurve.create(payload);
    console.log('Success! Created:', result.toJSON());

  } catch (error) {
    console.error('Error:', error.message);
    console.error('Error name:', error.name);
    if (error.errors) {
      console.error('Validation/Constraint errors:');
      error.errors.forEach(err => {
        console.error(`- ${err.path}: ${err.message} (value: ${err.value})`);
      });
    }
    if (error.parent) {
      console.error('Parent error:', error.parent.message);
    }
    console.error('Full error object:', JSON.stringify(error, null, 2));
  } finally {
    await db.sequelize.close();
  }
}

testControllerDirect();