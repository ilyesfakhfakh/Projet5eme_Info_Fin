module.exports = (sequelize, Sequelize) => {
  const Asset = sequelize.define(
    'assets',
    {
      asset_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      symbol: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      asset_type: {
        type: Sequelize.ENUM('STOCK', 'BOND', 'COMMODITY', 'CURRENCY', 'CRYPTO'),
        allowNull: false,
      },
      exchange: {
        type: Sequelize.STRING(100),
      },
      sector: {
        type: Sequelize.STRING(100),
      },
      industry: {
        type: Sequelize.STRING(150),
      },
      market_cap: {
        type: Sequelize.DECIMAL(24, 2),
        defaultValue: 0,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      last_update_date: {
        type: Sequelize.DATE,
      },
    },
    {
      tableName: 'assets',
      underscored: true,
      timestamps: true,
    }
  );

  return Asset;
};
