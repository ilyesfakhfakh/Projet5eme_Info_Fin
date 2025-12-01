const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

async function verifyAlmTables() {
  const connectionConfig = {
    host: process.env.HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB || 'finserve'
  };

  try {
    const connection = await mysql.createConnection(connectionConfig);
    console.log('=== ALM TABLES VERIFICATION ===');

    const [tables] = await connection.execute('SHOW TABLES');
    const almTables = ['alm_positions', 'cashflow_projections', 'interest_rate_sensitivities', 'liquidity_gaps', 'yield_curves'];

    almTables.forEach(table => {
      const exists = tables.some(t => Object.values(t)[0] === table);
      console.log(`${table}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
    });

    console.log(`\nTotal ALM tables expected: ${almTables.length}`);
    const existingAlmTables = tables.filter(t => almTables.includes(Object.values(t)[0])).length;
    console.log(`ALM tables present: ${existingAlmTables}`);

    if (existingAlmTables === almTables.length) {
      console.log('\n🎉 All ALM tables are now present! ALM module should work.');
    } else {
      console.log('\n⚠️  Some ALM tables are still missing.');
    }

    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

verifyAlmTables();