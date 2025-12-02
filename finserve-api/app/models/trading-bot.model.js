module.exports = (sequelize, Sequelize) => {
  const TradingBot = sequelize.define('trading_bot', {
    bot_id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: Sequelize.STRING,
      allowNull: false
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    description: {
      type: Sequelize.TEXT
    },
    status: {
      type: Sequelize.ENUM('DRAFT', 'ACTIVE', 'PAUSED', 'STOPPED'),
      defaultValue: 'DRAFT'
    },
    is_public: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    },
    category: {
      type: Sequelize.STRING(100),
      defaultValue: 'custom'
    },
    risk_level: {
      type: Sequelize.ENUM('LOW', 'MEDIUM', 'HIGH'),
      defaultValue: 'MEDIUM'
    },
    config: {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: { nodes: [], edges: [] }
    },
    settings: {
      type: Sequelize.JSON,
      defaultValue: {
        maxInvestment: 1000,
        stopLoss: 5,
        takeProfit: 10,
        maxConcurrentTrades: 3
      }
    },
    total_trades: {
      type: Sequelize.INTEGER,
      defaultValue: 0
    },
    win_rate: {
      type: Sequelize.DECIMAL(5, 2),
      defaultValue: 0
    },
    total_profit: {
      type: Sequelize.DECIMAL(15, 2),
      defaultValue: 0
    },
    total_loss: {
      type: Sequelize.DECIMAL(15, 2),
      defaultValue: 0
    },
    roi: {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0
    },
    downloads: {
      type: Sequelize.INTEGER,
      defaultValue: 0
    },
    rating: {
      type: Sequelize.DECIMAL(3, 2),
      defaultValue: 0
    },
    price: {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0
    }
  }, {
    timestamps: true,
    underscored: true,
    tableName: 'trading_bots',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['status'] },
      { fields: ['is_public'] },
      { fields: ['category'] }
    ]
  });

  return TradingBot;
};
