module.exports = (sequelize, Sequelize) => {
  const OrderExecution = sequelize.define(
    'order_executions',
    {
      execution_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      order_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      executed_quantity: {
        type: Sequelize.DECIMAL(28, 10),
        allowNull: false,
        defaultValue: 0,
      },
      execution_price: {
        type: Sequelize.DECIMAL(18, 6),
        allowNull: false,
        defaultValue: 0,
      },
      execution_time: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      commission: {
        type: Sequelize.DECIMAL(18, 4),
        allowNull: false,
        defaultValue: 0,
      },
      execution_type: {
        type: Sequelize.STRING(50),
      },
    },
    {
      tableName: 'order_executions',
      underscored: true,
      timestamps: true,
    }
  );

  return OrderExecution;
};
