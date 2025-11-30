// ========================================
// MODULE 3: Financial Assets and Market Data
// Model: HistoricalData
// Description: Stores historical price data for assets
// ========================================

module.exports = (sequelize, Sequelize) => {
  const HistoricalData = sequelize.define(
    'historical_data',
    {
      history_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      asset_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'Foreign key reference to assets table',
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Trading date for this historical data point',
      },
      open_price: {
        type: Sequelize.DECIMAL(18, 6),
        allowNull: false,
        defaultValue: 0,
        comment: 'Opening price for the day',
      },
      high_price: {
        type: Sequelize.DECIMAL(18, 6),
        allowNull: false,
        defaultValue: 0,
        comment: 'Highest price during the day',
      },
      low_price: {
        type: Sequelize.DECIMAL(18, 6),
        allowNull: false,
        defaultValue: 0,
        comment: 'Lowest price during the day',
      },
      close_price: {
        type: Sequelize.DECIMAL(18, 6),
        allowNull: false,
        defaultValue: 0,
        comment: 'Closing price for the day',
      },
      adjusted_close: {
        type: Sequelize.DECIMAL(18, 6),
        allowNull: false,
        defaultValue: 0,
        comment: 'Adjusted closing price (accounts for splits, dividends)',
      },
      volume: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0,
        comment: 'Trading volume for the day',
      },
    },
    {
      tableName: 'historical_data',
      underscored: true,
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['asset_id', 'date'],
          name: 'unique_asset_date',
        },
        {
          fields: ['date'],
          name: 'idx_date',
        },
      ],
    }
  );

  return HistoricalData;
};
