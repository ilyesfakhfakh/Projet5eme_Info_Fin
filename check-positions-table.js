require('dotenv').config({ path: './finserve-api/.env' });
const db = require('./finserve-api/app/models');

async function checkPositionsTable() {
  try {
    console.log('Checking positions table structure...');

    await db.sequelize.authenticate();
    console.log('Database connected');

    // Check table structure
    const [columns] = await db.sequelize.query("PRAGMA table_info(positions)");
    console.log('Positions table columns:');
    columns.forEach(col => {
      console.log(`- ${col.name}: ${col.type} (notnull: ${col.notnull})`);
    });

    // Check if is_archived column exists
    const isArchivedColumn = columns.find(col => col.name === 'is_archived');
    if (isArchivedColumn) {
      console.log('✅ is_archived column exists');
    } else {
      console.log('❌ is_archived column is missing');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await db.sequelize.close();
  }
}

checkPositionsTable();