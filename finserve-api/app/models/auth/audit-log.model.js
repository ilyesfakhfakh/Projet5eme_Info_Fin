module.exports = (sequelize, Sequelize) => {
  const AuditLog = sequelize.define(
    'audit_logs',
    {
      log_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'user_id',
        },
      },
      action: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      resource_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      resource_id: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      details: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true,
      },
      user_agent: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      timestamp: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      }
    },
    {
      tableName: 'audit_logs',
      timestamps: false,
      indexes: [
        { fields: ['user_id'], name: 'ix_audit_logs_user_id' },
        { fields: ['action'], name: 'ix_audit_logs_action' },
        { fields: ['resource_type'], name: 'ix_audit_logs_resource_type' },
        { fields: ['timestamp'], name: 'ix_audit_logs_timestamp' },
      ],
    }
  );

  AuditLog.associate = (models) => {
    AuditLog.belongsTo(models.users, {
      foreignKey: 'user_id',
      as: 'user',
    });
  };

  return AuditLog;
};
