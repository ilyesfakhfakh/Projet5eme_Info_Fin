// ========================================
// Price Alert Model
// Description: User-defined price alerts for assets
// ========================================

module.exports = (sequelize, Sequelize) => {
  const PriceAlert = sequelize.define(
    'price_alerts',
    {
      alert_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      asset_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      alert_type: {
        type: Sequelize.ENUM('ABOVE', 'BELOW', 'PERCENTAGE_CHANGE'),
        allowNull: false,
        defaultValue: 'ABOVE',
      },
      target_price: {
        type: Sequelize.DECIMAL(18, 6),
        allowNull: false,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      is_triggered: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      triggered_at: {
        type: Sequelize.DATE,
      },
      message: {
        type: Sequelize.TEXT,
      },
    },
    {
      tableName: 'price_alerts',
      underscored: true,
      timestamps: true,
    }
  );

  return PriceAlert;
};
