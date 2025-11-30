const config = require('../config/db.config');

const Sequelize = require('sequelize');
const sequelize = new Sequelize(
  config.DB,
  config.USER,
  config.PASSWORD,
  {
    host: config.HOST,
    dialect: config.dialect,
    operatorsAliases: 0,
    logging: 0,
    pool: {
      max: config.pool.max,
      min: config.pool.min,
      acquire: config.pool.acquire,
      idle: config.pool.idle
    }
  }
)

const db = {}

db.Sequelize = Sequelize
db.sequelize = sequelize

const Op = db.Sequelize.Op

sequelize.authenticate().then(() => {
  console.log('Connection has been established successfully')
}).catch(err => {
  console.log('Unable to connect to the database : ', err)
})

db.users = require('./auth/user.model')(sequelize, Sequelize)
db.user_preferences = require('./auth/user-preferences.model')(sequelize, Sequelize)
db.roles = require('./auth/role.model')(sequelize, Sequelize)
db.sessions = require('./auth/session.model')(sequelize, Sequelize)
db.user_roles = require('./auth/user-roles.model')(sequelize, Sequelize)
db.email_verification_tokens = require('./auth/email-verification-token.model')(sequelize, Sequelize)
db.portfolios = require('./portfolio/portfolio.model')(sequelize, Sequelize)
db.positions = require('./portfolio/position.model')(sequelize, Sequelize)
db.transactions = require('./portfolio/transaction.model')(sequelize, Sequelize)
db.assets = require('./market/asset.model')(sequelize, Sequelize)
db.market_data = require('./market/market-data.model')(sequelize, Sequelize)
db.real_time_quotes = require('./market/realtime-quote.model')(sequelize, Sequelize)
db.historical_data = require('./market/historical-data.model')(sequelize, Sequelize)
db.price_alerts = require('./market/price-alert.model')(sequelize, Sequelize)
db.orders = require('./trading/order.model')(sequelize, Sequelize)
db.order_executions = require('./trading/order-execution.model')(sequelize, Sequelize)
db.trading_strategies = require('./trading/trading-strategy.model')(sequelize, Sequelize)
db.risk_assessments = require('./risk/risk-assessment.model')(sequelize, Sequelize)
db.risk_limits = require('./risk/risk-limit.model')(sequelize, Sequelize)
db.stop_losses = require('./risk/stop-loss.model')(sequelize, Sequelize)
db.technical_indicators = require('./indicators/technical-indicator.model')(sequelize, Sequelize)
db.indicator_values = require('./indicators/indicator-value.model')(sequelize, Sequelize)
db.charts = require('./indicators/chart.model')(sequelize, Sequelize)
db.ai_agents = require('./ai/ai-agent.model')(sequelize, Sequelize)
db.ai_recommendations = require('./ai/ai-recommendation.model')(sequelize, Sequelize)
db.market_sentiments = require('./ai/market-sentiment.model')(sequelize, Sequelize)
db.prediction_models = require('./ai/prediction-model.model')(sequelize, Sequelize)
db.courses = require('./learning/course.model')(sequelize, Sequelize)
db.lessons = require('./learning/lesson.model')(sequelize, Sequelize)
db.user_progress = require('./learning/user-progress.model')(sequelize, Sequelize)
db.quizzes = require('./learning/quiz.model')(sequelize, Sequelize)
db.news_articles = require('./news/news-article.model')(sequelize, Sequelize)
db.economic_events = require('./news/economic-event.model')(sequelize, Sequelize)
db.market_news = require('./news/market-news.model')(sequelize, Sequelize)
db.game_rooms = require('./simulation/game-room.model')(sequelize, Sequelize)
db.trading_scenarios = require('./simulation/trading-scenario.model')(sequelize, Sequelize)
db.competitions = require('./simulation/competition.model')(sequelize, Sequelize)
db.leaderboards = require('./simulation/leaderboard.model')(sequelize, Sequelize)
db.admin_dashboards = require('./admin/admin-dashboard.model')(sequelize, Sequelize)
db.system_configurations = require('./admin/system-configuration.model')(sequelize, Sequelize)
db.audit_logs = require('./admin/audit-log.model')(sequelize, Sequelize)
db.system_alerts = require('./admin/system-alert.model')(sequelize, Sequelize)

db.users.hasOne(db.user_preferences, {
  foreignKey: { name: 'user_id', allowNull: false, unique: true },
  as: 'preferences',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
})

db.user_preferences.belongsTo(db.users, {
  foreignKey: { name: 'user_id', allowNull: false, unique: true },
})

