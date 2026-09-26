# TeamContext — Full Project Context (for AI agent harness)

> Load this file as persistent project context (e.g. AGENTS.md / project rules).
> It describes the hackathon constraints, the product, the architecture, the API contract,
> the build order, and the submission requirements. Follow it strictly.

---

## 1. Hackathon constraints (non-negotiable)

- **Event:** IBM Bob 2.0 Hackathon, hosted by lablab.ai × IBM. Online, 48 hours.
- **Deadline:** Sunday Sep 27, 2026 at **15:00 UTC** (= **09:00 Guatemala time, UTC-6**). Submissions close then; judging begins.
- **Theme:** "Build with purpose using IBM Bob 2.0" — a working prototype that improves a specific **developer workflow**, using Bob features (Agent mode, parallel tasks, subagents, document understanding) to manage multiple steps, not just autocomplete code. Impact must be demonstrated (less time, fewer errors, less rework).
- **Eligibility rule:** Any tech stack is allowed, but **IBM Bob IDE must be a core component** of the solution. Bob Shell is optional.
- **Bobcoins:** 40 per person on the hackathon-provisioned Bob account. No top-ups once exhausted. Use the hackathon instance (not personal accounts). Plan prompts carefully; prefer Plan mode → Code mode on well-scoped tasks.
- **Bob IDE version:** v2.0.2 or later.
- **Data rules:** Bring your own data. No company-confidential data, no client data, no personal information, no social media data. Public data only if terms allow; keep a list of sources. TeamContext should use only sample/demo repos and synthetic developer IDs.
- **No secrets in the repo.** `.env`, `.env.local`, `.vercel/`, `.bob/mcp.json` and any tokens go in `.gitignore` (and `.bobignore` where relevant).
- **Optional IBM extras:** watsonx.ai (Granite models) and watsonx Orchestrate may be used; nice-to-have, not required.

### Required evidence
- A folder named **`bob_sessions/`** in the final repo containing **PNG screenshots of every Bob task session summary** related to the project (Bob IDE → Tasks → open task → click task header → screenshot the consumption summary).
- File naming: `teamcontext_task01_short_description.png`, `teamcontext_task02_...png`, etc.
- **Capture these as you go, after every Bob task.** Do not leave it for the end.

### Submission deliverables
Confirmed by the official guide: working repo with `bob_sessions/`. The following list comes from other participants' repos and should be **verified in the lablab submission form**:
- Public GitHub repo (MIT license) + `bob_sessions/`
- Demo video ≤ 3 min (≥ 90 s live demo, narration, explicit Bob usage)
- Problem & solution statement (≤ 500 words)
- IBM Bob usage statement (≤ 500 words)
- Cover image + slides
- Demo app URL
- `DATA_SOURCES.md` (declare that only synthetic/sample data was used)

---

## 2. Product: TeamContext

### Problem
Each developer on a team now codes with their own AI agent (Bob, Claude Code, Codex). The agents don't know what the other agents are doing. Result: two agents edit the same file at the same time, merge conflicts, silent API contract changes, and time lost catching up on what teammates did.

### Solution
A lightweight coordination layer ("semaphore") for AI-assisted teams:
1. **Central Server** — tracks which developer (via their agent) is editing which file.
2. **Local MCP Server** — runs on each developer's machine and exposes lock/unlock tools to Bob.
3. **Bob custom mode + rules** — makes Bob call the tools **automatically** before and after edits, with no human prompting. This is what makes Bob the core of the product.
4. **Web Dashboard** — live view of who is working on what, conflict alerts, and an activity feed of what each agent finished (with handoff notes).

### Positioning (important for judging)
Bob is the **primary, first-class agent**: custom mode, rules, and the demo all run on Bob. Compatibility with other MCP agents is a one-line bonus, never the headline.

### Impact metric
Conflicts avoided and coordination time saved, shown as a **before/after** demo (same scenario without and with TeamContext).

---

## 3. Architecture

```
TeamContextRepo/
├── supabase/
│   └── migrations/            # Postgres schema `teamcontext` + atomic acquire() function
├── server/                    # Central Server (Express 5 on Vercel, data in Supabase Postgres). Vercel Root Directory.
│   ├── package.json
│   ├── server.js              # Vercel entrypoint: `export default app` (listens locally)
│   ├── lib/
│   │   ├── db.js              # pg Pool → Supabase (TLS verified with Supabase CA)
│   │   ├── store.js           # lock/activity logic (no HTTP)
│   │   ├── auth.js            # Bearer TEAM_TOKEN check (write endpoints only)
│   │   ├── routes.js          # /api/*
│   │   └── app.js             # express app factory, /health, CORS
│   ├── public/                # Dashboard (static HTML/JS), served by Vercel's CDN
│   ├── test/                  # node:test + PGlite (in-memory Postgres running the real migration)
│   └── .env.example
├── mcp-server/                # Local MCP server (stdio), @modelcontextprotocol/sdk
│   ├── package.json
│   ├── index.js
│   └── lib/                   # paths, repo detection, HTTP client, messages
├── bob/                       # Bob custom mode + rules + mcp.example.json (committed, no secrets)
├── bob_sessions/              # REQUIRED Bob task summary screenshots (PNG)
├── docs/superpowers/plans/    # Implementation plan (task split, code, schedule)
├── DATA_SOURCES.md
├── LICENSE                    # MIT
└── README.md
```

