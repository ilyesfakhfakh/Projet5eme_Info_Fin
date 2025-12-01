module.exports = (sequelize, Sequelize) => {
  const Portfolio = sequelize.define(
    'portfolios',
    {
      portfolio_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      portfolio_name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      base_currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'EUR',
        validate: {
          isIn: [['EUR', 'USD', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD']],
        },
      },
      initial_balance: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0,
      },
      current_balance: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0,
      },
      total_value: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0,
      },
      profit_loss: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0,
      },
      profit_loss_percentage: {
        type: Sequelize.DECIMAL(9, 4),
        allowNull: false,
        defaultValue: 0,
      },
      creation_date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      last_update_date: {
        type: Sequelize.DATE,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: 'portfolios',
      underscored: true,
      timestamps: true,
    }
  );

  return Portfolio;
};
