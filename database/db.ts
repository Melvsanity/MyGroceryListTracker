import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('mygrocery.db');

export const initDB = async (): Promise<void> => {
  db.execSync(`PRAGMA journal_mode = WAL;`);
  db.execSync(`PRAGMA foreign_keys = ON;`);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS lists (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      name      TEXT    NOT NULL,
      store     TEXT,
      budget    REAL    DEFAULT 0,
      created_at TEXT   DEFAULT (datetime('now','localtime'))
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS items (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      list_id   INTEGER NOT NULL,
      name      TEXT    NOT NULL,
      price     REAL    DEFAULT 0,
      quantity  INTEGER DEFAULT 1,
      category  TEXT    DEFAULT 'General',
      notes     TEXT    DEFAULT '',
      checked   INTEGER DEFAULT 0,
      FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS receipts (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      list_id  INTEGER NOT NULL,
      total    REAL    NOT NULL,
      saved_at TEXT    DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
    );
  `);

  console.log('✅ DB initialized');
};

export default db;