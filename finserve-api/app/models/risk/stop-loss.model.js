module.exports = (sequelize, Sequelize) => {
  const StopLoss = sequelize.define(
    'stop_losses',
    {
      stop_loss_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      position_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      trigger_price: {
        type: Sequelize.DECIMAL(18, 6),
        allowNull: false,
      },
      stop_type: {
        type: Sequelize.ENUM('FIXED', 'TRAILING'),
        allowNull: false,
      },
      trigger_amount: {
        type: Sequelize.DECIMAL(18, 6),
        allowNull: false,
        defaultValue: 0,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      creation_date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    },
    {
      tableName: 'stop_losses',
      underscored: true,
      timestamps: true,
    }
  );

  return StopLoss;
};
