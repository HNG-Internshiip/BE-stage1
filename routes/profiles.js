import { Router } from "express";
// UUID v7 — time-ordered, no external dependency needed
function uuidv7() {
  const now = Date.now();
  const timeHigh = Math.floor(now / 0x100000000);
  const timeLow  = now >>> 0;

  const bytes = new Uint8Array(16);
  bytes[0] = (timeHigh >>> 8) & 0xff;
  bytes[1] =  timeHigh        & 0xff;
  bytes[2] = (timeLow >>> 24) & 0xff;
  bytes[3] = (timeLow >>> 16) & 0xff;
  bytes[4] = (timeLow >>>  8) & 0xff;
  bytes[5] =  timeLow         & 0xff;

  // Version 7
  bytes[6] = 0x70 | (Math.random() * 0x10 & 0x0f);
  bytes[7] =         Math.random() * 0x100 & 0xff;

  // Variant bits (10xxxxxx)
  bytes[8] = 0x80 | (Math.random() * 0x40 & 0x3f);

  for (let i = 9; i < 16; i++) bytes[i] = Math.random() * 0x100 & 0xff;

  const h = Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}
import db from "../db/database.js";
import { fetchGender } from "../services/genderize.js";
import { fetchAge } from "../services/agify.js";
import { fetchNationality } from "../services/nationalize.js";
import { getAgeGroup } from "../services/classify.js";

export const profilesRouter = Router();

// ─── POST /api/profiles ──────────────────────────────────────────────────────
profilesRouter.post("/", async (req, res) => {
  const { name } = req.body;

  // 400 — missing or empty
  if (name === undefined || name === "") {
    return res.status(400).json({ status: "error", message: "Missing or empty name" });
  }

  // 422 — wrong type
  if (typeof name !== "string") {
    return res.status(422).json({ status: "error", message: "name must be a string" });
  }

  const normalized = name.trim().toLowerCase();

  // Idempotency — return existing profile for the same name
  const existing = db.prepare("SELECT * FROM profiles WHERE name = ?").get(normalized);
  if (existing) {
    return res.status(200).json({
      status:  "success",
      message: "Profile already exists",
      data:    formatProfile(existing),
    });
  }

  // Call all three external APIs in parallel
  let genderData, ageData, nationalityData;
  try {
    [genderData, ageData, nationalityData] = await Promise.all([
      fetchGender(normalized),
      fetchAge(normalized),
      fetchNationality(normalized),
    ]);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ status: "error", message: err.message });
  }

  const profile = {
    id:                  uuidv7(),
    name:                normalized,
    gender:              genderData.gender,
    gender_probability:  genderData.gender_probability,
    sample_size:         genderData.sample_size,
    age:                 ageData.age,
    age_group:           getAgeGroup(ageData.age),
    country_id:          nationalityData.country_id,
    country_probability: nationalityData.country_probability,
    created_at:          new Date().toISOString(),
  };

  db.prepare(`
    INSERT INTO profiles
      (id, name, gender, gender_probability, sample_size, age, age_group,
       country_id, country_probability, created_at)
    VALUES
      (@id, @name, @gender, @gender_probability, @sample_size, @age, @age_group,
       @country_id, @country_probability, @created_at)
  `).run(profile);

  return res.status(201).json({ status: "success", data: formatProfile(profile) });
});

// ─── GET /api/profiles ───────────────────────────────────────────────────────
profilesRouter.get("/", (req, res) => {
  const { gender, country_id, age_group } = req.query;

  let query  = "SELECT * FROM profiles WHERE 1=1";
  const params = [];

  if (gender) {
    query += " AND LOWER(gender) = ?";
    params.push(gender.toLowerCase());
  }
  if (country_id) {
    query += " AND LOWER(country_id) = ?";
    params.push(country_id.toLowerCase());
  }
  if (age_group) {
    query += " AND LOWER(age_group) = ?";
    params.push(age_group.toLowerCase());
  }

  const rows = db.prepare(query).all(...params);

  return res.status(200).json({
    status: "success",
    count:  rows.length,
    data:   rows.map(formatProfileList),
  });
});

// ─── GET /api/profiles/:id ───────────────────────────────────────────────────
profilesRouter.get("/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM profiles WHERE id = ?").get(req.params.id);

  if (!row) {
    return res.status(404).json({ status: "error", message: "Profile not found" });
  }

  return res.status(200).json({ status: "success", data: formatProfile(row) });
});

// ─── DELETE /api/profiles/:id ────────────────────────────────────────────────
profilesRouter.delete("/:id", (req, res) => {
  const result = db.prepare("DELETE FROM profiles WHERE id = ?").run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ status: "error", message: "Profile not found" });
  }

  return res.sendStatus(204);
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Full profile shape (POST / GET single)
function formatProfile(p) {
  return {
    id:                  p.id,
    name:                p.name,
    gender:              p.gender,
    gender_probability:  p.gender_probability,
    sample_size:         p.sample_size,
    age:                 p.age,
    age_group:           p.age_group,
    country_id:          p.country_id,
    country_probability: p.country_probability,
    created_at:          p.created_at,
  };
}

// Slim shape used in GET all list
function formatProfileList(p) {
  return {
    id:         p.id,
    name:       p.name,
    gender:     p.gender,
    age:        p.age,
    age_group:  p.age_group,
    country_id: p.country_id,
  };
}