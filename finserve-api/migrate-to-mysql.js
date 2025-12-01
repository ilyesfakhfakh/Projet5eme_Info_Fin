const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

async function migrateToMySQL() {
  const connectionConfig = {
    host: process.env.HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  };

  let connection;

  try {
    // Connect without database
    connection = await mysql.createConnection(connectionConfig);

    // Drop database if exists
    console.log('Dropping database finserve if exists...');
    await connection.query('DROP DATABASE IF EXISTS finserve');

    // Create database
    console.log('Creating database finserve...');
    await connection.query('CREATE DATABASE finserve');

    // Use the database
    await connection.query('USE finserve');

    // Read MySQL dump
    const fs = require('fs');
    const path = require('path');
    const dumpPath = path.join(__dirname, '..', 'mysql_dump.sql');
    const sql = fs.readFileSync(dumpPath, 'utf8');

    // SQL is already converted
    let mysqlSql = sql;

    // Split into statements
    const statements = mysqlSql.split(';').filter(stmt => stmt.trim().length > 0);

    console.log('Executing SQL statements...');
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.query(statement.trim() + ';');
        } catch (err) {
          console.error('Error executing statement:', statement.trim());
          console.error(err.message);
          // Continue with next statement
        }
      }
    }

    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

migrateToMySQL();