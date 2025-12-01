require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const path = require('path');

module.exports = {
  development: {
    // MySQL configuration (now active)
    username: process.env.DB_USER || process.env.USER || 'root',
    password: process.env.DB_PASSWORD || process.env.PASSWORD || '',
    database: process.env.DB || 'finserve',
    host: process.env.HOST || 'localhost',
    dialect: 'mysql',
    logging: false

    // SQLite configuration (commented out)
    // dialect: 'sqlite',
    // storage: path.join(__dirname, '..', 'database.sqlite'),
    // logging: false
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
