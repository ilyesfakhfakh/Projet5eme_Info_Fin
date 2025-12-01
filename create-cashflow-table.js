const mysql = require('mysql2/promise');
require('dotenv').config({ path: './finserve-api/.env' });

async function createCashflowTable() {
  const connectionConfig = {
    host: process.env.HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB || 'finserve'
  };

  try {
    const connection = await mysql.createConnection(connectionConfig);
    console.log('Connected to MySQL successfully!');

    const createTableSQL = `CREATE TABLE cashflow_projections (
      cashflow_projection_id VARCHAR(36) NOT NULL PRIMARY KEY,
      portfolio_id VARCHAR(36) NOT NULL,
      projection_date DATETIME NOT NULL,
      frequency ENUM('MONTHLY', 'QUARTERLY') NOT NULL DEFAULT 'MONTHLY',
      horizon_years INT NOT NULL DEFAULT 5,
      cashflows TEXT NOT NULL,
      total_assets DECIMAL(20,2) NOT NULL DEFAULT 0,
      total_liabilities DECIMAL(20,2) NOT NULL DEFAULT 0,
      net_cashflow DECIMAL(20,2) NOT NULL DEFAULT 0,
      currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
      status ENUM('DRAFT', 'VALIDATED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
      created_by VARCHAR(36),
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      FOREIGN KEY (portfolio_id) REFERENCES portfolios(portfolio_id) ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL ON UPDATE CASCADE
    )`;

    await connection.execute(createTableSQL);
    console.log('✅ cashflow_projections table created successfully!');

    await connection.end();
  } catch (error) {
    console.error('❌ Error creating table:', error.message);
  }
}

createCashflowTable();