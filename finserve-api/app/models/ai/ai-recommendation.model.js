module.exports = (sequelize, Sequelize) => {
  const AIRecommendation = sequelize.define(
    'ai_recommendations',
    {
      recommendation_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      agent_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      asset_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      recommendation_type: {
        type: Sequelize.ENUM('BUY', 'SELL', 'HOLD'),
        allowNull: false,
      },
      confidence: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
      },
      reasoning: {
        type: Sequelize.TEXT,
      },
      target_price: {
        type: Sequelize.DECIMAL(18, 6),
      },
      time_horizon: {
        type: Sequelize.STRING(50),
      },
      creation_date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      status: {
        type: Sequelize.STRING(50),
        defaultValue: 'ACTIVE',
      },
    },
    {
      tableName: 'ai_recommendations',
      underscored: true,
      timestamps: true,
    }
  );

  return AIRecommendation;
};
