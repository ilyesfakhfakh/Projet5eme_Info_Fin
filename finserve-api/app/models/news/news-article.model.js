module.exports = (sequelize, Sequelize) => {
  const NewsArticle = sequelize.define(
    'news_articles',
    {
      article_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      summary: {
        type: Sequelize.TEXT,
      },
      author: {
        type: Sequelize.STRING(150),
      },
      source: {
        type: Sequelize.STRING(150),
      },
      publish_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      category: {
        type: Sequelize.ENUM('MARKET', 'COMPANY', 'ECONOMIC', 'POLITICAL'),
        allowNull: false,
        defaultValue: 'MARKET',
      },
      related_assets: {
        type: Sequelize.JSON,
        defaultValue: [],
      },
      sentiment: {
        type: Sequelize.STRING(50),
      },
      impact_level: {
        type: Sequelize.STRING(50),
      },
    },
    {
      tableName: 'news_articles',
      underscored: true,
      timestamps: true,
    }
  );

  return NewsArticle;
};
