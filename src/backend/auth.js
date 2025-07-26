const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const dbPath = require('./dbPath');

const db = new sqlite3.Database(dbPath);

// Create users table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )
`);

function signup(username, password, callback) {
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) return callback(err);
    db.run(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hash],
      function (err) {
        callback(err, this.lastID);
      }
    );
  });
}

function login(username, password, callback) {
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
    if (err) return callback(err);
    if (!row) return callback(null, false);
    bcrypt.compare(password, row.password, (err, res) => {
      if (err) return callback(err);
      callback(null, res ? row : false);
    });
  });
}

module.exports = { signup, login };