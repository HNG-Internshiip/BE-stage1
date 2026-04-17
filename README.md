# Profile Classifier API

Accepts a name, calls three external APIs (Genderize, Agify, Nationalize), classifies the result, and persists it in a local SQLite database.

## Stack
- **Runtime:** Node.js (ESM)
- **Framework:** Express
- **Database:** SQLite via `better-sqlite3`
- **ID generation:** UUID v7 (`uuid`)

## Setup

```bash
npm install
npm start        # production
npm run dev      # development (auto-restart)
```

The server listens on `PORT` from the environment (default: `3000`).

## Endpoints

### `POST /api/profiles`
Create a new profile. Returns existing profile if the name was already stored.

**Body:** `{ "name": "ella" }`

| Status | Meaning |
|--------|---------|
| 201 | Profile created |
| 200 | Profile already exists (idempotent) |
| 400 | Missing or empty name |
| 422 | name is not a string |
| 502 | Upstream API returned invalid data |

---

### `GET /api/profiles`
Returns all profiles. Supports optional filters (case-insensitive):

```
GET /api/profiles?gender=male&country_id=NG&age_group=adult
```

---

### `GET /api/profiles/:id`
Returns a single profile by UUID.

| Status | Meaning |
|--------|---------|
| 200 | Profile found |
| 404 | Profile not found |

---

### `DELETE /api/profiles/:id`
Deletes a profile. Returns `204 No Content`.

| Status | Meaning |
|--------|---------|
| 204 | Deleted |
| 404 | Profile not found |

---

## Classification Rules

| Age range | Age group  |
|-----------|------------|
| 0–12      | child      |
| 13–19     | teenager   |
| 20–59     | adult      |
| 60+       | senior     |

**Nationality:** highest-probability country from Nationalize response.

## Error Format

```json
{ "status": "error", "message": "<description>" }
```

## Deploy to Railway

1. Push repo to GitHub
2. New project → Deploy from GitHub repo
3. Railway detects Node.js and runs `npm start`
4. Copy the generated HTTPS domain as your base URL

> SQLite writes to `db/profiles.db` — Railway persists the filesystem between deploys.# BE-stage1
