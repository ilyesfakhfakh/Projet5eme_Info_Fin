module.exports = (sequelize, Sequelize) => {
  const AlmPosition = sequelize.define(
    'alm_positions',
    {
      alm_position_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      portfolio_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      position_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'Reference to the original position',
      },
      instrument_type: {
        type: Sequelize.ENUM('BOND', 'LOAN', 'DEPOSIT', 'EQUITY', 'DERIVATIVE', 'OTHER'),
        allowNull: false,
      },
      asset_liability: {
        type: Sequelize.ENUM('ASSET', 'LIABILITY'),
        allowNull: false,
      },
      nominal_amount: {
        type: Sequelize.DECIMAL(20, 2),
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'EUR',
      },
      maturity_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      coupon_rate: {
        type: Sequelize.DECIMAL(10, 4),
        allowNull: true,
        defaultValue: 0,
      },
      frequency: {
        type: Sequelize.ENUM('ANNUAL', 'SEMI_ANNUAL', 'QUARTERLY', 'MONTHLY'),
        allowNull: true,
        defaultValue: 'ANNUAL',
      },
      cashflows: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Array of {date: string, amount: number, type: string} objects',
      },
      market_value: {
        type: Sequelize.DECIMAL(20, 2),
        allowNull: false,
        defaultValue: 0,
      },
      duration: {
        type: Sequelize.DECIMAL(10, 4),
        allowNull: true,
      },
      convexity: {
        type: Sequelize.DECIMAL(10, 4),
        allowNull: true,
      },
      dv01: {
        type: Sequelize.DECIMAL(15, 6),
        allowNull: true,
      },
      yield_to_maturity: {
        type: Sequelize.DECIMAL(10, 4),
        allowNull: true,
      },
      modified_duration: {
        type: Sequelize.DECIMAL(10, 4),
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
      },
    },
    {
      tableName: 'alm_positions',
      underscored: true,
      timestamps: true,
    }
  );

  return AlmPosition;
};