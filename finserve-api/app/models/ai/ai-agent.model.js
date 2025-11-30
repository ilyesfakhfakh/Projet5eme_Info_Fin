module.exports = (sequelize, Sequelize) => {
  const AIAgent = sequelize.define(
    'ai_agents',
    {
      agent_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      agent_name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      agent_type: {
        type: Sequelize.ENUM('TRADING', 'BOT', 'ADVISOR', 'SENTIMENT_ANALYZER'),
        allowNull: false,
      },
      model_version: {
        type: Sequelize.STRING(50),
      },
      configuration: {
        type: Sequelize.JSON,
        defaultValue: {},
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      last_performance: {
        type: Sequelize.JSON,
        defaultValue: {},
      },
    },
    {
      tableName: 'ai_agents',
      underscored: true,
      timestamps: true,
    }
  );

  return AIAgent;
};
