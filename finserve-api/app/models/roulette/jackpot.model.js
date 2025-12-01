module.exports = (sequelize, Sequelize) => {
  const Jackpot = sequelize.define(
    'jackpot',
    {
      jackpot_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      current_amount: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 1000.00,
        allowNull: false
      },
      contribution_rate: {
        type: Sequelize.DECIMAL(5, 4),
        defaultValue: 0.01,
        allowNull: false,
        comment: 'Percentage of each bet that goes to jackpot (e.g., 0.01 = 1%)'
      },
      last_winner: {
        type: Sequelize.STRING,
        allowNull: true
      },
      last_win_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true
      },
      last_win_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      total_paid: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0.00,
        allowNull: false,
        comment: 'Total amount paid out in jackpots'
      }
    },
    {
      timestamps: true,
      underscored: true
    }
  );

  return Jackpot;
};
