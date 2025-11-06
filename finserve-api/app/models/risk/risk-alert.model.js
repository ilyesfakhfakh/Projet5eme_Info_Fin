module.exports = (sequelize, Sequelize) => {
  const RiskAlert = sequelize.define(
    'risk_alerts',
    {
      alert_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      portfolio_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      alert_type: {
        type: Sequelize.ENUM('VAR_EXCEEDED', 'VOLATILITY_SPIKE', 'DRAWDOWN_LIMIT', 'SHARPE_RATIO_LOW'),
        allowNull: false,
      },
      threshold_value: {
        type: Sequelize.DECIMAL(9, 4),
        allowNull: false,
      },
      current_value: {
        type: Sequelize.DECIMAL(9, 4),
        allowNull: false,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      alert_date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    },
    {
      tableName: 'risk_alerts',
      underscored: true,
      timestamps: true,
    }
  );

  return RiskAlert;
};