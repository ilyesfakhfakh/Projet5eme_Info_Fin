const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err.message);
    return;
  }
  console.log('Connected to SQLite database');
});

db.serialize(() => {
  db.get("SELECT COUNT(*) as count FROM portfolios", (err, row) => {
    if (err) {
      console.error('Error querying portfolios:', err.message);
    } else {
      console.log(`SQLite portfolios table has ${row.count} records`);
    }
    db.close();
  });
});