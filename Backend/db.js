import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "game.db");
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pseudo TEXT NOT NULL,
    score INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const columns = db.prepare("PRAGMA table_info(scores)").all();
const hasWave = columns.some((column) => column.name === "wave");
const hasZombiesKilled = columns.some(
  (column) => column.name === "zombies_killed",
);

if (!hasWave) {
  db.exec("ALTER TABLE scores ADD COLUMN wave INTEGER NOT NULL DEFAULT 1");
  db.exec("UPDATE scores SET wave = score WHERE wave IS NULL OR wave = 1");
}

if (!hasZombiesKilled) {
  db.exec(
    "ALTER TABLE scores ADD COLUMN zombies_killed INTEGER NOT NULL DEFAULT 0",
  );
}

export default db;
