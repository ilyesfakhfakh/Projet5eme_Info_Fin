module.exports = (sequelize, Sequelize) => {
  const Position = sequelize.define(
    'positions',
    {
      position_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      portfolio_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      asset_id: {
        type: Sequelize.UUID,
      },
      asset_symbol: {
        type: Sequelize.STRING(50),
      },
      asset_type: {
        type: Sequelize.STRING(30),
      },
      quantity: {
        type: Sequelize.DECIMAL(28, 10),
        allowNull: false,
        defaultValue: 0,
      },
      average_price: {
        type: Sequelize.DECIMAL(18, 6),
        allowNull: false,
        defaultValue: 0,
      },
      current_price: {
        type: Sequelize.DECIMAL(18, 6),
        allowNull: false,
        defaultValue: 0,
      },
      market_value: {
        type: Sequelize.DECIMAL(18, 4),
        allowNull: false,
        defaultValue: 0,
      },
      unrealized_pl: {
        type: Sequelize.DECIMAL(18, 4),
        allowNull: false,
        defaultValue: 0,
      },
      unrealized_pl_percentage: {
        type: Sequelize.DECIMAL(9, 4),
        allowNull: false,
        defaultValue: 0,
      },
      open_date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      last_update_date: {
        type: Sequelize.DATE,
      },
      is_archived: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: 'positions',
      underscored: true,
      timestamps: true,
    }
  );

  return Position;
};
