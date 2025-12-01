module.exports = (sequelize, Sequelize) => {
  const RiskLog = sequelize.define(
    'risk_logs',
    {
      log_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      entity_type: {
        type: Sequelize.ENUM('LIMIT', 'METRIC', 'ALERT', 'CALCULATION', 'REPORT'),
        allowNull: false,
      },
      entity_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'ID of the entity being logged',
      },
      action: {
        type: Sequelize.ENUM('CREATE', 'UPDATE', 'DELETE', 'CALCULATE', 'VALIDATE', 'APPROVE', 'REJECT', 'ACKNOWLEDGE', 'RESOLVE'),
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      portfolio_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      old_values: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Previous values for updates',
      },
      new_values: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'New values for updates/creates',
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true,
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Reason for the action',
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Additional context',
      },
    },
    {
      tableName: 'risk_logs',
      underscored: true,
      timestamps: false, // We use our own timestamp field
      indexes: [
        {
          fields: ['entity_type', 'entity_id'],
        },
        {
          fields: ['user_id', 'timestamp'],
        },
        {
          fields: ['portfolio_id', 'timestamp'],
        },
        {
          fields: ['timestamp'],
        },
      ],
    }
  );

  return RiskLog;
};