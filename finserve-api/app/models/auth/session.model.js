module.exports = (sequelize, Sequelize) => {
  const Session = sequelize.define(
    'sessions',
    {
      session_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      login_time: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      last_activity: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      user_agent: {
        type: Sequelize.STRING(255),
      },
      ip_address: {
        type: Sequelize.STRING(45),
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: 'sessions',
      underscored: true,
      timestamps: true,
      indexes: [
        { fields: ['user_id'], name: 'ix_sessions_user' },
        { fields: ['is_active'], name: 'ix_sessions_active' },
        { fields: ['last_activity'], name: 'ix_sessions_last_activity' },
        { fields: ['expires_at'], name: 'ix_sessions_expires_at' },
      ],
    }
  );

  return Session;
};