db.courses.hasMany(db.lessons, {
  foreignKey: { name: 'course_id', allowNull: false },
  as: 'lessons',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
})

db.lessons.belongsTo(db.courses, {
  foreignKey: { name: 'course_id', allowNull: false },
})

db.lessons.hasOne(db.quizzes, {
  foreignKey: { name: 'lesson_id', allowNull: false },
  as: 'quiz',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
})

db.quizzes.belongsTo(db.lessons, {
  foreignKey: { name: 'lesson_id', allowNull: false },
})

db.users.hasMany(db.user_progress, {
  foreignKey: { name: 'user_id', allowNull: false },
  as: 'progress',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
})

db.user_progress.belongsTo(db.users, {
  foreignKey: { name: 'user_id', allowNull: false },
})

db.courses.hasMany(db.user_progress, {
  foreignKey: { name: 'course_id', allowNull: false },
  as: 'user_progress',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
})

db.user_progress.belongsTo(db.courses, {
  foreignKey: { name: 'course_id', allowNull: false },
})

db.users.belongsToMany(db.roles, {
  through: db.user_roles,
  foreignKey: 'user_id',
  otherKey: 'role_id',
})
db.roles.belongsToMany(db.users, {
  through: db.user_roles,
  foreignKey: 'role_id',
  otherKey: 'user_id',
})

db.users.hasMany(db.sessions, {
  foreignKey: { name: 'user_id', allowNull: false },
  as: 'sessions',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
})
db.sessions.belongsTo(db.users, {
  foreignKey: { name: 'user_id', allowNull: false },
})

// Link audit logs to the user who performed the action
db.users.hasMany(db.audit_logs, {
  foreignKey: { name: 'user_id', allowNull: true },
  as: 'audit_logs',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
})
db.audit_logs.belongsTo(db.users, {
  foreignKey: { name: 'user_id', allowNull: true },
})

// Admin dashboard per user
db.users.hasOne(db.admin_dashboards, {
  foreignKey: { name: 'user_id', allowNull: false, unique: true },
  as: 'admin_dashboard',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
})
db.admin_dashboards.belongsTo(db.users, {
  foreignKey: { name: 'user_id', allowNull: false, unique: true },
})

// System configurations modified by users
db.users.hasMany(db.system_configurations, {
  foreignKey: { name: 'last_modified_by', allowNull: true },
  as: 'modified_configurations',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
})
db.system_configurations.belongsTo(db.users, {
  foreignKey: { name: 'last_modified_by', allowNull: true },
})

// System alerts created by users
db.users.hasMany(db.system_alerts, {
  foreignKey: { name: 'created_by', allowNull: true },
  as: 'created_alerts',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
})
db.system_alerts.belongsTo(db.users, {
  foreignKey: { name: 'created_by', allowNull: true },
})

db.users.hasMany(db.portfolios, {
  foreignKey: { name: 'user_id', allowNull: false },
  as: 'portfolios',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
})
db.portfolios.belongsTo(db.users, {
  foreignKey: { name: 'user_id', allowNull: false },
})

db.portfolios.hasMany(db.positions, {
  foreignKey: { name: 'portfolio_id', allowNull: false },
  as: 'positions',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
})
db.positions.belongsTo(db.portfolios, {
  foreignKey: { name: 'portfolio_id', allowNull: false },
})

db.portfolios.hasMany(db.transactions, {
  foreignKey: { name: 'portfolio_id', allowNull: false },
  as: 'transactions',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
})
db.transactions.belongsTo(db.portfolios, {
  foreignKey: { name: 'portfolio_id', allowNull: false },
})

db.assets.hasMany(db.market_data, {
  foreignKey: { name: 'asset_id', allowNull: false },
  as: 'market_data',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
})
db.market_data.belongsTo(db.assets, {
  foreignKey: { name: 'asset_id', allowNull: false },
})

db.assets.hasMany(db.real_time_quotes, {
  foreignKey: { name: 'asset_id', allowNull: false },
  as: 'real_time_quotes',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
})
db.real_time_quotes.belongsTo(db.assets, {
  foreignKey: { name: 'asset_id', allowNull: false },
})

db.assets.hasMany(db.historical_data, {
  foreignKey: { name: 'asset_id', allowNull: false },
  as: 'historical_data',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
})
db.historical_data.belongsTo(db.assets, {
  foreignKey: { name: 'asset_id', allowNull: false },
})

db.users.hasMany(db.price_alerts, {
  foreignKey: { name: 'user_id', allowNull: false },
  as: 'price_alerts',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
})
db.price_alerts.belongsTo(db.users, {
  foreignKey: { name: 'user_id', allowNull: false },
})

