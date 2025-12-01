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
      limit_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'risk_limits',
          key: 'limit_id',
        },
      },
      portfolio_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      alert_type: {
        type: Sequelize.ENUM('LIMIT_BREACH', 'THRESHOLD_WARNING', 'SYSTEM_ERROR'),
        allowNull: false,
      },
      severity: {
        type: Sequelize.ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
        allowNull: false,
        defaultValue: 'MEDIUM',
      },
      current_value: {
        type: Sequelize.DECIMAL(20, 6),
        allowNull: false,
      },
      limit_value: {
        type: Sequelize.DECIMAL(20, 6),
        allowNull: false,
      },
      breach_percentage: {
        type: Sequelize.DECIMAL(10, 4),
        allowNull: false,
        comment: 'Percentage over the limit (1.05 = 5% over)',
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'EUR',
      },
      alert_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      status: {
        type: Sequelize.ENUM('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'FALSE_POSITIVE'),
        allowNull: false,
        defaultValue: 'ACTIVE',
      },
      acknowledged_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      acknowledged_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      resolved_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      resolved_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      notification_channels: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Array of notification channels used: ["UI", "EMAIL", "SMS"]',
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Additional alert context',
      },
    },
    {
      tableName: 'risk_alerts',
      underscored: true,
      timestamps: true,
      indexes: [
        {
          fields: ['portfolio_id', 'alert_date'],
        },
        {
          fields: ['status', 'severity'],
        },
        {
          fields: ['limit_id'],
        },
      ],
    }
  );

  return RiskAlert;
};