### Design decisions (keep)
- Polling every 4 s instead of WebSockets/SSE.
- Shared team token + free-text `developer_id` instead of per-user auth.
- Explicit MCP tools (no interception of Bob's internal tools); the custom mode rules make the calls automatic.
- **Hosting: Vercel** (Express, zero-config) + **Supabase Postgres**. Tables live in a private schema `teamcontext` (not exposed by the Supabase Data API); only the server touches them via `POSTGRES_URL`.
- `acquire` is a single plpgsql function (one transaction) so concurrent Vercel instances can never grant the same lock twice.

---

## 4. Database schema (Supabase Postgres)

Full migration: `supabase/migrations/20260926000000_teamcontext.sql`.

```sql
create schema if not exists teamcontext;

create table teamcontext.locks (
  lock_id      uuid primary key default gen_random_uuid(),
  developer_id text not null,
  file_path    text not null,          -- normalized, repo-relative, forward slashes
  repo         text not null,
  acquired_at  timestamptz not null,
  unique (file_path, repo)
);

create table teamcontext.activity (
  id           bigint generated always as identity primary key,
  developer_id text not null,
  repo         text not null,
  file_path    text,                   -- null for task-level entries
  event        text not null,          -- 'lock' | 'unlock' | 'conflict' | 'release_all'
  summary      text,                   -- optional handoff note: what was done / what's pending
  created_at   timestamptz not null
);
-- + teamcontext.acquire(developer, file, repo, ttl_minutes, now) → jsonb { status, lock }
```

The API always returns timestamps as ISO 8601 UTC strings (`2026-09-26T10:00:00.000Z`).

`LOCK_TTL_MINUTES` (env, default 30): a lock older than the TTL is treated as expired.

---

## 5. Central Server API contract

Auth: write endpoints require `Authorization: Bearer <TEAM_TOKEN>`. **Read endpoints are public and read-only** so the dashboard never needs the token (no secrets in committed HTML). Enable CORS.

### `GET /health` (public)
`200 { "ok": true }`

### `POST /api/locks/acquire` (auth)
Body: `{ "developer_id": "alice", "file_path": "src/components/Header.tsx", "repo": "demo-repo" }`

Logic, in order:
1. Delete expired locks (older than TTL) for this `file_path` + `repo`.
2. If a lock exists **held by the same developer** → refresh `acquired_at`, return `200 granted` (idempotent; never report a conflict with yourself).
3. If a lock exists held by **another** developer → log `conflict` in `activity`, return `409`:
   `{ "status": "conflict", "conflict_with": "bob", "acquired_at": "...", "file_path": "..." }`
4. Otherwise insert, log `lock`, return `200`:
   `{ "status": "granted", "lock_id": "uuid", "file_path": "...", "developer_id": "alice", "acquired_at": "..." }`

### `POST /api/locks/release` (auth)
Body: `{ "developer_id": "alice", "file_path": "...", "repo": "...", "summary": "optional handoff note" }`
- Deletes the lock only if held by that developer. Logs `unlock` with `summary`.
- `200 { "status": "released", "file_path": "..." }` or `404 { "status": "not_found" }`.

### `POST /api/locks/release_all` (auth)
Body: `{ "developer_id": "alice", "repo": "...", "summary": "optional task-level handoff note" }`
- Releases every lock held by that developer in that repo. Logs one `release_all` entry with `summary`.
- `200 { "status": "released", "count": N }`

### `GET /api/locks/status?repo=demo-repo` (public)
`200 { "active_locks": [ { lock_id, developer_id, file_path, repo, acquired_at } ], "count": N }` — excludes expired locks.

### `GET /api/activity?repo=demo-repo&limit=50` (public)
`200 { "events": [ { developer_id, file_path, event, summary, created_at } ] }` — newest first.

### `DELETE /api/locks/stale` (auth, admin/demo)
Body: `{ "older_than_minutes": 60 }` → `200 { "deleted": N }`

---

## 6. Local MCP Server

- Transport: stdio. SDK: `@modelcontextprotocol/sdk`.
- Config via env vars (injected from Bob's MCP config, not committed): `CENTRAL_SERVER_URL`, `TEAM_TOKEN`, `DEVELOPER_ID`.
- **Repo detection:** derive `repo` automatically from `git remote get-url origin` (fallback: folder name). Do not rely on the agent to pass it.
- **Path normalization:** convert to repo-relative, forward slashes, strip leading `./`, resolve `..`. Both `./src/A.ts` and `src\A.ts` must map to `src/A.ts`.
- If the central server is unreachable or slow (timeout ~10 s), return a warning message; **never crash**.

### Tools
| Tool | Args | Returns |
|---|---|---|
| `file_lock` | `file_path` | `✅ Lock granted for <path>` or `⚠️ CONFLICT: <dev> has been editing <path> since <time>. Do not edit this file.` |
| `file_unlock` | `file_path`, `summary?` | `🔓 Lock released for <path>` or `⚠️ No active lock found` |
| `release_all` | `summary?` | `🔓 Released N locks` |
| `team_status` | — | Human-readable list of active locks and last activity entries, so Bob can plan around teammates. |

---

## 7. Bob custom mode: "TeamContext"

Create a custom mode (see Bob docs: custom modes, custom rules, MCP configuration — verify exact config format in the docs, don't guess) whose instructions include:

1. At the start of a task, call `team_status` to see what teammates are working on.
2. **Before editing any file**, call `file_lock` for that file. Never edit a file without a granted lock.
3. If `file_lock` returns a CONFLICT: do **not** edit that file. Stop, tell the user who holds it and since when, and propose alternatives (work on another part, wait, or coordinate with the teammate).
4. When finished with a file, call `file_unlock` with a one-line `summary` of what changed.
5. When the task ends (success or abort), call `release_all` with a short handoff `summary`: what was done, what failed, what's pending.
6. Never write tokens or secrets into files.

Also generate/maintain `AGENTS.md` via Bob `/init` so project context persists across sessions.

---

## 8. Dashboard

- Single static page, no build step, in `server/public/`, served by Vercel's CDN at the public URL (same origin as the API).
- Polls `/api/locks/status` and `/api/activity` every 4 s. **No token in the HTML.**
- Shows: active locks (red rows: developer, file, repo, time held), "All clear" green state when empty, recent conflicts highlighted, activity feed with handoff summaries, last-updated timestamp.
- Optional stretch: "Generate standup" button that summarizes the last N hours of `activity` (via watsonx.ai Granite if time allows; otherwise a deterministic grouped summary).

---

## 9. Build order (strict)

1. **Server core** — Postgres migration (both tables + `acquire` function), lock store tested with PGlite, Express, auth middleware on write routes only, `/health`, CORS.
2. **Lock routes** — acquire (idempotent + TTL), release (+summary), release_all, status, activity, stale. Test with curl.
3. **Deploy** — Supabase (via Vercel Marketplace) + Vercel (Root Directory `server/`). Apply the migration in the Supabase SQL editor. `TEAM_TOKEN`, `POSTGRES_URL`, `SUPABASE_CA_CERT` only in Vercel env vars (`vercel env pull .env.local` for local dev).
4. **Local MCP server** — four tools, repo detection, path normalization, graceful failure.
5. **Bob custom mode + rules** — then verify Bob calls the tools automatically without being asked.
6. **Dashboard** — locks, conflicts, activity feed.
7. **End-to-end test on two machines** (see demo script).
8. **Submission assets** — video, statements, slides, cover, `DATA_SOURCES.md`, README, `bob_sessions/` complete.

Stretch only after 1–8 pass: standup generation, API-contract alerts (flag edits to OpenAPI/DTO files), git activity fallback.

**Out of scope:** Onboarding Assistant (generic, crowded category). Session Handoff is already covered by the `summary` fields.

---

## 10. Demo script (before/after)

Use a small public/sample repo (no private or client code).

1. **Without TeamContext:** Developer A and Developer B each give their Bob agent a task that touches the same file. Both edit it; merging produces a conflict. Show the conflict.
2. **With TeamContext:** Same two tasks with the TeamContext custom mode on. A's Bob locks the file (dashboard turns red). B's Bob receives the CONFLICT, stops, and tells B who holds it. A finishes → unlock with summary → dashboard shows the handoff note. B retries → lock granted → no merge conflict.
3. Show the activity feed / standup.
4. Close with the metric: conflicts avoided and minutes saved, plus a flash of the `bob_sessions/` folder.
5. Narrative hook: "We built TeamContext using TeamContext" (only claim this for the phase after the MVP was working).

Before recording: hit `/health` and `/api/locks/status` (warms the function and the DB connection); clear stale locks with `DELETE /api/locks/stale {"older_than_minutes":0}`.

---

## 11. Deployment checklist

- [ ] `TEAM_TOKEN`, `POSTGRES_URL`, `SUPABASE_CA_CERT` only in Vercel env vars
- [ ] `.env`, `.env.local`, `.vercel/`, `.bob/mcp.json` in `.gitignore`
- [ ] Migration applied in Supabase; Supabase project not paused
- [ ] `/health` returns 200 on the public URL
- [ ] Dashboard loads from the public URL with no token in its source
- [ ] Both developers have the MCP server and the custom mode configured
- [ ] TTL set for the demo (e.g. 30 min)
- [ ] `bob_sessions/` contains a PNG for every Bob task used
- [ ] All submission assets uploaded before **Sun Sep 27, 09:00 Guatemala / 15:00 UTC**

---

## 12. Open question for mentors

Bob is the primary agent (custom mode, rules, subagents), but the MCP server technically works with any MCP client. Confirm this still counts as "Bob as a core component", or whether the scope should be presented as Bob-only.
