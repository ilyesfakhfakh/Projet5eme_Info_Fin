module.exports = (sequelize, Sequelize) => {
  const RiskLimit = sequelize.define(
    'risk_limits',
    {
      limit_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      portfolio_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      limit_type: {
        type: Sequelize.ENUM('DAILY_LOSS', 'POSITION_SIZE', 'CONCENTRATION'),
        allowNull: false,
      },
      threshold: {
        type: Sequelize.DECIMAL(18, 4),
        allowNull: false,
        defaultValue: 0,
      },
      current_value: {
        type: Sequelize.DECIMAL(18, 4),
        allowNull: false,
        defaultValue: 0,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      alert_triggered: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: 'risk_limits',
      underscored: true,
      timestamps: true,
    }
  );

  return RiskLimit;
};
