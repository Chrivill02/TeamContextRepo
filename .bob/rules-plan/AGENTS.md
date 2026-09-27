# Project Architecture Rules (Non-Obvious Only)

- **Build order is strict** — Tasks 1 (store) and 4 (MCP libs) are independent and run in parallel; Task 2 (API) depends on Task 1; Task 5 (MCP entrypoint) depends on Task 4 + a deployed server URL from Task 3. Do not collapse or reorder these.
- **`createStore(db)` is the only DB access point** — routes never call `db.query()` directly; they call store methods. This is the contract that makes PGlite testing possible.
- **Concurrency guarantee is in Postgres, not in Express** — Vercel can run multiple instances simultaneously; the `teamcontext.acquire()` plpgsql function is the only safe place to resolve lock conflicts. Any JS-level "check then insert" would be a race condition.
- **MCP client must never throw or crash** — the MCP server is a `stdio` process; an unhandled exception kills it and Bob loses all tools. Every HTTP call in `client.js` is wrapped in try/catch with `AbortSignal.timeout`.
- **Dashboard is intentionally polling-only** — WebSockets and SSE were ruled out; poll interval is 4 s. Do not propose real-time transports.
- **Read endpoints are public by design** — `/health`, `GET /api/locks/status`, `GET /api/activity` require no auth. This keeps the dashboard free of secrets. Only write endpoints (`acquire`, `release`, `release_all`, `DELETE /api/locks/stale`) require `Authorization: Bearer <TEAM_TOKEN>`.
- **`teamcontext` schema isolates data from Supabase's auto-generated APIs** — placing tables in `teamcontext` (not `public`) ensures PostgREST cannot expose them to the Supabase anon key. This is a deliberate security boundary, not an oversight.
- **MCP tool descriptions are instructions to Bob** — the `description` field of each `registerTool` call is read by Bob's LLM. Weakening descriptions (e.g., making `file_lock` "optional") will cause Bob to skip locks. Keep them imperative.
- **Stretch (Task 10) only after E2E passes** — standup generation is explicitly out of scope until the MVP is verified end-to-end on two machines.
