/**
 * Script to seed test data for the application
 * Run with: node seed-test-data.js
 */

const db = require('./app/models');

async function seedData() {
  try {
    console.log('🌱 Starting data seeding...');

    // 1. Create test user (if doesn't exist)
    const [user] = await db.users.findOrCreate({
      where: { email: 'test@example.com' },
      defaults: {
        username: 'testuser',
        email: 'test@example.com',
        password_hash: '$2a$10$DUMMY_HASH', // In production, use proper hashing
        first_name: 'Test',
        last_name: 'User',
        role: 'USER',
        is_active: true
      }
    });
    console.log('✅ User created:', user.user_id);

    // 2. Create portfolios
    const [portfolio1] = await db.portfolios.findOrCreate({
      where: { portfolio_name: 'Main Portfolio' },
      defaults: {
        portfolio_id: '11111111-1111-1111-1111-111111111111',
        user_id: user.user_id,
        portfolio_name: 'Main Portfolio',
        description: 'Primary trading portfolio',
        initial_balance: 100000,
        current_balance: 100000,
        currency: 'USD'
      }
    });
    console.log('✅ Portfolio created:', portfolio1.portfolio_id);

    // 3. Create assets
    const assets = [
      {
        asset_id: 'btc-001',
        asset_name: 'Bitcoin',
        symbol: 'BTC',
        asset_type: 'CRYPTO',
        description: 'Bitcoin cryptocurrency'
      },
      {
        asset_id: 'eth-001',
        asset_name: 'Ethereum',
        symbol: 'ETH',
        asset_type: 'CRYPTO',
        description: 'Ethereum cryptocurrency'
      },
      {
        asset_id: 'aapl-001',
        asset_name: 'Apple Inc.',
        symbol: 'AAPL',
        asset_type: 'STOCK',
        description: 'Apple Inc. stock'
      }
    ];

    for (const assetData of assets) {
      const [asset] = await db.assets.findOrCreate({
        where: { symbol: assetData.symbol },
        defaults: assetData
      });
      console.log('✅ Asset created:', asset.symbol);
    }

    // 4. Create sample orders
    const orders = [
      {
        portfolio_id: portfolio1.portfolio_id,
        asset_id: 'btc-001',
        order_type: 'LIMIT',
        side: 'BUY',
        quantity: 0.5,
        price: 45000,
        time_in_force: 'GTC',
        status: 'PENDING',
        creation_date: new Date()
      },
      {
        portfolio_id: portfolio1.portfolio_id,
        asset_id: 'eth-001',
        order_type: 'LIMIT',
        side: 'SELL',
        quantity: 10,
        price: 3000,
        time_in_force: 'GTC',
        status: 'PENDING',
        creation_date: new Date()
      }
    ];

    for (const orderData of orders) {
      const order = await db.orders.create(orderData);
      console.log('✅ Order created:', order.order_id);

      // Create execution for the first order
      if (orderData.side === 'BUY') {
        const execution = await db.order_executions.create({
          order_id: order.order_id,
          executed_quantity: orderData.quantity,
          execution_price: orderData.price,
          execution_time: new Date(),
          commission: orderData.price * orderData.quantity * 0.001, // 0.1% commission
          execution_type: 'MATCH'
        });
        console.log('✅ Execution created:', execution.execution_id);
      }
    }

    // 5. Create trading strategy
    const [strategy] = await db.trading_strategies.findOrCreate({
      where: { strategy_name: 'BTC Momentum Strategy' },
      defaults: {
        user_id: user.user_id,
        strategy_name: 'BTC Momentum Strategy',
        strategy_type: 'MOMENTUM',
        description: 'Buy BTC on momentum breakouts',
        parameters: {
          asset_id: 'btc-001',
          portfolio_id: portfolio1.portfolio_id,
          threshold: 0.02,
          default_price: 50000,
          risk_per_trade: 0.02,
          account_balance: 100000,
          max_position_size: 10
        },
        is_active: true
      }
    });
    console.log('✅ Strategy created:', strategy.strategy_id);

    console.log('\n🎉 Data seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- User ID: ${user.user_id}`);
    console.log(`- Portfolio ID: ${portfolio1.portfolio_id}`);
    console.log(`- Assets: BTC, ETH, AAPL`);
    console.log(`- Orders: 2 created`);
    console.log(`- Strategy ID: ${strategy.strategy_id}`);
    console.log('\n💡 You can now test the application with this data!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the seeder
seedData();
