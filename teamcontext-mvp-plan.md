# TeamContext MVP — Execution Plan (IBM BOB 2.0 Hackathon)

## Overview

**Goal:** Build "TeamContext", a semaphore-based MCP system that prevents code collisions when multiple developers use AI agents on the same repository.

**Scope:** Three components — Central Server (Node.js + Express + SQLite on Render/Railway), Local MCP Server (Node.js script), and a Web Dashboard (static HTML/JS with polling).

**Approach:** Build strictly bottom-up: Central Server first (the shared dependency), then Local MCP Server, then Dashboard. Feature work (Onboarding Assistant, Session Handoff) is explicitly out of scope until the MVP is 100% complete and tested.

**Non-Goals:**
- WebSockets or SSE (use polling instead)
- Per-developer authentication (shared team token + free-text `developer_id`)
- Auto-interception of Bob tools (explicit `file_lock`/`file_unlock` MCP tools only)
- Any feature beyond conflict alerts for the hackathon submission

---

## Folder Structure

```
teamcontext/
├── server/                    # Central Server (deployed to Render/Railway)
│   ├── package.json
│   ├── index.js               # Express app entry point
│   ├── db.js                  # SQLite setup and queries
│   ├── routes/
│   │   ├── locks.js           # /api/locks routes
│   │   └── status.js          # /api/status route
│   ├── middleware/
│   │   └── auth.js            # Token validation middleware
│   └── .env.example
│
├── mcp-server/                # Local MCP Server (runs on each developer's machine)
│   ├── package.json
│   └── index.js               # MCP server with file_lock / file_unlock tools
│
├── dashboard/                 # Static Web Dashboard (served from Central Server or CDN)
│   ├── index.html
│   └── app.js                 # Polling logic + DOM rendering
│
└── README.md
```

---

## Central Server API — Exact Endpoints

All protected endpoints require the header: `Authorization: Bearer <TEAM_TOKEN>`

---

### `POST /api/locks/acquire`
Register that a developer is starting to edit a file.

**Request body:**
```json
{
  "developer_id": "alice",
  "file_path": "src/components/Header.tsx",
  "repo": "my-repo"
}
```

**Response 200 — lock granted (no conflict):**
```json
{
  "status": "granted",
  "lock_id": "uuid-v4",
  "file_path": "src/components/Header.tsx",
  "developer_id": "alice",
  "acquired_at": "2025-07-11T10:00:00Z"
}
```

**Response 409 — conflict detected:**
```json
{
  "status": "conflict",
  "conflict_with": "bob",
  "acquired_at": "2025-07-11T09:55:00Z",
  "file_path": "src/components/Header.tsx"
}
```

---

### `POST /api/locks/release`
Release a lock when editing is done.

**Request body:**
```json
{
  "developer_id": "alice",
  "file_path": "src/components/Header.tsx",
  "repo": "my-repo"
}
```

**Response 200:**
```json
{
  "status": "released",
  "file_path": "src/components/Header.tsx"
}
```

**Response 404 — no active lock found:**
```json
{
  "status": "not_found"
}
```

---

### `GET /api/locks/status`
Returns all currently active locks (used by the Dashboard poller).

**Query params (optional):** `?repo=my-repo`

**Response 200:**
```json
{
  "active_locks": [
    {
      "lock_id": "uuid-v4",
      "developer_id": "alice",
      "file_path": "src/components/Header.tsx",
      "repo": "my-repo",
      "acquired_at": "2025-07-11T10:00:00Z"
    }
  ],
  "count": 1
}
```

---

### `DELETE /api/locks/stale`
Admin endpoint to clear all locks older than N minutes (prevents permanent locks from crashed sessions).

**Request body:**
```json
{
  "older_than_minutes": 60
}
```

**Response 200:**
```json
{
  "deleted": 3
}
```

---

### `GET /health`
No auth required. Used by Render/Railway health checks.

**Response 200:**
```json
{ "ok": true }
```

---

## Sub-Tasks

---

### Sub-Task 1 — Central Server: Core Setup
**Status:** [ ] pending

**Intent:** Bootstrap the Express + SQLite server with auth middleware and the `locks` table. This is the shared dependency for everything else.

**Expected Outcomes:**
- Server starts locally on port 3000
- SQLite database file is created on first run
- All requests without a valid `Authorization: Bearer <TEAM_TOKEN>` return 401
- `GET /health` returns 200 without auth

