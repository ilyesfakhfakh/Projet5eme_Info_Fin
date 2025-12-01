require('dotenv').config({ path: './finserve-api/.env' });
const db = require('./finserve-api/app/models');

async function checkPortfolioPositions() {
  try {
    console.log('Checking portfolio positions...');

    await db.sequelize.authenticate();
    console.log('Database connected');

    const portfolioId = 'e9658c59-31bb-4e55-a91f-6b70cb8b8512';

    // Get portfolio with positions
    const portfolio = await db.portfolios.findByPk(portfolioId, {
      include: [{
        model: db.positions,
        as: 'positions',
        where: { is_archived: false },
        required: false
      }]
    });

    if (!portfolio) {
      console.log('Portfolio not found');
      return;
    }

    console.log(`Portfolio: ${portfolio.portfolio_name}`);
    console.log(`Base currency: ${portfolio.base_currency}`);
    console.log(`Positions count: ${portfolio.positions ? portfolio.positions.length : 0}`);

    if (portfolio.positions) {
      portfolio.positions.forEach((pos, index) => {
        console.log(`Position ${index + 1}:`, {
          position_id: pos.position_id,
          asset_symbol: pos.asset_symbol,
          quantity: pos.quantity,
          market_value: pos.market_value,
          currency: pos.currency,
          is_archived: pos.is_archived
        });
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await db.sequelize.close();
  }
}

checkPortfolioPositions();