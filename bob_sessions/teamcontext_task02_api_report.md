# Implementa la Task 2 de docs/superpowers/plans/2026-09-26-teamcontext-mvp.md (sección "Task 2: API HTTP (auth, rutas, app, entrypoint de Vercel)"). Sigue los pasos TDD exactamente y usa el código del plan tal cual:
1. Crea server/test/api.test.js y corre cd server && npm test. Tiene que fallar con Cannot find module '.../server/lib/app.js', y los tests del store tienen que seguir pasando.
2. Implementa server/lib/auth.js, server/lib/routes.js, server/lib/app.js y server/server.js.
3. Corre npm test de nuevo; tienen que pasar todos. No toques server/lib/store.js, server/lib/db.js ni la migración de supabase/. No hagas commit, push ni PR. No uses console.log para depurar dentro de los tests. Solo server/.

---

**Status:** active  **Date:** 2026-09-26

---

### 👤 User

Implementa la Task 2 de docs/superpowers/plans/2026-09-26-teamcontext-mvp.md (sección "Task 2: API HTTP (auth, rutas, app, entrypoint de Vercel)"). Sigue los pasos TDD exactamente y usa el código del plan tal cual:
1. Crea server/test/api.test.js y corre cd server && npm test. Tiene que fallar con Cannot find module '.../server/lib/app.js', y los tests del store tienen que seguir pasando.
2. Implementa server/lib/auth.js, server/lib/routes.js, server/lib/app.js y server/server.js.
3. Corre npm test de nuevo; tienen que pasar todos. No toques server/lib/store.js, server/lib/db.js ni la migración de supabase/. No hagas commit, push ni PR. No uses console.log para depurar dentro de los tests. Solo server/.

---

### 🤖 Assistant

> 🔧 called: read_file



> 🔧 **read_file** — docs/superpowers/plans/2026-09-26-teamcontext-mvp.md

### 🤖 Assistant

> 🔧 called: read_file



> 🔧 **read_file** — docs/superpowers/plans/2026-09-26-teamcontext-mvp.md

### 🤖 Assistant

> 🔧 called: list_files, read_file

Now let me check the current state of the server directory:

> 🔧 **read_file** — server/package.json

> 🔧 **list_files** — server

### 🤖 Assistant

> 🔧 called: read_file, read_file



> 🔧 **read_file** — server/test

> 🔧 **read_file** — server/lib/store.js

### 🤖 Assistant

> 🔧 called: read_file



> 🔧 **read_file** — server/test/helpers.js

### 🤖 Assistant

> 🔧 called: update_todo_list

Now I have everything I need. Let me set up the todo list and execute all steps:

> 🔧 **update_todo_list** — 
[-] Step 1: Create server/test/api.test.js
[ ] Step 2: Run tests to confirm they fail with "Cannot find module .../app.js"
[ ] Step 3: Implement server/lib/auth.js
[ ] Step 4: Implement server/lib/routes.js
[ ] Step 5: Implement server/lib/app.js and server/server.js
[ ] Step 6: Run tests again and verify all pass


### 🤖 Assistant

> 🔧 called: write_file



> 🔧 **write_file** — server/test/api.test.js

### 🤖 Assistant

> 🔧 called: update_todo_list



> 🔧 **update_todo_list** — 
[x] Step 1: Create server/test/api.test.js
[-] Step 2: Run tests to confirm they fail with "Cannot find module .../app.js"
[ ] Step 3: Implement server/lib/auth.js
[ ] Step 4: Implement server/lib/routes.js
[ ] Step 5: Implement server/lib/app.js and server/server.js
[ ] Step 6: Run tests again and verify all pass


### 🤖 Assistant

> 🔧 called: execute_command



> 🔧 **execute_command** — cd server && npm test 2>&1

### 🤖 Assistant

> 🔧 called: execute_command



> 🔧 **execute_command** — npm test 2>&1

### 🤖 Assistant

> 🔧 called: update_todo_list

Step 2 confirmed: `Cannot find module '.../server/lib/app.js'` and the 13 store tests still pass. Now implement all the files:

> 🔧 **update_todo_list** — 
[x] Step 1: Create server/test/api.test.js
[x] Step 2: Run tests to confirm they fail with "Cannot find module .../app.js"
[-] Step 3: Implement server/lib/auth.js
[ ] Step 4: Implement server/lib/routes.js
[ ] Step 5: Implement server/lib/app.js and server/server.js
[ ] Step 6: Run tests again and verify all pass


### 🤖 Assistant

> 🔧 called: write_file



> 🔧 **write_file** — server/lib/auth.js

### 🤖 Assistant

> 🔧 called: update_todo_list



> 🔧 **update_todo_list** — 
[x] Step 1: Create server/test/api.test.js
[x] Step 2: Run tests to confirm they fail with "Cannot find module .../app.js"
[x] Step 3: Implement server/lib/auth.js
[-] Step 4: Implement server/lib/routes.js
[ ] Step 5: Implement server/lib/app.js and server/server.js
[ ] Step 6: Run tests again and verify all pass


### 🤖 Assistant

> 🔧 called: write_file



> 🔧 **write_file** — import { Router } from 'express';

function missingFields(body, fields) {
  const missing = fields.filter((f) => typeof body?.[f] !== 'string' || body[f].trim() === '');
  return missing.length ? `missing fields: ${missing.join(', ')}` : null;
}

const summaryOf = (body) => (typeof body?.summary === 'string' ? body.summary.slice(0, 500) : null);
const repoOf = (query) => (typeof query.repo === 'string' && query.repo ? query.repo : undefined);

export function createApiRouter(store, auth) {
  const router = Router();

  router.post('/locks/acquire', auth, async (req, res) => {
    const error = missingFields(req.body, ['developer_id', 'file_path', 'repo']);
    if (error) return res.status(400).json({ error });
    const { developer_id, file_path, repo } = req.body;

    const result = await store.acquire({ developerId: developer_id, filePath: file_path, repo });
    if (result.status === 'conflict') {
      return res.status(409).json({
        status: 'conflict',
        conflict_with: result.lock.developer_id,
        acquired_at: result.lock.acquired_at,
        file_path,
      });
    }
    res.json({ status: 'granted', lock_id: result.lock.lock_id, file_path, developer_id, acquired_at: result.lock.acquired_at });
  });

  router.post('/locks/release', auth, async (req, res) => {
    const error = missingFields(req.body, ['developer_id', 'file_path', 'repo']);
    if (error) return res.status(400).json({ error });
    const { developer_id, file_path, repo } = req.body;

    const released = await store.release({ developerId: developer_id, filePath: file_path, repo, summary: summaryOf(req.body) });
    if (!released) return res.status(404).json({ status: 'not_found' });
    res.json({ status: 'released', file_path });
  });

  router.post('/locks/release_all', auth, async (req, res) => {
    const error = missingFields(req.body, ['developer_id', 'repo']);
    if (error) return res.status(400).json({ error });
    const count = await store.releaseAll({ developerId: req.body.developer_id, repo: req.body.repo, summary: summaryOf(req.body) });
    res.json({ status: 'released', count });
  });

  router.get('/locks/status', async (req, res) => {
    const active_locks = await store.activeLocks(repoOf(req.query));
    res.json({ active_locks, count: active_locks.length });
  });

  router.get('/activity', async (req, res) => {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 50, 1), 200);
    res.json({ events: await store.activity(repoOf(req.query), limit) });
  });

  router.delete('/locks/stale', auth, async (req, res) => {
    const minutes = req.body?.older_than_minutes;
    if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 0) {
      return res.status(400).json({ error: 'older_than_minutes must be a non-negative number' });
    }
    res.json({ deleted: await store.deleteStale(minutes) });
  });

  return router;
}


### 🤖 Assistant

> 🔧 called: update_todo_list



> 🔧 **update_todo_list** — 
[x] Step 1: Create server/test/api.test.js
[x] Step 2: Run tests to confirm they fail with "Cannot find module .../app.js"
[x] Step 3: Implement server/lib/auth.js
[x] Step 4: Implement server/lib/routes.js
[-] Step 5: Implement server/lib/app.js and server/server.js
[ ] Step 6: Run tests again and verify all pass


### 🤖 Assistant

> 🔧 called: write_file



> 🔧 **write_file** — import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireToken } from './auth.js';
import { createApiRouter } from './routes.js';

const PUBLIC_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public');

export function createApp({ store, token }) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '32kb' }));

  app.get('/health', (req, res) => res.json({ ok: true }));
  app.use('/api', createApiRouter(store, requireToken(token)));
  // Local runs only: on Vercel, public/ is served by the CDN before reaching the function.
  app.use(express.static(PUBLIC_DIR));

  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  });

  return app;
}


### 🤖 Assistant

> 🔧 called: write_file



> 🔧 **write_file** — import express from 'express';
import dotenv from 'dotenv';
import { createPool } from './lib/db.js';
import { createStore } from './lib/store.js';
import { createApp } from './lib/app.js';

dotenv.config({ path: ['.env.local', '.env'] });

const { POSTGRES_URL, SUPABASE_CA_CERT, TEAM_TOKEN, LOCK_TTL_MINUTES = '30', PORT = '3000' } = process.env;

const store = createStore(createPool(POSTGRES_URL, SUPABASE_CA_CERT), { ttlMinutes: Number(LOCK_TTL_MINUTES) });
const app = express();
app.use(createApp({ store, token: TEAM_TOKEN }));

export default app;

if (!process.env.VERCEL) {
  app.listen(Number(PORT), () => console.log(`TeamContext server on :${PORT} (TTL ${LOCK_TTL_MINUTES} min)`));
}


### 🤖 Assistant

> 🔧 called: update_todo_list



> 🔧 **update_todo_list** — 
[x] Step 1: Create server/test/api.test.js
[x] Step 2: Run tests to confirm they fail with "Cannot find module .../app.js"
[x] Step 3: Implement server/lib/auth.js
[x] Step 4: Implement server/lib/routes.js
[x] Step 5: Implement server/lib/app.js and server/server.js
[-] Step 6: Run tests again and verify all pass


### 🤖 Assistant

> 🔧 called: execute_command



> 🔧 **execute_command** — npm test 2>&1

### 🤖 Assistant

> 🔧 called: update_todo_list

All 21 tests pass (`# pass 21`, `# fail 0`).

> 🔧 **update_todo_list** — 
[x] Step 1: Create server/test/api.test.js
[x] Step 2: Run tests to confirm they fail with "Cannot find module .../app.js"
[x] Step 3: Implement server/lib/auth.js
[x] Step 4: Implement server/lib/routes.js
[x] Step 5: Implement server/lib/app.js and server/server.js
[x] Step 6: Run tests again and verify all pass


### 🤖 Assistant

All done. Here's a summary of what was implemented:

**Files created:**

- [`server/test/api.test.js`](server/test/api.test.js) — 8 integration tests covering the full HTTP contract
- [`server/lib/auth.js`](server/lib/auth.js) — `requireToken(token)` Express middleware using `timingSafeEqual` for constant-time Bearer token comparison
- [`server/lib/routes.js`](server/lib/routes.js) — `createApiRouter(store, auth)` with all 6 endpoints: `POST /locks/acquire`, `POST /locks/release`, `POST /locks/release_all`, `GET /locks/status`, `GET /activity`, `DELETE /locks/stale`
- [`server/lib/app.js`](server/lib/app.js) — `createApp({ store, token })` composing cors + JSON body parser + health + API router + static + error handler
- [`server/server.js`](server/server.js) — Vercel entrypoint (`export default app`) that also calls `app.listen()` for local dev when `!process.env.VERCEL`

**TDD flow confirmed:**
1. Tests ran and failed with `Cannot find module '.../server/lib/app.js'` while the 13 store tests kept passing ✓
2. After implementation: `# pass 21`, `# fail 0` ✓