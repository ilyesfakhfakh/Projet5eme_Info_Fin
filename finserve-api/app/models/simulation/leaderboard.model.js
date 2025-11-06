module.exports = (sequelize, Sequelize) => {
  const Leaderboard = sequelize.define(
    'leaderboards',
    {
      leaderboard_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      competition_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      rankings: {
        type: Sequelize.JSON,
        defaultValue: [],
      },
      last_update_date: {
        type: Sequelize.DATE,
      },
    },
    {
      tableName: 'leaderboards',
      underscored: true,
      timestamps: true,
    }
  );

  return Leaderboard;
};
