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
      },
      action: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      entity_type: {
        type: Sequelize.STRING(100),
      },
      entity_id: {
        type: Sequelize.STRING(100),
      },
      old_values: {
        type: Sequelize.JSON,
        defaultValue: {},
      },
      new_values: {
        type: Sequelize.JSON,
        defaultValue: {},
      },
      timestamp: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      ip_address: {
        type: Sequelize.STRING(45),
      },
    },
    {
      tableName: 'audit_logs',
      underscored: true,
      timestamps: true,
      indexes: [
        { fields: ['user_id'], name: 'ix_audit_logs_user' },
        { fields: ['action'], name: 'ix_audit_logs_action' },
        { fields: ['entity_type'], name: 'ix_audit_logs_entity_type' },
        { fields: ['timestamp'], name: 'ix_audit_logs_timestamp' },
      ],
    }
  );

  return AuditLog;
};
