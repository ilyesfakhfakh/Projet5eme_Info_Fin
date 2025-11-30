require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

module.exports = {
  development: {
    username: process.env.DB_USER || process.env.USER || 'root',
    password: process.env.DB_PASSWORD || process.env.PASSWORD || '',
    database: process.env.DB || 'finserve',
    host: process.env.HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  test: {
    username: process.env.DB_USER || process.env.USER || 'root',
    password: process.env.DB_PASSWORD || process.env.PASSWORD || '',
    database: process.env.DB_TEST || 'finserve_test',
    host: process.env.HOST || 'localhost',
    dialect: 'mysql',
    logging: false
  },
  production: {
    username: process.env.DB_USER || process.env.USER,
    password: process.env.DB_PASSWORD || process.env.PASSWORD,
    database: process.env.DB || 'finserve',
    host: process.env.HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000
    }
  }
};
