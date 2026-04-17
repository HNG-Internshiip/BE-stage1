const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Create table on first run
pool.query(`
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

function convertQuery(sql, obj) {
  const values = [];
  let i = 1;
  const text = sql.replace(/@(\w+)/g, (_, key) => {
    values.push(obj[key]);
    return `$${i++}`;
  });
  return { text, values };
}

const db = {
  prepare(sql) {
    return {
      async get(...params) {
        const res = await pool.query(sql, params);
        return res.rows[0];
      },
      async all(...params) {
        const res = await pool.query(sql, params);
        return res.rows;
      },
      async run(param) {
        if (param && typeof param === "object" && !Array.isArray(param)) {
          const { text, values } = convertQuery(sql, param);
          const res = await pool.query(text, values);
          return { changes: res.rowCount };
        }
        const res = await pool.query(sql, param);
        return { changes: res.rowCount };
      },
    };
  },
};

module.exports = db;