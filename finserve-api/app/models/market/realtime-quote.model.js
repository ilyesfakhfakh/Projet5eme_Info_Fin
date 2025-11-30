module.exports = (sequelize, Sequelize) => {
  const RealTimeQuote = sequelize.define(
    'real_time_quotes',
    {
      quote_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      asset_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      bid_price: {
        type: Sequelize.DECIMAL(18, 6),
        allowNull: false,
        defaultValue: 0,
      },
      ask_price: {
        type: Sequelize.DECIMAL(18, 6),
        allowNull: false,
        defaultValue: 0,
      },
      last_price: {
        type: Sequelize.DECIMAL(18, 6),
        allowNull: false,
        defaultValue: 0,
      },
      volume: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0,
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      market_status: {
        type: Sequelize.ENUM('OPEN', 'CLOSED', 'PRE_MARKET', 'AFTER_HOURS'),
        allowNull: false,
        defaultValue: 'CLOSED',
      },
    },
    {
      tableName: 'real_time_quotes',
      underscored: true,
      timestamps: true,
    }
  );

  return RealTimeQuote;
};
