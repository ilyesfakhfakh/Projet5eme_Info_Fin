// Check foreign key constraints
require('dotenv').config({ path: './finserve-api/.env' });
const db = require('./finserve-api/app/models');

async function checkForeignKeys() {
  try {
    await db.sequelize.authenticate();
    console.log('Connected to database');

    // Check foreign keys for yield_curves table
    const [fks] = await db.sequelize.query(`
      SELECT
        TABLE_NAME,
        COLUMN_NAME,
        CONSTRAINT_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM
        INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE
        REFERENCED_TABLE_SCHEMA = DATABASE() AND
        TABLE_NAME = 'yield_curves'
    `);

    console.log('Foreign keys for yield_curves:');
    if (fks.length > 0) {
      fks.forEach(fk => {
        console.log(`  ${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
      });
    } else {
      console.log('  No foreign keys found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.sequelize.close();
  }
}

checkForeignKeys();