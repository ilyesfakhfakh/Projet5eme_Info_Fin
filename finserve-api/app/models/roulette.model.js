const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  // Wallet Model
  const Wallet = sequelize.define('wallet', {
    wallet_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    balance: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 1000.00, // Starting balance
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD',
      allowNull: false
    },
    locked_balance: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      allowNull: false
    },
    total_wagered: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00
    },
    total_won: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00
    }
  }, {
    timestamps: true,
    underscored: true
  });

  // Roulette Game Model
  const RouletteGame = sequelize.define('roulette_game', {
    game_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    game_number: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      unique: true
    },
    result_type: {
      type: DataTypes.ENUM('RED', 'BLACK', 'GREEN', 'SECTOR', 'STOCK'),
      allowNull: false
    },
    result_value: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    multiplier: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false
    },
    total_bets: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00
    },
    total_payouts: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00
    },
    volatility_index: {
      type: DataTypes.DECIMAL(5, 2),
      comment: 'Market volatility at spin time'
    },
    spin_timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'SPINNING', 'COMPLETED'),
      defaultValue: 'PENDING'
    }
  }, {
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['game_number'] },
      { fields: ['spin_timestamp'] }
    ]
  });

  // Roulette Bet Model
  const RouletteBet = sequelize.define('roulette_bet', {
    bet_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    game_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'roulette_games',
        key: 'game_id'
      }
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    bet_type: {
      type: DataTypes.ENUM('RED', 'BLACK', 'GREEN', 'SECTOR', 'STOCK'),
      allowNull: false
    },
    bet_value: {
      type: DataTypes.STRING(50),
      comment: 'Sector name or stock symbol if applicable'
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    potential_payout: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    actual_payout: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    result: {
      type: DataTypes.ENUM('PENDING', 'WIN', 'LOSS'),
      defaultValue: 'PENDING'
    }
  }, {
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['game_id'] },
      { fields: ['user_id'] },
      { fields: ['result'] }
    ]
  });

  // Jackpot Model
  const Jackpot = sequelize.define('jackpot', {
    jackpot_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    current_amount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 1000.00,
      allowNull: false
    },
    contribution_rate: {
      type: DataTypes.DECIMAL(5, 4),
      defaultValue: 0.01, // 1% of each bet
      allowNull: false
    },
    last_winner: {
      type: DataTypes.STRING
    },
    last_win_amount: {
      type: DataTypes.DECIMAL(15, 2)
    },
    last_win_date: {
      type: DataTypes.DATE
    },
    total_paid: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00
    }
  }, {
    timestamps: true,
    underscored: true
  });

  // Associations
  RouletteGame.hasMany(RouletteBet, { foreignKey: 'game_id' });
  RouletteBet.belongsTo(RouletteGame, { foreignKey: 'game_id' });

  return {
    Wallet,
    RouletteGame,
    RouletteBet,
    Jackpot
  };
};
