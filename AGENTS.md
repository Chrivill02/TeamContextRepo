# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Project: TeamContext (IBM Bob 2.0 Hackathon)

A file-lock coordination layer for AI-assisted dev teams. Bob (custom mode) calls MCP tools automatically before/after edits. Source of truth: `TEAMCONTEXT_CONTEXT.md` and `docs/superpowers/plans/2026-09-26-teamcontext-mvp.md`.

## Commands

```bash
npm test                   # root: runs server + mcp-server suites
cd server && npm test      # server only (node:test, PGlite)
cd mcp-server && npm test  # mcp-server only (node:test)
```

No lint or build step. All packages use `"type": "module"` (ESM). Node ≥ 20 required.

## Architecture (strict build order matters)

```
supabase/migrations/  → server/lib/{db,store}.js → server/lib/{auth,routes,app}.js → server/server.js
                                                                                     → server/public/
mcp-server/lib/{paths,repo,client,messages}.js → mcp-server/index.js
bob/custom_modes.yaml + bob/rules-teamcontext/  → .bob/ in the demo repo (not here)
```

- **`server/`** is the Vercel Root Directory — Vercel deploys from here, not the repo root.
- **`server/server.js`** exports `export default app` for Vercel and also calls `app.listen()` for local dev.
- **Database schema is `teamcontext`, not `public`** — Supabase's Data API (PostgREST) never exposes it; only the server touches it via `POSTGRES_URL`.
- Lock acquisition uses a single plpgsql function `teamcontext.acquire()` — never replicate this logic in JS.

## Testing: non-obvious rules

- Tests use **PGlite** (Postgres compiled to WASM) running the **real migration SQL** — no Docker, no network.
- `createStore(db)` accepts both `pg.Pool` and `PGlite` because both expose `query(sql, params) → { rows }`.
- `server/test/helpers.js` provides `testDb()` — always use it for store tests; never mock the DB.
- Single test: `cd server && node --test test/store.test.js` (or `test/api.test.js`, etc.)
- Expected counts: store → `# pass 10`, mcp libs → `# pass 25`.

## Code style

- **ESM only** — `import/export`, no `require()`.
- **Factory functions** over classes: `createStore(db, opts)`, `createClient(opts)`, `createApp(opts)`, `createPool(url, cert)`.
- Dates are **always** serialized to ISO 8601 UTC strings (`2026-09-26T10:00:00.000Z`) — use `new Date(v).toISOString()`.
- `createClient` and all MCP tool handlers **never throw** — return `{ ok, status, data?, error? }` for every case including network failure and timeout.
- File paths must be **normalized** before hitting the API: repo-relative, forward slashes, no leading `./` — always call `normalizePath()` from `mcp-server/lib/paths.js`.
- In `mcp-server/index.js`: **stdout is the MCP protocol channel** — use only `console.error`, never `console.log`.

## Secrets / gitignore

Never commit: `.env`, `.env.local`, `.vercel/`, `.bob/mcp.json`, any `TEAM_TOKEN` or `POSTGRES_URL`.
`bob/mcp.example.json` is the committed template (no real values).

## Git flow

`main` = delivery, `develop` = integration. Feature branches: `feat/<task>` → PR to `develop`.
Bob session screenshots go in `bob_sessions/teamcontext_taskNN_description.png` — **capture after every Bob task**.
Christian: tasks 01–19. Eswin: tasks 20–39.

## Deployment

- Vercel project Root Directory: `server/`
- Env vars only in Vercel (never in repo): `TEAM_TOKEN`, `POSTGRES_URL`, `SUPABASE_CA_CERT`, `LOCK_TTL_MINUTES`
- Run migration in Supabase SQL editor before first deploy
- Verify: `curl https://<project>.vercel.app/health` → `{"ok":true}`
