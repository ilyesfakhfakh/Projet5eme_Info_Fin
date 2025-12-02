module.exports = (sequelize, Sequelize) => {
  const BacktestResult = sequelize.define('backtest_result', {
    backtest_id: {
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
    start_date: {
      type: Sequelize.DATE,
      allowNull: false
    },
    end_date: {
      type: Sequelize.DATE,
      allowNull: false
    },
    initial_capital: {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: false
    },
    final_capital: {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: false
    },
    total_trades: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    winning_trades: {
      type: Sequelize.INTEGER,
      defaultValue: 0
    },
    losing_trades: {
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
    net_profit: {
      type: Sequelize.DECIMAL(15, 2),
      defaultValue: 0
    },
    roi: {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0
    },
    max_drawdown: {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0
    },
    sharpe_ratio: {
      type: Sequelize.DECIMAL(10, 4),
      defaultValue: 0
    },
    trades_data: {
      type: Sequelize.JSON,
      defaultValue: []
    },
    equity_curve: {
      type: Sequelize.JSON,
      defaultValue: []
    }
  }, {
    timestamps: true,
    underscored: true,
    tableName: 'backtest_results',
    updatedAt: false,
    indexes: [
      { fields: ['bot_id'] },
      { fields: ['user_id'] },
      { fields: ['created_at'] }
    ]
  });

  return BacktestResult;
};
