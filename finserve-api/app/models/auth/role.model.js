module.exports = (sequelize, Sequelize) => {
  const Role = sequelize.define(
    'roles',
    {
      role_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      role_name: {
        type: Sequelize.ENUM('USER', 'TRADER', 'ADMIN', 'MODERATOR'),
        allowNull: false,
        unique: true,
      },
      permissions: {
        type: Sequelize.JSON,
        defaultValue: [],
      },
    },
    {
      tableName: 'roles',
      underscored: true,
      timestamps: true,
      indexes: [
        { unique: true, fields: ['role_name'], name: 'ux_roles_role_name' },
      ],
    }
  );

  return Role;
};
