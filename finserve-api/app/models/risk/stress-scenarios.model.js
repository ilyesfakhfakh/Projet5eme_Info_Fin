module.exports = (sequelize, Sequelize) => {
  const StressScenario = sequelize.define(
    'stress_scenarios',
    {
      scenario_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      scenario_type: {
        type: Sequelize.ENUM('HISTORICAL', 'HYPOTHETICAL', 'REVERSE_STRESS'),
        allowNull: false,
        defaultValue: 'HYPOTHETICAL',
      },
      market_shocks: {
        type: Sequelize.JSON,
        allowNull: false,
        comment: 'JSON object with market shocks: {equity: -0.1, rates: 0.02, fx: {...}, commodities: {...}}',
      },
      probability: {
        type: Sequelize.DECIMAL(5, 4),
        allowNull: true,
        comment: 'Probability of occurrence (for historical scenarios)',
      },
      time_horizon_days: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
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
      approved_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      approval_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      validation_status: {
        type: Sequelize.ENUM('DRAFT', 'PENDING_VALIDATION', 'VALIDATED', 'REJECTED'),
        allowNull: false,
        defaultValue: 'DRAFT',
      },
      validation_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      validated_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      validation_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'stress_scenarios',
      underscored: true,
      timestamps: true,
    }
  );

  return StressScenario;
};