module.exports = (sequelize, Sequelize) => {
  const ScenarioAnalysis = sequelize.define(
    'scenario_analyses',
    {
      scenario_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      portfolio_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      scenario_type: {
        type: Sequelize.ENUM('STRESS_TEST', 'WHAT_IF', 'BACKTESTING'),
        allowNull: false,
      },
      scenario_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      parameters: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      results: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      impact_var: {
        type: Sequelize.DECIMAL(9, 4),
        allowNull: false,
        defaultValue: 0,
      },
      impact_drawdown: {
        type: Sequelize.DECIMAL(9, 4),
        allowNull: false,
        defaultValue: 0,
      },
      created_date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    },
    {
      tableName: 'scenario_analyses',
      underscored: true,
      timestamps: true,
    }
  );

  return ScenarioAnalysis;
};