module.exports = (sequelize, Sequelize) => {
  const TradingScenario = sequelize.define(
    'trading_scenarios',
    {
      scenario_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      scenario_name: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
      },
      scenario_type: {
        type: Sequelize.ENUM('CRASH', 'BULL_MARKET', 'BEAR_MARKET', 'HISTORICAL', 'EVENT'),
        allowNull: false,
      },
      start_date: {
        type: Sequelize.DATE,
      },
      end_date: {
        type: Sequelize.DATE,
      },
      market_conditions: {
        type: Sequelize.JSON,
        defaultValue: {},
      },
      difficulty: {
        type: Sequelize.STRING(50),
      },
    },
    {
      tableName: 'trading_scenarios',
      underscored: true,
      timestamps: true,
    }
  );

  return TradingScenario;
};
