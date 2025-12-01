const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

async function checkAllTables() {
  const connectionConfig = {
    host: process.env.HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB || 'finserve'
  };

  try {
    const connection = await mysql.createConnection(connectionConfig);
    console.log('Connected to MySQL successfully!');

    // Check if tables exist
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('\nTable record counts:');
    for (const table of tables) {
      const tableName = Object.values(table)[0];
      try {
        const [count] = await connection.execute(`SELECT COUNT(*) as count FROM \`${tableName}\``);
        console.log(`${tableName}: ${count[0].count} records`);
      } catch (err) {
        console.log(`${tableName}: Error - ${err.message}`);
      }
    }

    await connection.end();
  } catch (error) {
    console.error('MySQL connection failed:', error.message);
  }
}

checkAllTables();