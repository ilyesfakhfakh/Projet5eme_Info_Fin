const mysql = require('mysql2/promise');
require('dotenv').config({ path: './finserve-api/.env' });

async function testConnection() {
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
    const [rows] = await connection.execute('SHOW TABLES');
    console.log('Tables in finserve database:');
    rows.forEach(row => {
      console.log('-', Object.values(row)[0]);
    });

    // Check portfolios table
    if (rows.some(row => Object.values(row)[0] === 'portfolios')) {
      const [portfolioRows] = await connection.execute('SELECT COUNT(*) as count FROM portfolios');
      console.log(`Portfolios table has ${portfolioRows[0].count} records`);
    }

    await connection.end();
  } catch (error) {
    console.error('MySQL connection failed:', error.message);
  }
}

testConnection();