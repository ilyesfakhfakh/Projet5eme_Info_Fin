module.exports = (sequelize, Sequelize) => {
  const UserProgress = sequelize.define(
    'user_progress',
    {
      progress_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      course_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      completed_lessons: {
        type: Sequelize.JSON,
        defaultValue: [],
      },
      completion_percentage: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
      },
      start_date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      last_access_date: {
        type: Sequelize.DATE,
      },
      score: {
        type: Sequelize.DECIMAL(6, 2),
        defaultValue: 0,
      },
    },
    {
      tableName: 'user_progress',
      underscored: true,
      timestamps: true,
    }
  );

  return UserProgress;
};
