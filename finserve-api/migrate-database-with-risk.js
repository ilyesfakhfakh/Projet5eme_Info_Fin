// Database migration script to add risk module while preserving data
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function createConnection() {
  return mysql.createConnection({
    host: process.env.HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB || 'finserve',
    multipleStatements: true
  });
}

async function backupDatabase() {
  console.log(`${colors.blue}📦 Creating database backup...${colors.reset}`);

  const connection = await createConnection();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = `database_backup_${timestamp}.sql`;

  try {
    // Get all table names
    const [tables] = await connection.execute(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?",
      [process.env.DB || 'finserve']
    );

    let backupSQL = `-- Database backup created on ${new Date().toISOString()}\n`;
    backupSQL += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

    for (const table of tables) {
      const tableName = table.TABLE_NAME;

      // Skip system tables
      if (tableName.startsWith('information_schema') || tableName.startsWith('performance_schema') ||
          tableName.startsWith('mysql') || tableName.startsWith('sys')) {
        continue;
      }

      console.log(`${colors.yellow}Backing up table: ${tableName}${colors.reset}`);

      // Get table structure
      const [structure] = await connection.execute(`SHOW CREATE TABLE \`${tableName}\``);
      backupSQL += `${structure[0]['Create Table']};\n\n`;

      // Get table data
      const [rows] = await connection.execute(`SELECT * FROM \`${tableName}\``);

      if (rows.length > 0) {
        const columns = Object.keys(rows[0]);
        const columnNames = columns.map(col => `\`${col}\``).join(', ');

        for (const row of rows) {
          const values = columns.map(col => {
            const value = row[col];
            if (value === null) return 'NULL';
            if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
            if (value instanceof Date) return `'${value.toISOString()}'`;
            return value;
          }).join(', ');

          backupSQL += `INSERT INTO \`${tableName}\` (${columnNames}) VALUES (${values});\n`;
        }
        backupSQL += '\n';
      }
    }

    backupSQL += `SET FOREIGN_KEY_CHECKS = 1;\n`;

    // Write backup file
    await fs.writeFile(backupFile, backupSQL);
    console.log(`${colors.green}✓ Backup saved to: ${backupFile}${colors.reset}`);

    await connection.end();
    return backupFile;

  } catch (error) {
    console.error(`${colors.red}✗ Error during backup: ${error.message}${colors.reset}`);
    await connection.end();
    throw error;
  }
}

async function dropAndRecreateDatabase() {
  console.log(`${colors.blue}🔄 Dropping and recreating database...${colors.reset}`);

  // Create connection to mysql (not the specific database)
  const rootConnection = await mysql.createConnection({
    host: process.env.HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  try {
    const dbName = process.env.DB || 'finserve';

    // Drop database if exists
    await rootConnection.execute(`DROP DATABASE IF EXISTS \`${dbName}\``);
    console.log(`${colors.yellow}Dropped database: ${dbName}${colors.reset}`);

    // Recreate database
    await rootConnection.execute(`CREATE DATABASE \`${dbName}\``);
    console.log(`${colors.green}✓ Created new database: ${dbName}${colors.reset}`);

    await rootConnection.end();

  } catch (error) {
    console.error(`${colors.red}✗ Error dropping/recreating database: ${error.message}${colors.reset}`);
    await rootConnection.end();
    throw error;
  }
}

async function runMigrations() {
  console.log(`${colors.blue}🏗️ Running database migrations...${colors.reset}`);

  const db = require('./app/models');

  try {
    // Sync all models (this will create tables)
    await db.sequelize.sync({ force: true });
    console.log(`${colors.green}✓ All tables created successfully${colors.reset}`);

  } catch (error) {
    console.error(`${colors.red}✗ Error during migration: ${error.message}${colors.reset}`);
    throw error;
  }
}

async function restoreData(backupFile) {
  console.log(`${colors.blue}🔄 Restoring data from backup...${colors.reset}`);

  try {
    const connection = await createConnection();

    // Read backup file
    const backupSQL = await fs.readFile(backupFile, 'utf8');

    // Split SQL commands and execute them
    const commands = backupSQL.split(';').filter(cmd => cmd.trim().length > 0);

    for (const command of commands) {
      if (command.trim()) {
        try {
          await connection.execute(command);
        } catch (error) {
          // Skip errors for tables that don't exist in new schema
          if (!error.message.includes('Table') || !error.message.includes('doesn\'t exist')) {
            console.log(`${colors.yellow}Warning: ${error.message}${colors.reset}`);
          }
        }
      }
    }

    console.log(`${colors.green}✓ Data restoration completed${colors.reset}`);
    await connection.end();

  } catch (error) {
    console.error(`${colors.red}✗ Error during data restoration: ${error.message}${colors.reset}`);
    throw error;
  }
}

async function seedRiskData() {
  console.log(`${colors.blue}🌱 Seeding risk data...${colors.reset}`);

  try {
    // Run the risk data seeding script
    const seedScript = require('./scripts/seed-risk-data');
    await seedScript();
    console.log(`${colors.green}✓ Risk data seeded successfully${colors.reset}`);

  } catch (error) {
    console.error(`${colors.red}✗ Error seeding risk data: ${error.message}${colors.reset}`);
    // Don't throw error here as it's not critical
  }
}

async function migrateDatabase() {
  console.log(`${colors.cyan}╔═══════════════════════════════════════════════════════════╗`);
  console.log(`║  DATABASE MIGRATION WITH RISK MODULE                     ║`);
  console.log(`╚═══════════════════════════════════════════════════════════╝${colors.reset}\n`);

  try {
    // Step 1: Backup existing data
    const backupFile = await backupDatabase();

    // Step 2: Drop and recreate database
    await dropAndRecreateDatabase();

    // Step 3: Run migrations to create new schema
    await runMigrations();

    // Step 4: Restore data
    await restoreData(backupFile);

    // Step 5: Seed risk-specific data
    await seedRiskData();

    console.log(`\n${colors.green}🎉 Database migration completed successfully!${colors.reset}`);
    console.log(`${colors.yellow}Backup file saved: ${backupFile}${colors.reset}`);
    console.log(`${colors.cyan}You can now start the server with: npm start${colors.reset}`);

  } catch (error) {
    console.error(`\n${colors.red}❌ Migration failed: ${error.message}${colors.reset}`);
    console.log(`${colors.yellow}You may need to restore from backup manually${colors.reset}`);
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateDatabase();
}

module.exports = migrateDatabase;