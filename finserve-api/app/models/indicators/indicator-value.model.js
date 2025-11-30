module.exports = (sequelize, Sequelize) => {
  const IndicatorValue = sequelize.define(
    'indicator_values',
    {
      value_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      indicator_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      value: {
        type: Sequelize.DECIMAL(18, 6),
        allowNull: false,
        defaultValue: 0,
      },
      signal: {
        type: Sequelize.ENUM('BUY', 'SELL', 'HOLD'),
        allowNull: false,
        defaultValue: 'HOLD',
      },
    },
    {
      tableName: 'indicator_values',
      underscored: true,
      timestamps: true,
    }
  );

  return IndicatorValue;
};
