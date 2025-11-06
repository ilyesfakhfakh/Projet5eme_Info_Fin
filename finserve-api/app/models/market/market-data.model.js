module.exports = (sequelize, Sequelize) => {
  const MarketData = sequelize.define(
    'market_data',
    {
      data_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      asset_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      open_price: {
        type: Sequelize.DECIMAL(18, 6),
        allowNull: false,
        defaultValue: 0,
      },
      high_price: {
        type: Sequelize.DECIMAL(18, 6),
        allowNull: false,
        defaultValue: 0,
      },
      low_price: {
        type: Sequelize.DECIMAL(18, 6),
        allowNull: false,
        defaultValue: 0,
      },
      close_price: {
        type: Sequelize.DECIMAL(18, 6),
        allowNull: false,
        defaultValue: 0,
      },
      volume: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0,
      },
      adjusted_close: {
        type: Sequelize.DECIMAL(18, 6),
        allowNull: false,
        defaultValue: 0,
      },
      change: {
        type: Sequelize.DECIMAL(18, 6),
        allowNull: false,
        defaultValue: 0,
      },
      change_percent: {
        type: Sequelize.DECIMAL(9, 4),
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName: 'market_data',
      underscored: true,
      timestamps: true,
    }
  );

  return MarketData;
};
