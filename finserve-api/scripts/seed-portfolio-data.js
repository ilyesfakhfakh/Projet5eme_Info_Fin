/* Seed sample portfolios for testing */
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });
const db = require('../app/models');

async function seedPortfolios() {
  try {
    await db.sequelize.authenticate();
    await db.sequelize.sync();

    // Find the admin user
    const adminUser = await db.users.findOne({ where: { email: 'admin@example.com' } });
    if (!adminUser) {
      console.log('❌ Admin user not found. Please run seed-auth.js first.');
      return;
    }

    console.log(`👤 Found admin user: ${adminUser.username} (ID: ${adminUser.user_id})`);

    // Sample portfolios data
    const portfoliosData = [
      {
        user_id: adminUser.user_id,
        portfolio_name: 'Portefeuille Principal',
        base_currency: 'EUR'
      },
      {
        user_id: adminUser.user_id,
        portfolio_name: 'Portefeuille Actions',
        base_currency: 'USD'
      },
      {
        user_id: adminUser.user_id,
        portfolio_name: 'Portefeuille Obligations',
        base_currency: 'EUR'
      },
      {
        user_id: adminUser.user_id,
        portfolio_name: 'Portefeuille Diversifié',
        base_currency: 'EUR'
      }
    ];

    let createdCount = 0;
    for (const portfolioData of portfoliosData) {
      const [portfolio, created] = await db.portfolios.findOrCreate({
        where: {
          user_id: portfolioData.user_id,
          portfolio_name: portfolioData.portfolio_name
        },
        defaults: portfolioData
      });

      if (created) {
        createdCount++;
        console.log(`✅ Created portfolio: ${portfolio.portfolio_name}`);
      } else {
        console.log(`⏭️  Portfolio already exists: ${portfolio.portfolio_name}`);
      }
    }

    console.log(`\n🎉 Portfolio seeding completed!`);
    console.log(`📊 Created: ${createdCount} new portfolios`);
    console.log(`👤 For user: ${adminUser.username}`);

  } catch (error) {
    console.error('❌ Portfolio seeding failed:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedPortfolios();
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

main();