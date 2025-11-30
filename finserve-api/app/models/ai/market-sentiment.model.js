module.exports = (sequelize, Sequelize) => {
  const MarketSentiment = sequelize.define(
    'market_sentiments',
    {
      sentiment_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      asset_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      sentiments: {
        type: Sequelize.JSON,
        defaultValue: {},
      },
      keywords: {
        type: Sequelize.JSON,
        defaultValue: [],
      },
      news_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      social_media_mentions: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
    },
    {
      tableName: 'market_sentiments',
      underscored: true,
      timestamps: true,
    }
  );

  return MarketSentiment;
};
