module.exports = (sequelize, Sequelize) => {
  const RouletteBet = sequelize.define(
    'roulette_bet',
    {
      bet_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      game_id: {
        type: Sequelize.UUID,
        allowNull: false
      },
      user_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      bet_type: {
        type: Sequelize.ENUM('RED', 'BLACK', 'GREEN', 'SECTOR', 'STOCK'),
        allowNull: false
      },
      bet_value: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Specific sector or stock name if applicable'
      },
      amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      potential_payout: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      actual_payout: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0.00,
        allowNull: false
      },
      result: {
        type: Sequelize.ENUM('PENDING', 'WIN', 'LOSS'),
        defaultValue: 'PENDING',
        allowNull: false
      }
    },
    {
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['game_id']
        },
        {
          fields: ['user_id']
        },
        {
          fields: ['bet_type']
        },
        {
          fields: ['result']
        }
      ]
    }
  );

  return RouletteBet;
};