**Todo List:**
1. Create `server/` folder and run `npm init -y`
2. Install dependencies: `express`, `better-sqlite3`, `uuid`, `dotenv`
3. Create `server/.env.example` with `TEAM_TOKEN=changeme` and `PORT=3000`
4. Create `server/db.js` — open/create SQLite file, define `locks` table schema:
   - `lock_id TEXT PRIMARY KEY`
   - `developer_id TEXT NOT NULL`
   - `file_path TEXT NOT NULL`
   - `repo TEXT NOT NULL`
   - `acquired_at TEXT NOT NULL` (ISO 8601)
5. Create `server/middleware/auth.js` — reads `Authorization` header, compares to `TEAM_TOKEN` env var, returns 401 if missing/wrong
6. Create `server/index.js` — mount middleware, register routes, start server
7. Create `GET /health` inline in `index.js`
8. Test: `curl http://localhost:3000/health` returns `{"ok":true}`

**Relevant Context:** `server/db.js`, `server/middleware/auth.js`, `server/index.js`

---

### Sub-Task 2 — Central Server: Locks Routes
**Status:** [ ] pending

**Intent:** Implement the four `/api/locks` endpoints so the MCP server has a working backend to call.

**Expected Outcomes:**
- `POST /api/locks/acquire` grants a lock or returns 409 on conflict
- `POST /api/locks/release` deletes the row and returns 200 (or 404 if not found)
- `GET /api/locks/status` returns all active locks (filterable by `repo`)
- `DELETE /api/locks/stale` removes rows older than the given threshold
- All endpoints return 401 without the team token

**Todo List:**
1. Create `server/routes/locks.js`
2. `acquire`: Check if a row with matching `file_path` + `repo` already exists. If yes, return 409 with `conflict_with`. If no, insert new row with `uuid()` and return 200 `granted`.
3. `release`: Delete row matching `file_path` + `repo` + `developer_id`. Return 404 if no row was deleted.
4. `status`: SELECT all rows, optionally filtered by `repo` query param.
5. `stale delete`: DELETE rows where `acquired_at` is older than `now - older_than_minutes`.
6. Mount router in `index.js` at `/api/locks`
7. Test all routes with `curl` or a REST client

**Relevant Context:** `server/routes/locks.js`, `server/db.js`

---

### Sub-Task 3 — Deploy Central Server
**Status:** [ ] pending

**Intent:** Get the Central Server live on a public URL so the MCP server can reach it from any machine.

**Expected Outcomes:**
- Server is accessible at a public HTTPS URL (e.g., `https://teamcontext.onrender.com`)
- `TEAM_TOKEN` is set as an environment variable in the hosting platform (never in code)
- `GET /health` returns 200 from the public URL
- SQLite file persists across deploys (use a persistent disk or accept ephemeral for hackathon)

**Todo List:**
1. Create a GitHub repo and push the `server/` folder
2. Create a new Web Service on Render (or Railway), connected to the repo
3. Set `TEAM_TOKEN` as a secret environment variable in the platform dashboard
4. Set build command: `npm install`, start command: `node index.js`
5. Confirm health check URL passes
6. Write down the public base URL — it will be hardcoded in the MCP server config

**Relevant Context:** `server/.env.example`, hosting platform dashboard

---

### Sub-Task 4 — Local MCP Server
**Status:** [ ] pending

**Intent:** Build the MCP server that runs on each developer's machine, exposing `file_lock` and `file_unlock` tools to Bob. This is the developer-facing interface.

**Expected Outcomes:**
- MCP server registers as a valid MCP server readable by Bob
- `file_lock` tool calls `POST /api/locks/acquire` and returns a human-readable message (granted or conflict warning)
- `file_unlock` tool calls `POST /api/locks/release` and confirms release
- Config is read from `.bob/mcp.json` (or environment variables): `CENTRAL_SERVER_URL` and `TEAM_TOKEN` and `DEVELOPER_ID`
- If the central server is unreachable, the tool returns a warning but does not crash

