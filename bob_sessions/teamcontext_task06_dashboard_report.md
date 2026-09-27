# Implementa la Task 6 de docs/superpowers/plans/2026-09-26-teamcontext-mvp.md (sección "Task 6: Dashboard"). Sigue los pasos TDD exactamente y usa el código del plan tal cual:
1. Crea server/test/dashboard-view.test.js y corre cd server && npm test. Tiene que fallar con Cannot find module '.../server/public/view.js'.
2. Implementa server/public/view.js y corre npm test: todo tiene que pasar.
3. Implementa server/public/app.js y server/public/index.html.Solo crea esos 4 archivos. No toques nada más de server/ (ni lib/, server.js, package.json) ni supabase/. No hagas commit, push ni PR. No agregues librerías, frameworks ni ningún token al HTML/JS: el dashboard solo usa los endpoints públicos de lectura.Despues te pondré en modo agente a ejecutar

---

**Status:** active  **Date:** 2026-09-26

---

### 👤 User

Implementa la Task 6 de docs/superpowers/plans/2026-09-26-teamcontext-mvp.md (sección "Task 6: Dashboard"). Sigue los pasos TDD exactamente y usa el código del plan tal cual:
1. Crea server/test/dashboard-view.test.js y corre cd server && npm test. Tiene que fallar con Cannot find module '.../server/public/view.js'.
2. Implementa server/public/view.js y corre npm test: todo tiene que pasar.
3. Implementa server/public/app.js y server/public/index.html.Solo crea esos 4 archivos. No toques nada más de server/ (ni lib/, server.js, package.json) ni supabase/. No hagas commit, push ni PR. No agregues librerías, frameworks ni ningún token al HTML/JS: el dashboard solo usa los endpoints públicos de lectura.Despues te pondré en modo agente a ejecutar

---

### 🤖 Assistant

> 🔧 called: use_skill



> 🔧 **use_skill** — create-plan

### 🤖 Assistant

> 🔧 called: read_file, list_files

Now let me read the plan document and explore the codebase to fully understand what Task 6 requires.

> 🔧 **list_files** — server

> 🔧 **read_file** — docs/superpowers/plans/2026-09-26-teamcontext-mvp.md

### 🤖 Assistant

> 🔧 called: read_file, list_files



> 🔧 **list_files** — server/test

> 🔧 **read_file** — docs/superpowers/plans/2026-09-26-teamcontext-mvp.md

### 🤖 Assistant

> 🔧 called: read_file, read_file

Now let me look at the existing test files and server structure to understand the patterns used:

> 🔧 **read_file** — server/package.json

> 🔧 **read_file** — server/test/store.test.js

### 🤖 Assistant

> 🔧 called: update_todo_list

I have all the information needed. The task is crystal clear — the plan document contains the exact code to implement. Let me write the plan file.

> 🔧 **update_todo_list** — [-] Research codebase and read Task 6 spec
[ ] Write plan file
[ ] Present plan to user for confirmation


### 🤖 Assistant

> 🔧 called: write_file

I have all the context needed. Here's what I found:

**Key findings:**
- [`server/package.json`](server/package.json) uses `"test": "node --test"` — it auto-discovers all `*.test.js` files under the project
- [`server/test/store.test.js`](server/test/store.test.js) shows the ESM import pattern
- The existing tests expect `# pass 10` (store) + `# pass 25` (api+db). The plan says Task 6 adds 6 more tests → expected `# pass ~24` (note: the plan says `# pass 24` on line 1619, which would be the total after adding the 6 dashboard tests)
- No `server/public/` directory exists yet — all 4 files need to be created from scratch
- The plan contains **exact, verbatim code** for all 4 files

---

Now let me write the plan file:

> 🔧 **write_file** — docs/superpowers/plans/task06-dashboard-plan.md

### 🤖 Assistant

> 🔧 called: update_todo_list



> 🔧 **update_todo_list** — [x] Research codebase and read Task 6 spec
[x] Write plan file
[-] Present plan to user for confirmation


### 🤖 Assistant

