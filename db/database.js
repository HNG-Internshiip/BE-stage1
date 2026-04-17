import initSqlJs from "sql.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "profiles.db");

const SQL = await initSqlJs();

// Load existing DB file from disk, or create a fresh one
let db;
if (fs.existsSync(DB_PATH)) {
  const fileBuffer = fs.readFileSync(DB_PATH);
  db = new SQL.Database(fileBuffer);
} else {
  db = new SQL.Database();
}

db.run(`
  CREATE TABLE IF NOT EXISTS profiles (
    id                  TEXT PRIMARY KEY,
    name                TEXT NOT NULL UNIQUE,
    gender              TEXT,
    gender_probability  REAL,
    sample_size         INTEGER,
    age                 INTEGER,
    age_group           TEXT,
    country_id          TEXT,
    country_probability REAL,
    created_at          TEXT NOT NULL
  )
`);

// Persist DB to disk after every write
function persist() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// Mimic better-sqlite3's interface so routes/profiles.js needs no changes
const wrapper = {
  prepare(sql) {
    return {
      get(...params) {
        const stmt = db.prepare(sql);
        stmt.bind(params);
        if (stmt.step()) {
          const row = stmt.getAsObject();
          stmt.free();
          return row;
        }
        stmt.free();
        return undefined;
      },
      all(...params) {
        const results = [];
        const stmt = db.prepare(sql);
        stmt.bind(params);
        while (stmt.step()) results.push(stmt.getAsObject());
        stmt.free();
        return results;
      },
      run(param) {
        // sql.js expects named params as `{ $key: value }` prefixed with $
        if (param && typeof param === "object" && !Array.isArray(param)) {
          const mapped = {};
          for (const [k, v] of Object.entries(param)) {
            mapped[`$${k}`] = v;
          }
          db.run(sql.replace(/@(\w+)/g, "$$$1"), mapped);
        } else {
          db.run(sql, param);
        }
        persist();
        return { changes: db.getRowsModified() };
      },
    };
  },
};

export default wrapper;