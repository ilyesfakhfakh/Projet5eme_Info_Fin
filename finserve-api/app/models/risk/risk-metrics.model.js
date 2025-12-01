module.exports = (sequelize, Sequelize) => {
  const RiskMetric = sequelize.define(
    'risk_metrics',
    {
      metric_id: {
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
      metric_type: {
        type: Sequelize.ENUM('VAR', 'CVAR', 'EXPOSURE', 'PNL_VAR', 'STRESS_LOSS', 'DV01', 'CONVEXITY', 'DELTA', 'GAMMA', 'VEGA', 'THETA', 'RHO'),
        allowNull: false,
      },
      value: {
        type: Sequelize.DECIMAL(20, 6),
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'EUR',
      },
      confidence_level: {
        type: Sequelize.DECIMAL(5, 4),
        allowNull: true,
        defaultValue: 0.95,
        comment: 'For VaR calculations',
      },
      time_horizon_days: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Time horizon in trading days',
      },
      instrument_type: {
        type: Sequelize.ENUM('ALL', 'BOND', 'EQUITY', 'DERIVATIVE', 'FX', 'COMMODITY'),
        allowNull: false,
        defaultValue: 'ALL',
      },
      calculation_method: {
        type: Sequelize.ENUM('HISTORICAL', 'PARAMETRIC', 'MCS', 'DELTA_NORMAL'),
        allowNull: false,
        defaultValue: 'HISTORICAL',
      },
      status: {
        type: Sequelize.ENUM('CALCULATED', 'VALIDATED', 'ARCHIVED'),
        allowNull: false,
        defaultValue: 'CALCULATED',
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Additional calculation metadata (volatility, correlations, etc.)',
      },
    },
    {
      tableName: 'risk_metrics',
      underscored: true,
      timestamps: true,
      indexes: [
        {
          fields: ['portfolio_id', 'calculation_date', 'metric_type'],
        },
        {
          fields: ['metric_type', 'status'],
        },
      ],
    }
  );

  return RiskMetric;
};