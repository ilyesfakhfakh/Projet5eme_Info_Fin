module.exports = (sequelize, Sequelize) => {
  const CashflowProjection = sequelize.define(
    'cashflow_projections',
    {
      cashflow_projection_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      portfolio_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      projection_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      frequency: {
        type: Sequelize.ENUM('MONTHLY', 'QUARTERLY'),
        allowNull: false,
        defaultValue: 'MONTHLY',
      },
      horizon_years: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 5,
        validate: {
          min: 1,
          max: 30,
        },
      },
      cashflows: {
        type: Sequelize.JSON,
        allowNull: false,
        comment: 'Array of projected cashflows by period',
      },
      total_assets: {
        type: Sequelize.DECIMAL(20, 2),
        allowNull: false,
        defaultValue: 0,
      },
      total_liabilities: {
        type: Sequelize.DECIMAL(20, 2),
        allowNull: false,
        defaultValue: 0,
      },
      net_cashflow: {
        type: Sequelize.DECIMAL(20, 2),
        allowNull: false,
        defaultValue: 0,
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'EUR',
      },
      status: {
        type: Sequelize.ENUM('DRAFT', 'VALIDATED', 'ARCHIVED'),
        allowNull: false,
        defaultValue: 'DRAFT',
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    },
    {
      tableName: 'cashflow_projections',
      underscored: true,
      timestamps: true,
    }
  );

  return CashflowProjection;
};