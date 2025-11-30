module.exports = {
  HOST: process.env.HOST || 'localhost',
  USER: process.env.DB_USER || process.env.USER || 'root',
  PASSWORD: process.env.DB_PASSWORD || process.env.PASSWORD || '',
  DB: process.env.DB || 'finserve',
  dialect: "mysql",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};