db.assets.hasMany(db.price_alerts, {
  foreignKey: { name: 'asset_id', allowNull: false },
  as: 'price_alerts',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
})
db.price_alerts.belongsTo(db.assets, {
  foreignKey: { name: 'asset_id', allowNull: false },
})

db.portfolios.hasMany(db.orders, {
  foreignKey: { name: 'portfolio_id', allowNull: false },
  as: 'orders',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
})
db.orders.belongsTo(db.portfolios, {
  foreignKey: { name: 'portfolio_id', allowNull: false },
})

db.assets.hasMany(db.orders, {
  foreignKey: { name: 'asset_id', allowNull: false },
  as: 'orders',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
})
db.orders.belongsTo(db.assets, {
  foreignKey: { name: 'asset_id', allowNull: false },
})

db.orders.hasMany(db.order_executions, {
  foreignKey: { name: 'order_id', allowNull: false },
  as: 'executions',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
})
db.order_executions.belongsTo(db.orders, {
  foreignKey: { name: 'order_id', allowNull: false },
})

db.users.hasMany(db.trading_strategies, {
  foreignKey: { name: 'user_id', allowNull: false },
  as: 'trading_strategies',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
})
db.trading_strategies.belongsTo(db.users, {
  foreignKey: { name: 'user_id', allowNull: false },
})

db.portfolios.hasMany(db.risk_assessments, {
  foreignKey: { name: 'portfolio_id', allowNull: false },
  as: 'risk_assessments',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
})
db.risk_assessments.belongsTo(db.portfolios, {
  foreignKey: { name: 'portfolio_id', allowNull: false },
})

db.orders.hasMany(db.risk_assessments, {
  foreignKey: { name: 'order_id', allowNull: true },
  as: 'risk_assessments',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
})
db.risk_assessments.belongsTo(db.orders, {
  foreignKey: { name: 'order_id', allowNull: true },
})

db.portfolios.hasMany(db.risk_limits, {
  foreignKey: { name: 'portfolio_id', allowNull: false },
  as: 'risk_limits',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
})
db.risk_limits.belongsTo(db.portfolios, {
  foreignKey: { name: 'portfolio_id', allowNull: false },
})

db.positions.hasMany(db.stop_losses, {
  foreignKey: { name: 'position_id', allowNull: false },
  as: 'stop_losses',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
})
db.stop_losses.belongsTo(db.positions, {
  foreignKey: { name: 'position_id', allowNull: false },
})

db.assets.hasMany(db.technical_indicators, {
  foreignKey: { name: 'asset_id', allowNull: false },
  as: 'technical_indicators',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
})
db.technical_indicators.belongsTo(db.assets, {
  foreignKey: { name: 'asset_id', allowNull: false },
})

db.technical_indicators.hasMany(db.indicator_values, {
  foreignKey: { name: 'indicator_id', allowNull: false },
  as: 'indicator_values',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
})
db.indicator_values.belongsTo(db.technical_indicators, {
  foreignKey: { name: 'indicator_id', allowNull: false },
})

db.assets.hasMany(db.charts, {
  foreignKey: { name: 'asset_id', allowNull: false },
  as: 'charts',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
})
db.charts.belongsTo(db.assets, {
  foreignKey: { name: 'asset_id', allowNull: false },
})

db.ai_recommendations.belongsTo(db.ai_agents, {
  foreignKey: { name: 'agent_id', allowNull: false },
})
db.ai_agents.hasMany(db.ai_recommendations, {
  foreignKey: { name: 'agent_id', allowNull: false },
  as: 'recommendations',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
})

db.ai_recommendations.belongsTo(db.assets, {
  foreignKey: { name: 'asset_id', allowNull: false },
})
db.assets.hasMany(db.ai_recommendations, {
  foreignKey: { name: 'asset_id', allowNull: false },
  as: 'ai_recommendations',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
})

db.market_sentiments.belongsTo(db.assets, {
  foreignKey: { name: 'asset_id', allowNull: false },
})
db.assets.hasMany(db.market_sentiments, {
  foreignKey: { name: 'asset_id', allowNull: false },
  as: 'market_sentiments',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
})

db.prediction_models.belongsTo(db.assets, {
  foreignKey: { name: 'asset_id', allowNull: true },
})
db.assets.hasMany(db.prediction_models, {
  foreignKey: { name: 'asset_id', allowNull: true },
  as: 'prediction_models',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
})

module.exports = db;
