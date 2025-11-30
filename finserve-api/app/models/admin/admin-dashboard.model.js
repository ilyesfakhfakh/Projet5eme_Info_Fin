module.exports = (sequelize, Sequelize) => {
  const AdminDashboard = sequelize.define(
    'admin_dashboards',
    {
      dashboard_id: {
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
      widgets: {
        type: Sequelize.JSON,
        defaultValue: [],
      },
    },
    {
      tableName: 'admin_dashboards',
      underscored: true,
      timestamps: true,
      indexes: [
        { unique: true, fields: ['user_id'], name: 'ux_admin_dashboards_user' },
      ],
    }
  );

  return AdminDashboard;
};