Here's the plan. The spec is complete and unambiguous — the plan doc in the repo has exact verbatim code for all 4 files.

---

## Plan: Task 6 — Dashboard

**Scope:** 4 new files only. Zero changes to anything in `server/lib/`, `server/server.js`, `server/package.json`, or `supabase/`.

```mermaid
flowchart LR
    A[dashboard-view.test.js] -->|imports| B[public/view.js]
    C[public/index.html] -->|script type=module| D[public/app.js]
    D -->|imports| B
    D -->|fetch| E[GET /api/locks/status]
    D -->|fetch| F[GET /api/activity]
```

### 4 Sub-Tasks (strict TDD order)

| # | File | Action | Gate |
|---|------|---------|------|
| 1 | `server/test/dashboard-view.test.js` | Create test file | `npm test` → **FAIL** (module not found) |
| 2 | `server/public/view.js` | Pure ESM view functions | `npm test` → **PASS** (~24 total) |
| 3 | `server/public/app.js` | Browser polling entry-point | No test, manual verify |
| 4 | `server/public/index.html` | Static HTML + CSS shell | No token in view-source |

### Key constraints honored
- **Polling only** — 4 s interval, no WebSockets (per AGENTS.md)
- **No auth token** in any HTML/JS — dashboard only hits the two public read endpoints
- **`view.js` is pure** — no `document`, no `window`, so `node --test` can import it directly
- **ESM throughout** — `import/export`, `<script type="module">`

### The plan file
[`docs/superpowers/plans/task06-dashboard-plan.md`](docs/superpowers/plans/task06-dashboard-plan.md)

---

Does this plan look correct? Any adjustments needed before switching to Agent mode to implement?

---

### 👤 User

Ejecuta el plan

---

### 🤖 Assistant

> 🔧 called: update_todo_list



> 🔧 **update_todo_list** — [x] Research codebase and read Task 6 spec
[x] Write plan file
[x] Present plan to user for confirmation
[-] Sub-Task 1: Create server/test/dashboard-view.test.js (failing test)
[ ] Sub-Task 2: Implement server/public/view.js (make tests pass)
[ ] Sub-Task 3: Implement server/public/app.js
[ ] Sub-Task 4: Implement server/public/index.html


### 🤖 Assistant

> 🔧 called: write_file

**Step 1 — Write the failing test file:**

> 🔧 **write_file** — server/test/dashboard-view.test.js

### 🤖 Assistant

> 🔧 called: execute_command

Now run the tests — expect FAIL with `Cannot find module`:

> 🔧 **execute_command** — cd server && npm test 2>&1

### 🤖 Assistant

> 🔧 called: execute_command



> 🔧 **execute_command** — npm test 2>&1

### 🤖 Assistant

> 🔧 called: update_todo_list

TDD gate confirmed: `Cannot find module '.../server/public/view.js'`. Now implement the view module:

> 🔧 **update_todo_list** — [x] Research codebase and read Task 6 spec
[x] Write plan file
[x] Present plan to user for confirmation
[x] Sub-Task 1: Create server/test/dashboard-view.test.js (failing test)
[-] Sub-Task 2: Implement server/public/view.js (make tests pass)
[ ] Sub-Task 3: Implement server/public/app.js
[ ] Sub-Task 4: Implement server/public/index.html


### 🤖 Assistant

> 🔧 called: write_file

**Step 2 — Implement `server/public/view.js`:**

> 🔧 **write_file** — const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);

