module.exports = (sequelize, Sequelize) => {
  const TechnicalIndicator = sequelize.define(
    'technical_indicators',
    {
      indicator_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      asset_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      indicator_type: {
        type: Sequelize.ENUM('SMA', 'EMA', 'RSI', 'MACD', 'BOLLINGER'),
        allowNull: false,
      },
      period: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      parameters: {
        type: Sequelize.JSON,
        defaultValue: {},
      },
      values: {
        type: Sequelize.JSON,
        defaultValue: [],
      },
      last_calculation_date: {
        type: Sequelize.DATE,
      },
    },
    {
      tableName: 'technical_indicators',
      underscored: true,
      timestamps: true,
    }
  );

  return TechnicalIndicator;
};