**Todo List:**
1. Create `mcp-server/` folder and run `npm init -y`
2. Install `@modelcontextprotocol/sdk` (MCP SDK for Node.js)
3. In `mcp-server/index.js`, create an MCP server instance using `registerTool`
4. Register `file_lock(file_path: string, repo: string)` tool:
   - POST to `{CENTRAL_SERVER_URL}/api/locks/acquire`
   - Include `Authorization` header
   - Return `"✅ Lock granted for file_path"` or `"⚠️ CONFLICT: bob is already editing file_path"`
5. Register `file_unlock(file_path: string, repo: string)` tool:
   - POST to `{CENTRAL_SERVER_URL}/api/locks/release`
   - Return `"🔓 Lock released for file_path"` or `"⚠️ No active lock found"`
6. Read config from environment variables (Bob injects them from `.bob/mcp.json`)
7. Add the server to `.bob/mcp.json` (local machine config) with the three env vars
8. Test: invoke `file_lock` from Bob chat and verify the lock appears in `GET /api/locks/status`

**Relevant Context:** `mcp-server/index.js`, `.bob/mcp.json` (local, not committed)

---

### Sub-Task 5 — Web Dashboard
**Status:** [ ] pending

**Intent:** Build the static HTML/JS semaphore dashboard that shows all active locks in real time via polling.

**Expected Outcomes:**
- Single HTML page loads without a build step
- Polls `GET /api/locks/status` every 4 seconds
- Displays a color-coded table: green = file free (no lock), red = file locked with developer name and time
- Shows last-updated timestamp
- Works when opened directly in a browser (can be served as a static file from the Central Server or opened as `file://`)

**Todo List:**
1. Create `dashboard/index.html` with a simple table and a status bar
2. Create `dashboard/app.js`:
   - On load, read `CENTRAL_SERVER_URL` and `TEAM_TOKEN` from a `<script>` config block at the top of `index.html` (hardcoded for hackathon)
   - `setInterval` every 4000ms: fetch `/api/locks/status`, re-render table
   - Render each active lock as a red row with `developer_id`, `file_path`, `repo`, `acquired_at`
   - If `active_locks` is empty, show a green "No conflicts — all clear" message
3. Add a `DELETE /api/locks/stale` button (admin) for demo purposes
4. Serve `dashboard/` as static files from Express (`express.static`) so it's accessible at the public URL
5. Test: lock a file via Bob, confirm it appears red in the dashboard within 4 seconds; release it, confirm it turns green

**Relevant Context:** `dashboard/index.html`, `dashboard/app.js`, `server/index.js` (static serving)

---

### Sub-Task 6 — End-to-End Integration Test
**Status:** [ ] pending

**Intent:** Validate the full flow works across both developers' machines before the hackathon demo.

**Expected Outcomes:**
- Developer A locks a file → Dashboard shows red
- Developer B attempts to lock the same file → Gets conflict warning in Bob chat
- Developer A releases → Dashboard turns green
- Developer B can now lock the file successfully
- The stale lock cleanup works (manually trigger `DELETE /api/locks/stale`)

**Todo List:**
1. Both developers configure their local `.bob/mcp.json` with the production `CENTRAL_SERVER_URL`
2. Run the full scenario above across two separate machines
3. Fix any bugs found (auth errors, CORS issues, timing)
4. Add `Access-Control-Allow-Origin: *` to the Central Server if the dashboard hits CORS errors
5. Record a short screen capture of the conflict detection for the demo/pitch

**Relevant Context:** All components

---

## Future Work (Only if MVP is 100% done by Saturday night)

These features are explicitly out of scope for the hackathon MVP. They must NOT be started until Sub-Tasks 1–6 are complete and passing.

### F1 — Onboarding Assistant
An MCP tool (`onboard_project`) that, when invoked, reads the repo structure and generates a context summary for a new developer joining mid-session.

### F2 — Session Handoff
An MCP tool (`handoff_session`) that packages the current developer's active locks and recent file activity into a structured summary that another developer can load into their Bob session.

---

## Deployment Checklist (Pre-Demo)

- [ ] `TEAM_TOKEN` is set in hosting platform env vars (not in any committed file)
- [ ] `.env` and `.bob/mcp.json` are in `.gitignore`
- [ ] `GET /health` returns 200 from the public URL
- [ ] Dashboard is accessible from the public URL
- [ ] Both developers have the MCP server running locally
- [ ] Stale lock TTL is set to a reasonable value for the demo (e.g., 30 minutes)
