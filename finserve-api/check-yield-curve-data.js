const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

async function checkYieldCurveData() {
  const connectionConfig = {
    host: process.env.HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB || 'finserve'
  };

  try {
    const connection = await mysql.createConnection(connectionConfig);
    console.log('=== YIELD CURVE DATA ANALYSIS ===');

    const [rows] = await connection.execute('SELECT yield_curve_id, curve_name, maturity_points FROM yield_curves LIMIT 3');

    rows.forEach((row, index) => {
      console.log(`\nCurve ${index + 1}:`);
      console.log(`ID: ${row.yield_curve_id}`);
      console.log(`Name: ${row.curve_name}`);
      console.log(`Maturity Points Type: ${typeof row.maturity_points}`);
      console.log(`Maturity Points Raw: ${row.maturity_points}`);

      try {
        const parsed = JSON.parse(row.maturity_points);
        console.log(`Parsed Successfully: ${JSON.stringify(parsed, null, 2)}`);
        console.log(`Is Array: ${Array.isArray(parsed)}`);
        if (Array.isArray(parsed)) {
          console.log(`Array Length: ${parsed.length}`);
          console.log(`Can Map: ${typeof parsed.map === 'function'}`);
          console.log(`Can Sort: ${typeof parsed.sort === 'function'}`);
        }
      } catch (e) {
        console.log(`❌ Parse Error: ${e.message}`);
      }
    });

    console.log('\n=== DIAGNOSIS ===');
    console.log('The errors suggest maturity_points is not being parsed as an array.');
    console.log('This could be due to:');
    console.log('1. Data migrated incorrectly from SQLite to MySQL');
    console.log('2. JSON parsing issues in the API');
    console.log('3. Sequelize model configuration problems');

    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkYieldCurveData();