const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'finserve-api', 'database.sqlite');
const outputPath = path.join(__dirname, 'sqlite_dump.sql');

const db = new sqlite3.Database(dbPath);

let sql = '';

db.serialize(() => {
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
      console.error(err);
      return;
    }

    tables.forEach((table) => {
      if (table.name === 'sqlite_sequence') return; // Skip internal table

      // Get CREATE TABLE statement
      db.get(`SELECT sql FROM sqlite_master WHERE name='${table.name}'`, (err, row) => {
        if (err) {
          console.error(err);
          return;
        }
        if (row && row.sql) {
          sql += row.sql + ';\n\n';
        }

        // Get data
        db.all(`SELECT * FROM ${table.name}`, (err, rows) => {
          if (err) {
            console.error(err);
            return;
          }

          if (rows.length > 0) {
            const columns = Object.keys(rows[0]).join(', ');
            sql += `INSERT INTO ${table.name} (${columns}) VALUES\n`;

            const values = rows.map(row => {
              const vals = Object.values(row).map(val => {
                if (val === null) return 'NULL';
                if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
                return val;
              });
              return `(${vals.join(', ')})`;
            });

            sql += values.join(',\n') + ';\n\n';
          }

          // After processing all tables, write to file
          if (table === tables[tables.length - 1]) {
            fs.writeFileSync(outputPath, sql);
            console.log('SQLite dump created at', outputPath);
            db.close();
          }
        });
      });
    });
  });
});