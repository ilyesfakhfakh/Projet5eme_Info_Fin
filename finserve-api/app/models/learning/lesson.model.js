module.exports = (sequelize, Sequelize) => {
  const Lesson = sequelize.define(
    'lessons',
    {
      lesson_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      course_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      content: {
        type: Sequelize.JSON,
        defaultValue: {},
      },
      lesson_type: {
        type: Sequelize.ENUM('VIDEO', 'TEXT', 'INTERACTIVE', 'QUIZ'),
        allowNull: false,
        defaultValue: 'TEXT',
      },
      order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      duration: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      is_completed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: 'lessons',
      underscored: true,
      timestamps: true,
    }
  );

  return Lesson;
};
