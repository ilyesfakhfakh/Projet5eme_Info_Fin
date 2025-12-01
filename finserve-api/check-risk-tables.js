const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

async function checkRiskTables() {
  const connectionConfig = {
    host: process.env.HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB || 'finserve'
  };

  try {
    const connection = await mysql.createConnection(connectionConfig);
    console.log('Risk module table counts:');

    const tables = ['risk_alerts', 'risk_limits', 'risk_metrics', 'stress_scenarios', 'interest_rate_sensitivities', 'liquidity_gaps'];

    for (const table of tables) {
      try {
        const [count] = await connection.execute(`SELECT COUNT(*) as count FROM \`${table}\``);
        console.log(`${table}: ${count[0].count} records`);
      } catch (err) {
        console.log(`${table}: Error - ${err.message}`);
      }
    }

    // Check what stress scenarios exist
    if (tables.includes('stress_scenarios')) {
      const [scenarios] = await connection.execute('SELECT name, description FROM stress_scenarios');
      console.log('\nStress Scenarios:');
      scenarios.forEach(scenario => {
        console.log(`- ${scenario.name}: ${scenario.description}`);
      });
    }

    await connection.end();
  } catch (error) {
    console.error('MySQL connection failed:', error.message);
  }
}

checkRiskTables();