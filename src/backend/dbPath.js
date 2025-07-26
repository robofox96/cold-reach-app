const { app } = require('electron');
const path = require('node:path');
const fs = require('fs');

const dbPath = path.join(app.getPath('userData'), 'users.db');
const oldDbPath = path.join(__dirname, '../../users.db');

// Move old DB if it exists and new one does not
if (fs.existsSync(oldDbPath) && !fs.existsSync(dbPath)) {
  fs.copyFileSync(oldDbPath, dbPath);
  // Optionally: fs.unlinkSync(oldDbPath);
}

module.exports = dbPath;