const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

async function fixYieldCurveJson() {
  const connectionConfig = {
    host: process.env.HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB || 'finserve'
  };

  try {
    const connection = await mysql.createConnection(connectionConfig);
    console.log('=== FIXING YIELD CURVE JSON COLUMN ===');

    console.log('Converting maturity_points from TEXT to JSON...');
    await connection.execute('ALTER TABLE yield_curves MODIFY COLUMN maturity_points JSON NOT NULL');
    console.log('✅ Column type changed successfully!');

    const [desc] = await connection.execute('DESCRIBE yield_curves');
    const maturityCol = desc.find(col => col.Field === 'maturity_points');
    console.log(`New maturity_points type: ${maturityCol.Type}`);

    // Test that JSON parsing works
    const [testRow] = await connection.execute('SELECT maturity_points FROM yield_curves LIMIT 1');
    if (testRow.length > 0) {
      console.log('Testing JSON parsing...');
      const parsed = JSON.parse(testRow[0].maturity_points);
      console.log(`✅ JSON parsing works! Array length: ${parsed.length}`);
      console.log(`✅ Can map: ${typeof parsed.map === 'function'}`);
      console.log(`✅ Can sort: ${typeof parsed.sort === 'function'}`);
    }

    console.log('\n🎉 Yield curve JSON issue should now be resolved!');
    console.log('The ALM duration/convexity and sensitivity calculations should work.');

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixYieldCurveJson();