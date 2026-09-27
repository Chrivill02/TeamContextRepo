# Project Coding Rules (Non-Obvious Only)

- **Factory pattern is mandatory** — every module exports a `createX(deps, opts)` function; no class-based or singleton patterns.
- **`createStore(db)`** accepts `pg.Pool` OR `PGlite` — both expose identical `query(sql, params) → { rows }`. Never switch based on env; just pass the right instance from the caller.
- **Lock acquisition SQL lives only in `teamcontext.acquire()` (plpgsql)** — the JS store calls it via `SELECT teamcontext.acquire($1,$2,$3,$4,$5)`. Do not reimplement the conflict/expire logic in JS.
- **PGlite date quirk:** if PGlite rejects a `Date` object as a parameter, pass `now().toISOString()` instead — the SQL already casts with `::timestamptz`.
- **`createClient` must never throw** — wrap every `fetchImpl` call in try/catch and return `{ ok: false, status: 0, error: msg }` for network errors and `AbortSignal.timeout` rejections. Status 409 is a normal response, not an error.
- **stdout is the MCP wire** — in `mcp-server/index.js` use only `console.error`, never `console.log`.
- **Path normalization is always required** before passing `file_path` to the API — call `normalizePath(filePath, repo.root)` from `mcp-server/lib/paths.js`. Both `./src/A.ts` and `src\A.ts` must map to `src/A.ts`.
- **Timestamps out of the store are always ISO strings** — apply `new Date(v).toISOString()` in the `lockRow`/`activityRow` mappers, never elsewhere.
- **`server/server.js` must `export default app`** (Vercel handler) AND call `app.listen()` when `import.meta.url === url.pathToFileURL(process.argv[1]).href` (local dev).
- **`server/` is the Vercel Root Directory** — `package.json`, `server.js` and `lib/` must stay directly under `server/`, not the repo root.
- **No top-level `await` outside entry points** (`mcp-server/index.js` and `server/server.js`).
- **Bob session screenshots are required** — after every Bob task save `bob_sessions/teamcontext_taskNN_description.png` before the next commit.
