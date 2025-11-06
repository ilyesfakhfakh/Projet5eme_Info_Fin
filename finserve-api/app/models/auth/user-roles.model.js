module.exports = (sequelize, Sequelize) => {
  const UserRole = sequelize.define(
    'user_roles',
    {
      user_role_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      role_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
    },
    {
      tableName: 'user_roles',
      underscored: true,
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['user_id', 'role_id'],
          name: 'ux_user_roles_user_role',
        },
        {
          fields: ['user_id'],
          name: 'ix_user_roles_user',
        },
        {
          fields: ['role_id'],
          name: 'ix_user_roles_role',
        },
      ],
    }
  );

  return UserRole;
};
