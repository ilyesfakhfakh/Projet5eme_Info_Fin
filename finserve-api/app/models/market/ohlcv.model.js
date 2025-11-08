module.exports = (sequelize, Sequelize) => {
  const OHLCV = sequelize.define(
    'ohlcvs',
    {
      ohlcv_id: {
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
      interval: {
        type: Sequelize.ENUM('1m', '5m', '15m', '1h', '4h', '1d', '1w'),
        allowNull: false,
        defaultValue: '1h',
      },
      open: {
        type: Sequelize.DECIMAL(18, 6),
        allowNull: false,
        defaultValue: 0,
      },
      high: {
        type: Sequelize.DECIMAL(18, 6),
        allowNull: false,
        defaultValue: 0,
      },
      low: {
        type: Sequelize.DECIMAL(18, 6),
        allowNull: false,
        defaultValue: 0,
      },
      close: {
        type: Sequelize.DECIMAL(18, 6),
        allowNull: false,
        defaultValue: 0,
      },
      volume: {
        type: Sequelize.DECIMAL(28, 10),
        allowNull: false,
        defaultValue: 0,
      },
      trades_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName: 'ohlcvs',
      underscored: true,
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['asset_id', 'timestamp', 'interval'],
        },
        {
          fields: ['asset_id', 'interval', 'timestamp'],
        },
      ],
    }
  )

  return OHLCV
}