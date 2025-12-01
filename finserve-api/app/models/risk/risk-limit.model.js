module.exports = (sequelize, Sequelize) => {
  const RiskLimit = sequelize.define(
    'risk_limits',
    {
      limit_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      portfolio_id: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Portfolio-specific limit, null for global limits',
      },
      trader_id: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Trader-specific limit, null for non-trader limits',
      },
      desk_id: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Desk-specific limit, null for non-desk limits',
      },
      instrument_type: {
        type: Sequelize.ENUM('ALL', 'BOND', 'EQUITY', 'DERIVATIVE', 'FX', 'COMMODITY'),
        allowNull: false,
        defaultValue: 'ALL',
      },
      limit_type: {
        type: Sequelize.ENUM('EXPOSURE', 'VAR', 'PNL_MAX', 'STRESS_LOSS', 'DV01', 'CONVEXITY'),
        allowNull: false,
      },
      limit_value: {
        type: Sequelize.DECIMAL(20, 2),
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'EUR',
      },
      time_horizon: {
        type: Sequelize.ENUM('INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'),
        allowNull: false,
        defaultValue: 'DAILY',
      },
      confidence_level: {
        type: Sequelize.DECIMAL(5, 4),
        allowNull: true,
        defaultValue: 0.95,
        comment: 'For VaR calculations (0.95 = 95%)',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      breach_action: {
        type: Sequelize.ENUM('ALERT', 'RESTRICT', 'BLOCK'),
        allowNull: false,
        defaultValue: 'ALERT',
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      approved_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      approval_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'risk_limits',
      underscored: true,
      timestamps: true,
    }
  );

  return RiskLimit;
};
