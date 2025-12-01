const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

async function checkTableStructure() {
  const connectionConfig = {
    host: process.env.HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB || 'finserve'
  };

  try {
    const connection = await mysql.createConnection(connectionConfig);
    console.log('=== YIELD CURVES TABLE STRUCTURE ===');

    const [desc] = await connection.execute('DESCRIBE yield_curves');
    desc.forEach(col => {
      console.log(`${col.Field}: ${col.Type}`);
    });

    console.log('\n=== PROBLEM IDENTIFIED ===');
    console.log('The maturity_points column is likely stored as TEXT instead of JSON.');
    console.log('In MySQL, TEXT fields are not automatically parsed by Sequelize.');
    console.log('We need to convert TEXT to JSON type for proper parsing.');

    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkTableStructure();