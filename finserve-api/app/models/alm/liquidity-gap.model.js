module.exports = (sequelize, Sequelize) => {
  const LiquidityGap = sequelize.define(
    'liquidity_gaps',
    {
      liquidity_gap_id: {
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
      bucket_0_1m: {
        type: Sequelize.DECIMAL(20, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Gap for 0-1 month maturity',
      },
      bucket_1_3m: {
        type: Sequelize.DECIMAL(20, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Gap for 1-3 months maturity',
      },
      bucket_3_12m: {
        type: Sequelize.DECIMAL(20, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Gap for 3-12 months maturity',
      },
      bucket_1_3y: {
        type: Sequelize.DECIMAL(20, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Gap for 1-3 years maturity',
      },
      bucket_3_5y: {
        type: Sequelize.DECIMAL(20, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Gap for 3-5 years maturity',
      },
      bucket_5y_plus: {
        type: Sequelize.DECIMAL(20, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Gap for 5+ years maturity',
      },
      total_gap: {
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
        allowNull: false,
      },
    },
    {
      tableName: 'liquidity_gaps',
      underscored: true,
      timestamps: true,
    }
  );

  return LiquidityGap;
};