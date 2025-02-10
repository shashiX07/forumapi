// post.js (SQLite setup)
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

// Initialize database connection
async function initializeDB() {
  return open({
    filename: './forum.db',
    driver: sqlite3.Database
  });
}

// Create tables
async function setupSchema(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      likes INTEGER DEFAULT 0,
      likedBy TEXT DEFAULT '[]',
      username TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      postId TEXT NOT NULL,
      text TEXT NOT NULL,
      username TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(postId) REFERENCES posts(id)
    );
  `);
}

module.exports = { initializeDB, setupSchema };