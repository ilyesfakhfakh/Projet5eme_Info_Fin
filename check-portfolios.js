require('dotenv').config({ path: './finserve-api/.env' });
const db = require('./finserve-api/app/models');

async function checkPortfolios() {
  try {
    console.log('Checking portfolios in database...');

    await db.sequelize.authenticate();
    console.log('Database connected');

    const portfolios = await db.portfolios.findAll({
      attributes: ['portfolio_id', 'portfolio_name', 'user_id'],
      limit: 5
    });

    console.log(`Found ${portfolios.length} portfolios:`);
    portfolios.forEach(portfolio => {
      console.log(`- ${portfolio.portfolio_id}: ${portfolio.portfolio_name} (user: ${portfolio.user_id})`);
    });

    if (portfolios.length > 0) {
      console.log(`\nUse portfolio_id: ${portfolios[0].portfolio_id} for testing`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await db.sequelize.close();
  }
}

checkPortfolios();