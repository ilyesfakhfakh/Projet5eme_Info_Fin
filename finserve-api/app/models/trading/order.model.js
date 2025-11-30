module.exports = (sequelize, Sequelize) => {
  const Order = sequelize.define(
    'orders',
    {
      order_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      portfolio_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      asset_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      order_type: {
        type: Sequelize.ENUM('MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT', 'TRAILING_STOP'),
        allowNull: false,
      },
      side: {
        type: Sequelize.ENUM('BUY', 'SELL'),
        allowNull: false,
      },
      quantity: {
        type: Sequelize.DECIMAL(28, 10),
        allowNull: false,
      },
      price: {
        type: Sequelize.DECIMAL(18, 6),
      },
      stop_price: {
        type: Sequelize.DECIMAL(18, 6),
      },
      time_in_force: {
        type: Sequelize.ENUM('DAY', 'GTC', 'IOC'),
        allowNull: false,
        defaultValue: 'DAY',
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'EXECUTED', 'CANCELLED', 'REJECTED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      creation_date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      execution_date: {
        type: Sequelize.DATE,
      },
      executed_quantity: {
        type: Sequelize.DECIMAL(28, 10),
        defaultValue: 0,
      },
      executed_price: {
        type: Sequelize.DECIMAL(18, 6),
      },
    },
    {
      tableName: 'orders',
      underscored: true,
      timestamps: true,
    }
  );

  return Order;
};
