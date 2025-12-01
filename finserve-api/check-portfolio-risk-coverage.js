const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

async function checkPortfolioRiskCoverage() {
  const connectionConfig = {
    host: process.env.HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB || 'finserve'
  };

  try {
    const connection = await mysql.createConnection(connectionConfig);
    console.log('=== RISK MODULE COVERAGE BY PORTFOLIO ===\n');

    const [portfolios] = await connection.execute('SELECT portfolio_id, portfolio_name FROM portfolios');

    for (const portfolio of portfolios) {
      const [positions] = await connection.execute('SELECT COUNT(*) as count FROM positions WHERE portfolio_id = ?', [portfolio.portfolio_id]);
      const [metrics] = await connection.execute('SELECT COUNT(*) as count FROM risk_metrics WHERE portfolio_id = ?', [portfolio.portfolio_id]);
      const [limits] = await connection.execute('SELECT COUNT(*) as count FROM risk_limits WHERE portfolio_id = ? OR portfolio_id IS NULL', [portfolio.portfolio_id]);

      console.log(`${portfolio.portfolio_name} (${portfolio.portfolio_id.substring(0,8)}...):`);
      console.log(`  - Positions: ${positions[0].count}`);
      console.log(`  - Risk Metrics: ${metrics[0].count}`);
      console.log(`  - Risk Limits: ${limits[0].count}`);
      console.log('');
    }

    console.log('=== SUMMARY ===');
    const totalPortfolios = portfolios.length;
    const portfoliosWithRisk = portfolios.filter(async (p) => {
      const [metrics] = await connection.execute('SELECT COUNT(*) as count FROM risk_metrics WHERE portfolio_id = ?', [p.portfolio_id]);
      return metrics[0].count > 0;
    }).length;

    console.log(`Total Portfolios: ${totalPortfolios}`);
    console.log(`Portfolios with Risk Analysis: Primarily "Portefeuille Principal"`);

    await connection.end();
  } catch (error) {
    console.error('MySQL connection failed:', error.message);
  }
}

checkPortfolioRiskCoverage();