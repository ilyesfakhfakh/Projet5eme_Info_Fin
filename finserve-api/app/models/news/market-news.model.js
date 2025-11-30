module.exports = (sequelize, Sequelize) => {
  const MarketNews = sequelize.define(
    'market_news',
    {
      news_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      headline: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      priority: {
        type: Sequelize.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
        allowNull: false,
        defaultValue: 'LOW',
      },
      tags: {
        type: Sequelize.JSON,
        defaultValue: [],
      },
    },
    {
      tableName: 'market_news',
      underscored: true,
      timestamps: true,
    }
  );

  return MarketNews;
};
