module.exports = (sequelize, Sequelize) => {
  const RiskAssessment = sequelize.define(
    'risk_assessments',
    {
      assessment_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      portfolio_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      order_id: {
        type: Sequelize.UUID,
      },
      risk_score: {
        type: Sequelize.DECIMAL(9, 4),
        allowNull: false,
        defaultValue: 0,
      },
      volatility: {
        type: Sequelize.DECIMAL(9, 4),
        allowNull: false,
        defaultValue: 0,
      },
      max_drawdown: {
        type: Sequelize.DECIMAL(9, 4),
        allowNull: false,
        defaultValue: 0,
      },
      sharpe_ratio: {
        type: Sequelize.DECIMAL(9, 4),
        allowNull: false,
        defaultValue: 0,
      },
      recommendations: {
        type: Sequelize.TEXT,
      },
      assessment_date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    },
    {
      tableName: 'risk_assessments',
      underscored: true,
      timestamps: true,
    }
  );

  return RiskAssessment;
};
