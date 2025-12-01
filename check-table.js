// Check if yield_curves table exists
require('dotenv').config({ path: './finserve-api/.env' });
const db = require('./finserve-api/app/models');

async function checkTable() {
  try {
    await db.sequelize.authenticate();
    console.log('Connected to database');

    // Check if table exists
    const [results] = await db.sequelize.query("SHOW TABLES LIKE 'yield_curves'");
    if (results.length > 0) {
      console.log('✓ Table yield_curves exists');

      // Get table structure
      const [columns] = await db.sequelize.query("DESCRIBE yield_curves");
      console.log('Table structure:');
      columns.forEach(col => {
        console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
      });
    } else {
      console.log('✗ Table yield_curves does not exist');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.sequelize.close();
  }
}

checkTable();