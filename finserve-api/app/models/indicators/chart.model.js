module.exports = (sequelize, Sequelize) => {
  const Chart = sequelize.define(
    'charts',
    {
      chart_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      asset_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      chart_type: {
        type: Sequelize.ENUM('CANDLESTICK', 'LINE', 'BAR'),
        allowNull: false,
        defaultValue: 'CANDLESTICK',
      },
      timeframe: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: '1D',
      },
      annotations: {
        type: Sequelize.JSON,
        defaultValue: [],
      },
    },
    {
      tableName: 'charts',
      underscored: true,
      timestamps: true,
    }
  );

  return Chart;
};
