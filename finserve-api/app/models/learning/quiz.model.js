module.exports = (sequelize, Sequelize) => {
  const Quiz = sequelize.define(
    'quizzes',
    {
      quiz_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      lesson_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      questions: {
        type: Sequelize.JSON,
        defaultValue: [],
      },
      passing_score: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
      },
      time_limit: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      attempts: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
    },
    {
      tableName: 'quizzes',
      underscored: true,
      timestamps: true,
    }
  );

  return Quiz;
};
