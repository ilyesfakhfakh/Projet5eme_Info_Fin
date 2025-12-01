module.exports = (sequelize, Sequelize) => {
  const InterestRateSensitivity = sequelize.define(
    'interest_rate_sensitivities',
    {
      sensitivity_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      portfolio_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      calculation_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      scenario_type: {
        type: Sequelize.ENUM('PARALLEL_UP', 'PARALLEL_DOWN', 'STEEPENING', 'FLATTENING', 'TWIST'),
        allowNull: false,
      },
      shock_bps: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 100,
        comment: 'Shock in basis points',
      },
      assets_pv_change: {
        type: Sequelize.DECIMAL(20, 2),
        allowNull: false,
        defaultValue: 0,
      },
      liabilities_pv_change: {
        type: Sequelize.DECIMAL(20, 2),
        allowNull: false,
        defaultValue: 0,
      },
      net_pv_change: {
        type: Sequelize.DECIMAL(20, 2),
        allowNull: false,
        defaultValue: 0,
      },
      assets_duration: {
        type: Sequelize.DECIMAL(10, 4),
        allowNull: false,
        defaultValue: 0,
      },
      liabilities_duration: {
        type: Sequelize.DECIMAL(10, 4),
        allowNull: false,
        defaultValue: 0,
      },
      duration_gap: {
        type: Sequelize.DECIMAL(10, 4),
        allowNull: false,
        defaultValue: 0,
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'EUR',
      },
      yield_curve_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'Reference to the yield curve used for calculation',
      },
      status: {
        type: Sequelize.ENUM('DRAFT', 'VALIDATED', 'ARCHIVED'),
        allowNull: false,
        defaultValue: 'DRAFT',
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
      },
    },
    {
      tableName: 'interest_rate_sensitivities',
      underscored: true,
      timestamps: true,
    }
  );

  return InterestRateSensitivity;
};