export function timeAgo(iso, now = new Date()) {
  const seconds = Math.max(0, Math.round((now - new Date(iso)) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export function renderLocks(locks, now = new Date()) {
  if (!locks.length) return '<div class="all-clear">🟢 All clear — nobody is editing files right now</div>';
  const rows = locks
    .map((l) => `<tr class="locked"><td>${escapeHtml(l.developer_id)}</td><td><code>${escapeHtml(l.file_path)}</code></td>` +
      `<td>${escapeHtml(l.repo)}</td><td>${timeAgo(l.acquired_at, now)}</td></tr>`)
    .join('');
  return `<table><thead><tr><th>Developer</th><th>File</th><th>Repo</th><th>Held for</th></tr></thead><tbody>${rows}</tbody></table>`;
}

const ICONS = { lock: '🔒', unlock: '🔓', conflict: '⛔', release_all: '✅' };
const LABELS = { lock: 'locked', unlock: 'released', conflict: 'was blocked on', release_all: 'finished task' };

export function renderActivity(events, now = new Date()) {
  if (!events.length) return '<p class="muted">No activity yet.</p>';
  const items = events
    .map((e) => `<li class="event ${escapeHtml(e.event)}">${ICONS[e.event] ?? '•'} <strong>${escapeHtml(e.developer_id)}</strong> ` +
      `${LABELS[e.event] ?? escapeHtml(e.event)}${e.file_path ? ` <code>${escapeHtml(e.file_path)}</code>` : ''} ` +
      `<span class="muted">${timeAgo(e.created_at, now)} ago</span>` +
      `${e.summary ? `<div class="summary">${escapeHtml(e.summary)}</div>` : ''}</li>`)
    .join('');
  return `<ul class="feed">${items}</ul>`;
}

export const countConflicts = (events) => events.filter((e) => e.event === 'conflict').length;


### 🤖 Assistant

> 🔧 called: execute_command



> 🔧 **execute_command** — npm test 2>&1

### 🤖 Assistant

> 🔧 called: update_todo_list

All 27 pass, 0 fail. Now the browser files:

> 🔧 **update_todo_list** — [x] Research codebase and read Task 6 spec
[x] Write plan file
[x] Present plan to user for confirmation
[x] Sub-Task 1: Create server/test/dashboard-view.test.js (failing test)
[x] Sub-Task 2: Implement server/public/view.js (make tests pass)
[-] Sub-Task 3: Implement server/public/app.js
[ ] Sub-Task 4: Implement server/public/index.html


### 🤖 Assistant

> 🔧 called: write_file

**Step 3 — `server/public/app.js`:**

> 🔧 **write_file** — import { renderLocks, renderActivity, countConflicts } from './view.js';

const repo = new URLSearchParams(location.search).get('repo');
const repoQuery = repo ? `repo=${encodeURIComponent(repo)}` : '';
const $ = (id) => document.getElementById(id);

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function refresh() {
  try {
    const [status, activity] = await Promise.all([
      getJson(`/api/locks/status?${repoQuery}`),
      getJson(`/api/activity?${repoQuery}&limit=50`),
    ]);
    const now = new Date();
    $('locks').innerHTML = renderLocks(status.active_locks, now);
    $('lock-count').textContent = status.count;
    $('activity').innerHTML = renderActivity(activity.events, now);
    $('conflicts').textContent = countConflicts(activity.events);
    $('updated').textContent = `Last updated ${now.toLocaleTimeString()}`;
    $('updated').classList.remove('error');
  } catch (err) {
    $('updated').textContent = `Server unreachable — retrying… (${err.message})`;
    $('updated').classList.add('error');
  }
}

$('repo').textContent = repo ?? 'all repos';
refresh();
setInterval(refresh, 4000);


### 🤖 Assistant

> 🔧 called: update_todo_list

**Step 4 — `server/public/index.html`:**

> 🔧 **update_todo_list** — [x] Research codebase and read Task 6 spec
[x] Write plan file
[x] Present plan to user for confirmation
[x] Sub-Task 1: Create server/test/dashboard-view.test.js (failing test)
[x] Sub-Task 2: Implement server/public/view.js (make tests pass)
[x] Sub-Task 3: Implement server/public/app.js
[-] Sub-Task 4: Implement server/public/index.html


### 🤖 Assistant

> 🔧 called: write_file



> 🔧 **write_file** — <!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>TeamContext</title>
  <style>
    :root { --bg:#0f1115; --card:#181b22; --text:#e6e8ee; --muted:#8a90a0; --red:#e5484d; --green:#30a46c; --amber:#f5a524; }
    * { box-sizing: border-box; }
    body { margin:0; font:15px/1.5 system-ui, sans-serif; background:var(--bg); color:var(--text); padding:24px 16px; }
    main { max-width:1100px; margin:0 auto; display:grid; gap:16px; grid-template-columns: 1fr 1fr; }
    header { max-width:1100px; margin:0 auto 16px; display:flex; flex-wrap:wrap; gap:16px; align-items:baseline; justify-content:space-between; }
    h1 { margin:0; font-size:22px; } h2 { margin:0 0 12px; font-size:16px; color:var(--muted); font-weight:600; }
    section { background:var(--card); border-radius:12px; padding:16px; overflow-x:auto; }
    .stats { display:flex; gap:12px; } .stat { background:var(--card); border-radius:10px; padding:8px 14px; }
    .stat b { font-size:20px; display:block; } .stat.conflicts b { color:var(--amber); }
    table { width:100%; border-collapse:collapse; } th, td { text-align:left; padding:8px; border-bottom:1px solid #262a33; }
    tr.locked td { background:color-mix(in srgb, var(--red) 18%, transparent); }
    .all-clear { padding:24px; text-align:center; border-radius:10px; background:color-mix(in srgb, var(--green) 20%, transparent); font-weight:600; }
    .feed { list-style:none; margin:0; padding:0; } .feed li { padding:8px; border-bottom:1px solid #262a33; }
    .event.conflict { background:color-mix(in srgb, var(--amber) 18%, transparent); border-radius:6px; }
    .summary { margin:4px 0 0 24px; color:var(--text); font-style:italic; }
    .muted { color:var(--muted); font-size:13px; } #updated.error { color:var(--red); }
    code { font-size:13px; }
    @media (max-width: 800px) { main { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <header>
    <h1>🚦 TeamContext <span class="muted">— <span id="repo"></span></span></h1>
    <div class="stats">
      <div class="stat"><b id="lock-count">0</b><span class="muted">files locked</span></div>
      <div class="stat conflicts"><b id="conflicts">0</b><span class="muted">conflicts avoided</span></div>
    </div>
    <span id="updated" class="muted">Loading…</span>
  </header>
  <main>
    <section><h2>Who is editing what</h2><div id="locks"></div></section>
    <section><h2>Activity &amp; handoff notes</h2><div id="activity"></div></section>
  </main>
  <script type="module" src="app.js"></script>
</body>
</html>


### 🤖 Assistant

> 🔧 called: execute_command

Final validation — run the full test suite one more time to confirm nothing broke:

> 🔧 **execute_command** — npm test 2>&1

### 🤖 Assistant

> 🔧 called: update_todo_list



> 🔧 **update_todo_list** — [x] Research codebase and read Task 6 spec
[x] Write plan file
[x] Present plan to user for confirmation
[x] Sub-Task 1: Create server/test/dashboard-view.test.js (failing test)
[x] Sub-Task 2: Implement server/public/view.js (make tests pass)
[x] Sub-Task 3: Implement server/public/app.js
[x] Sub-Task 4: Implement server/public/index.html


### 🤖 Assistant

Task 6 complete. Summary of what was done:

---

### Files created

| File | Description |
|------|-------------|
| [`server/test/dashboard-view.test.js`](server/test/dashboard-view.test.js) | 6 unit tests — written first (TDD), confirmed failing with `Cannot find module` |
| [`server/public/view.js`](server/public/view.js) | Pure ESM: `escapeHtml`, `timeAgo`, `renderLocks`, `renderActivity`, `countConflicts` — no DOM dependency, importable in Node |
| [`server/public/app.js`](server/public/app.js) | Browser entry-point: polls `/api/locks/status` + `/api/activity` every 4 s, renders via `view.js`, handles errors gracefully |
| [`server/public/index.html`](server/public/index.html) | Static dark-mode shell with two-column grid, stat counters, no tokens |

### Test result
`# pass 27` / `# fail 0` — the 6 new dashboard tests pass alongside the existing 21.

### Nothing touched
`server/lib/`, `server/server.js`, `server/package.json`, `supabase/` — all untouched. No new libraries, no tokens in HTML/JS.