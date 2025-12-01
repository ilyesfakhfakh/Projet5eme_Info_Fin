module.exports = (sequelize, Sequelize) => {
  const Match3Game = sequelize.define(
    'match3_game',
    {
      game_id: {
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
        defaultValue: 1,
        allowNull: false
      },
      score: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      moves_left: {
        type: Sequelize.INTEGER,
        defaultValue: 30,
        allowNull: false
      },
      target_score: {
        type: Sequelize.INTEGER,
        defaultValue: 1000,
        allowNull: false
      },
      board_state: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON string of the game board'
      },
      power_ups: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON string of available power-ups'
      },
      status: {
        type: Sequelize.ENUM('IN_PROGRESS', 'WON', 'LOST'),
        defaultValue: 'IN_PROGRESS',
        allowNull: false
      },
      coins_earned: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    },
    {
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['user_id']
        },
        {
          fields: ['status']
        },
        {
          fields: ['level']
        },
        {
          fields: ['created_at']
        }
      ]
    }
  );

  return Match3Game;
};
