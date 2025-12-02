module.exports = (sequelize, Sequelize) => {
  const BotExecution = sequelize.define('bot_execution', {
    execution_id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    bot_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'trading_bots',
        key: 'bot_id'
      },
      onDelete: 'CASCADE'
    },
    user_id: {
      type: Sequelize.STRING,
      allowNull: false
    },
    asset_symbol: {
      type: Sequelize.STRING(20),
      allowNull: false
    },
    action: {
      type: Sequelize.ENUM('BUY', 'SELL'),
      allowNull: false
    },
    quantity: {
      type: Sequelize.DECIMAL(15, 8),
      allowNull: false
    },
    price: {
      type: Sequelize.DECIMAL(15, 8),
      allowNull: false
    },
    total_value: {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: false
    },
    profit_loss: {
      type: Sequelize.DECIMAL(15, 2),
      defaultValue: 0
    },
    profit_loss_percent: {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0
    },
    trigger_rule: {
      type: Sequelize.STRING
    },
    market_conditions: {
      type: Sequelize.JSON
    }
  }, {
    timestamps: true,
    underscored: true,
    tableName: 'bot_executions',
    createdAt: 'executed_at',
    updatedAt: false,
    indexes: [
      { fields: ['bot_id'] },
      { fields: ['user_id'] },
      { fields: ['asset_symbol'] },
      { fields: ['executed_at'] }
    ]
  });

  return BotExecution;
};
