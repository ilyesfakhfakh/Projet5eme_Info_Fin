module.exports = (sequelize, Sequelize) => {
  const Match3HighScore = sequelize.define(
    'match3_highscore',
    {
      score_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      level: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      score: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      moves_used: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      coins_earned: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      }
    },
    {
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['user_id', 'level'],
          unique: true
        },
        {
          fields: ['level']
        },
        {
          fields: ['score']
        }
      ]
    }
  );

  return Match3HighScore;
};
