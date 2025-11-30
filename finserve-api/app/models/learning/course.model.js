module.exports = (sequelize, Sequelize) => {
  const Course = sequelize.define(
    'courses',
    {
      course_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
      },
      level: {
        type: Sequelize.ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED'),
        allowNull: false,
        defaultValue: 'BEGINNER',
      },
      category: {
        type: Sequelize.STRING(100),
      },
      duration: {
        type: Sequelize.INTEGER,
      },
      content: {
        type: Sequelize.JSON,
        defaultValue: {},
      },
      prerequisites: {
        type: Sequelize.JSON,
        defaultValue: [],
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      creation_date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    },
    {
      tableName: 'courses',
      underscored: true,
      timestamps: true,
    }
  );

  return Course;
};
