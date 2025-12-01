// Check actual database schema for risk tables
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const db = require('./app/models');

async function checkSchema() {
  try {
    await db.sequelize.authenticate();
    console.log('Database connection established');

    console.log('\nChecking risk_limits table schema...');
    const [limitColumns] = await db.sequelize.query("PRAGMA table_info(risk_limits)");

    console.log('Current risk_limits columns:');
    limitColumns.forEach(col => {
      console.log(`  - ${col.name}: ${col.type} ${col.notnull ? '(NOT NULL)' : '(NULL)'}`);
    });

    console.log('\nChecking risk_metrics table schema...');
    const [metricsColumns] = await db.sequelize.query("PRAGMA table_info(risk_metrics)");

    console.log('Current risk_metrics columns:');
    metricsColumns.forEach(col => {
      console.log(`  - ${col.name}: ${col.type} ${col.notnull ? '(NOT NULL)' : '(NULL)'}`);
    });

  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    await db.sequelize.close();
  }
}

checkSchema();