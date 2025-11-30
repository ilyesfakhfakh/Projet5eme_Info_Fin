module.exports = (sequelize, Sequelize) => {
  const TradingStrategy = sequelize.define(
    'trading_strategies',
    {
      strategy_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      strategy_name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
      },
      parameters: {
        type: Sequelize.JSON,
        defaultValue: {},
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      creation_date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      last_execution_date: {
        type: Sequelize.DATE,
      },
      performance: {
        type: Sequelize.JSON,
        defaultValue: {},
      },
    },
    {
      tableName: 'trading_strategies',
      underscored: true,
      timestamps: true,
    }
  );

  return TradingStrategy;
};
