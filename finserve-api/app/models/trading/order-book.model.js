module.exports = (sequelize, Sequelize) => {
  const OrderBook = sequelize.define(
    'order_books',
    {
      book_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      order_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      asset_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      side: {
        type: Sequelize.ENUM('BUY', 'SELL'),
        allowNull: false,
      },
      price: {
        type: Sequelize.DECIMAL(18, 6),
      },
      quantity: {
        type: Sequelize.DECIMAL(28, 10),
        allowNull: false,
      },
      remaining_quantity: {
        type: Sequelize.DECIMAL(28, 10),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('OPEN', 'PARTIALLY_FILLED', 'FILLED', 'CANCELLED'),
        allowNull: false,
        defaultValue: 'OPEN',
      },
    },
    {
      tableName: 'order_books',
      underscored: true,
      timestamps: true,
    }
  )

  return OrderBook
}