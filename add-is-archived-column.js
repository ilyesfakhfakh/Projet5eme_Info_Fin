require('dotenv').config({ path: './finserve-api/.env' });
const db = require('./finserve-api/app/models');

async function addIsArchivedColumn() {
  try {
    console.log('Adding is_archived column to positions table...');

    await db.sequelize.authenticate();
    console.log('Database connected');

    // Add the is_archived column
    await db.sequelize.query(`
      ALTER TABLE positions
      ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT 0
    `);

    console.log('✅ is_archived column added successfully');

    // Verify the column was added
    const [columns] = await db.sequelize.query("PRAGMA table_info(positions)");
    const isArchivedColumn = columns.find(col => col.name === 'is_archived');
    if (isArchivedColumn) {
      console.log('✅ Column verification successful');
    } else {
      console.log('❌ Column verification failed');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await db.sequelize.close();
  }
}

addIsArchivedColumn();