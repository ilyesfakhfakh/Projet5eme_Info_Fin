module.exports = (sequelize, Sequelize) => {
  const Competition = sequelize.define(
    'competitions',
    {
      competition_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      competition_name: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
      },
      start_date: {
        type: Sequelize.DATE,
      },
      end_date: {
        type: Sequelize.DATE,
      },
      participants: {
        type: Sequelize.JSON,
        defaultValue: [],
      },
      rules: {
        type: Sequelize.JSON,
        defaultValue: {},
      },
      prizes: {
        type: Sequelize.JSON,
        defaultValue: [],
      },
      leaderboard: {
        type: Sequelize.JSON,
        defaultValue: {},
      },
      status: {
        type: Sequelize.STRING(50),
        defaultValue: 'PLANNED',
      },
    },
    {
      tableName: 'competitions',
      underscored: true,
      timestamps: true,
    }
  );

  return Competition;
};
