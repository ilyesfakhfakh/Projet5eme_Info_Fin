module.exports = (sequelize, Sequelize) => {
  const Wallet = sequelize.define(
    'wallet',
    {
      wallet_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      balance: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 1000.00,
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'USD',
        allowNull: false
      },
      locked_balance: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0.00,
        allowNull: false
      },
      total_wagered: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0.00,
        allowNull: false
      },
      total_won: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0.00,
        allowNull: false
      }
    },
    {
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['user_id']
        }
      ]
    }
  );

  return Wallet;
};
