// Migration script to add validation workflow fields to stress_scenarios table
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const db = require('./app/models');

async function migrateStressScenarios() {
  console.log('🔄 Starting stress scenarios validation fields migration...');

  try {
    await db.sequelize.authenticate();
    console.log('✅ Database connection established');

    // Check current table structure
    console.log('📋 Checking current stress_scenarios table structure...');

    const [columns] = await db.sequelize.query("DESCRIBE stress_scenarios");
    console.log('Current columns:', columns.map(col => col.Field));

    // Add new validation columns
    const newColumns = [
      'validation_status',
      'validation_notes',
      'validated_by',
      'validation_date'
    ];

    const existingColumns = columns.map(col => col.Field);
    const columnsToAdd = newColumns.filter(col => !existingColumns.includes(col));

    if (columnsToAdd.length > 0) {
      console.log('➕ Adding new validation columns:', columnsToAdd);

      for (const column of columnsToAdd) {
        let sql = '';
        switch (column) {
          case 'validation_status':
            sql = `ALTER TABLE stress_scenarios ADD COLUMN validation_status TEXT DEFAULT 'DRAFT'`;
            break;
          case 'validation_notes':
            sql = `ALTER TABLE stress_scenarios ADD COLUMN validation_notes TEXT`;
            break;
          case 'validated_by':
            sql = `ALTER TABLE stress_scenarios ADD COLUMN validated_by TEXT`;
            break;
          case 'validation_date':
            sql = `ALTER TABLE stress_scenarios ADD COLUMN validation_date DATETIME`;
            break;
        }

        if (sql) {
          await db.sequelize.query(sql);
          console.log(`✅ Added column: ${column}`);
        }
      }
    } else {
      console.log('ℹ️ All validation columns already exist');
    }

    // Update existing scenarios to have proper validation status
    console.log('🔄 Updating existing scenarios validation status...');
    await db.sequelize.query(`
      UPDATE stress_scenarios
      SET validation_status = 'VALIDATED',
          validated_by = created_by,
          validation_date = created_at
      WHERE validation_status IS NULL OR validation_status = ''
    `);

    console.log('✅ Migration completed successfully!');

    // Verify the migration
    const [updatedColumns] = await db.sequelize.query("DESCRIBE stress_scenarios");
    console.log('Updated columns:', updatedColumns.map(col => col.Field));

    // Test a query to make sure it works
    const testScenarios = await db.stress_scenarios.findAll({ limit: 1 });
    console.log('✅ Test query successful, found', testScenarios.length, 'scenarios');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await db.sequelize.close();
    process.exit(0);
  }
}

migrateStressScenarios();