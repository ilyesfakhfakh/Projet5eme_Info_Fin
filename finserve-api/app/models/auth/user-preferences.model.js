module.exports = (sequelize, Sequelize) => {
  const UserPreferences = sequelize.define(
    'user_preferences',
    {
      preferences_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
      },
      theme: {
        type: Sequelize.ENUM('DARK', 'LIGHT'),
        allowNull: false,
        defaultValue: 'LIGHT',
      },
      language: {
        type: Sequelize.STRING(10),
        defaultValue: 'en',
      },
      currency: {
        type: Sequelize.STRING(10),
        defaultValue: 'USD',
      },
      notification_settings: {
        type: Sequelize.JSON,
        defaultValue: {},
      },
      dashboard_layout: {
        type: Sequelize.JSON,
        defaultValue: {},
      },
      trading_preferences: {
        type: Sequelize.JSON,
        defaultValue: {},
      },
    },
    {
      tableName: 'user_preferences',
      underscored: true,
      timestamps: true,
      indexes: [
        { unique: true, fields: ['user_id'], name: 'ux_user_preferences_user' },
        { fields: ['theme'], name: 'ix_user_preferences_theme' },
        { fields: ['language'], name: 'ix_user_preferences_language' },
        { fields: ['currency'], name: 'ix_user_preferences_currency' },
      ],
    }
  );

  return UserPreferences;
};
