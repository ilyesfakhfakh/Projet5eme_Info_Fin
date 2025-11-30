module.exports = (sequelize, Sequelize) => {
  const SystemConfiguration = sequelize.define(
    'system_configurations',
    {
      config_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      config_key: {
        type: Sequelize.STRING(150),
        allowNull: false,
        unique: true,
      },
      config_value: {
        type: Sequelize.TEXT,
      },
      description: {
        type: Sequelize.TEXT,
      },
      category: {
        type: Sequelize.STRING(100),
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      last_modified_by: {
        type: Sequelize.UUID,
      },
    },
    {
      tableName: 'system_configurations',
      underscored: true,
      timestamps: true,
    }
  );

  return SystemConfiguration;
};
