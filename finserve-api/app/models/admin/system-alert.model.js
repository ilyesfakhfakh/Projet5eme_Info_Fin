module.exports = (sequelize, Sequelize) => {
  const SystemAlert = sequelize.define(
    'system_alerts',
    {
      alert_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      alert_type: {
        type: Sequelize.ENUM('WARNING', 'ERROR', 'INFO'),
        allowNull: false,
      },
      message: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      severity: {
        type: Sequelize.STRING(50),
      },
      created_by: {
        type: Sequelize.UUID,
      },
      is_resolved: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      creation_date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      resolved_date: {
        type: Sequelize.DATE,
      },
    },
    {
      tableName: 'system_alerts',
      underscored: true,
      timestamps: true,
      indexes: [
        { fields: ['created_by'], name: 'ix_system_alerts_created_by' },
        { fields: ['is_resolved'], name: 'ix_system_alerts_is_resolved' },
        { fields: ['alert_type'], name: 'ix_system_alerts_alert_type' },
        { fields: ['severity'], name: 'ix_system_alerts_severity' },
        { fields: ['creation_date'], name: 'ix_system_alerts_creation_date' },
      ],
    }
  );

  return SystemAlert;
};
