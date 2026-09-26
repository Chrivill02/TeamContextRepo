# Project Documentation Rules (Non-Obvious Only)

- **Single source of truth:** `TEAMCONTEXT_CONTEXT.md` has the API contract, hackathon rules and design decisions. `docs/superpowers/plans/2026-09-26-teamcontext-mvp.md` has the full implementation plan with exact code. Both must be read before answering architecture or API questions.
- **`server/` ≠ repo root** — Vercel deploys from `server/` as its Root Directory; `package.json` at the repo root only has the `npm test` script that delegates to both sub-packages.
- **Schema `teamcontext` not `public`** — Supabase's PostgREST (Data API) only exposes `public`; the locks and activity tables are intentionally hidden from it. Only the Express server accesses them via `POSTGRES_URL`.
- **Dashboard has no token** — `server/public/index.html` polls public read-only endpoints. This is by design; writing the token into the HTML would be a security violation.
- **`bob/` in this repo ≠ `.bob/` in use** — `bob/custom_modes.yaml`, `bob/rules-teamcontext/` and `bob/mcp.example.json` are the committed templates; developers copy them into `.bob/` of the *demo repo* (`teamcontext-demo`), not into this repo.
- **PGlite is real Postgres** — tests run the actual migration SQL via `@electric-sql/pglite` (Postgres WASM). There is no mock or stub for the DB layer.
- **`acquire` is a plpgsql function, not a multi-step JS transaction** — the atomic behavior (expire → insert → conflict check) is guaranteed by `UNIQUE (file_path, repo)` + `ON CONFLICT DO NOTHING` inside a single transaction. This is why concurrent Vercel instances cannot double-grant the same lock.
- **`LOCK_TTL_MINUTES` is runtime, not compile-time** — locks older than the TTL are treated as expired by `activeLocks()` and by `acquire()` at query time; there is no background job.
