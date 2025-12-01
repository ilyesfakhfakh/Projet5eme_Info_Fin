module.exports = (sequelize, Sequelize) => {
  const RouletteGame = sequelize.define(
    'roulette_game',
    {
      game_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      game_number: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      result_type: {
        type: Sequelize.ENUM('RED', 'BLACK', 'GREEN', 'SECTOR', 'STOCK'),
        allowNull: true
      },
      result_value: {
        type: Sequelize.STRING,
        allowNull: true
      },
      multiplier: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      server_seed: {
        type: Sequelize.STRING,
        allowNull: false
      },
      client_seed: {
        type: Sequelize.STRING,
        allowNull: true
      },
      result_hash: {
        type: Sequelize.STRING,
        allowNull: true
      },
      total_bets: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0.00,
        allowNull: false
      },
      total_payouts: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0.00,
        allowNull: false
      },
      volatility_index: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'SPINNING', 'COMPLETED'),
        defaultValue: 'PENDING',
        allowNull: false
      },
      spun_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    },
    {
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['game_number']
        },
        {
          fields: ['status']
        },
        {
          fields: ['created_at']
        }
      ]
    }
  );

  return RouletteGame;
};
