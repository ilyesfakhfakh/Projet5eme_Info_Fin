const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'sqlite_dump.sql');
const outputPath = path.join(__dirname, 'mysql_dump.sql');

let sql = fs.readFileSync(inputPath, 'utf8');

// Convert UUID to VARCHAR(36)
sql = sql.replace(/\bUUID\b/g, 'VARCHAR(36)');

// Convert JSON to TEXT
sql = sql.replace(/\bJSON\b/g, 'TEXT');

// Convert BOOLEAN to TINYINT(1)
sql = sql.replace(/\bBOOLEAN\b/g, 'TINYINT(1)');

// Escape reserved words
sql = sql.replace(/\bchange\b/g, '`change`');
sql = sql.replace(/\border\b/g, '`order`');
sql = sql.replace(/\bvalues\b/g, '`values`');
sql = sql.replace(/\bsignal\b/g, '`signal`');

// Remove backticks around table names in CREATE TABLE
sql = sql.replace(/`([^`]+)`/g, '$1');

// Fix AUTOINCREMENT to AUTO_INCREMENT
sql = sql.replace(/AUTOINCREMENT/g, 'AUTO_INCREMENT');

// Remove PRAGMA statements if any
sql = sql.replace(/PRAGMA.*;/g, '');

// Clean up extra newlines at start of statements
sql = sql.replace(/^\n\n/gm, '');
sql = sql.replace(/\n\n\n/g, '\n\n');

// Write to output
fs.writeFileSync(outputPath, sql);
console.log('Converted SQL saved to', outputPath);