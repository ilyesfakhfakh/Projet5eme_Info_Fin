const { Sequelize } = require('sequelize');
const path = require('path');

// Initialize Sequelize with SQLite for roulette game
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../database/roulette.db'),
  logging: false, // Set to console.log to see SQL queries
  define: {
    timestamps: true,
    underscored: true
  }
});

// Import models
const rouletteModels = require('../models/roulette.model')(sequelize);

// Initialize database
async function initializeDatabase() {
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('Roulette database connection established successfully.');
    
    // Sync models (create tables)
    await sequelize.sync({ alter: false }); // Use { force: true } to recreate tables
    console.log('Roulette database tables synced successfully.');
    
    // Initialize jackpot if not exists
    const jackpot = await rouletteModels.Jackpot.findOne();
    if (!jackpot) {
      await rouletteModels.Jackpot.create({
        current_amount: 1000.00,
        contribution_rate: 0.01
      });
      console.log('Jackpot initialized with $1,000');
    }
    
    return rouletteModels;
  } catch (error) {
    console.error('Unable to connect to the roulette database:', error);
    throw error;
  }
}

module.exports = {
  sequelize,
  initializeDatabase,
  models: rouletteModels
};
