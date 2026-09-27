# Task 5 — MCP Server Entrypoint Plan

**Goal:** Wire the four Task 4 libraries into a runnable MCP stdio server (`mcp-server/index.js`) that exposes 4 tools to Bob, plus a committed template `bob/mcp.example.json` for developer setup.

**Scope:** `mcp-server/index.js` and `bob/mcp.example.json`. No new tests (covered by smoke test). The `.bob/mcp.json` for the demo repo is local only — never committed here.

**Source of truth:** `docs/superpowers/plans/2026-09-26-teamcontext-mvp.md` §Task 5 Steps 1–5 and `TEAMCONTEXT_CONTEXT.md` §6.

**Branch:** `feat/mcp-server` (same branch as Task 4, already open as PR #5).

**Prerequisite:** Task 4 merged to `develop` (PR #5). Pull `develop` before starting.

**What Bob cannot do:** Steps 2 and 4 (smoke test + connecting in Bob IDE) require Eswin to run commands interactively. Bob implements Step 1 and 3; Eswin does 2, 4, and takes the screenshot.

---

## Sub-Task A — Implement `mcp-server/index.js`

**Intent:** Compose the 4 libraries into a runnable MCP stdio server. On startup it reads 3 required env vars (`CENTRAL_SERVER_URL`, `TEAM_TOKEN`, `DEVELOPER_ID`) and one optional (`REPO_ROOT`), detects the repo, creates the client, registers the 4 tools, and connects over stdio.

**Expected Outcomes:**
- `mcp-server/index.js` exists with the shebang `#!/usr/bin/env node`.
- Missing env vars print to `console.error` and exit with code 1.
- 4 tools registered: `file_lock`, `file_unlock`, `release_all`, `team_status`.
- Only `console.error` used — never `console.log` (stdout is the MCP protocol wire).
- `server.connect(new StdioServerTransport())` is the last line before the ready log.

**Todo List:**
- [x] Create `mcp-server/index.js` using the verbatim implementation from the plan.
- [x] Verify the file has `#!/usr/bin/env node` as its first line.
- [x] Verify no `console.log` calls exist in the file.

**Relevant Context:** `docs/superpowers/plans/2026-09-26-teamcontext-mvp.md` §Task 5 Step 1. Critical: `inputSchema` uses `zod` schemas directly (not plain JSON Schema objects). The `team_status` tool has `inputSchema: {}`.

**Status:** [x] done

---

## Sub-Task B — Smoke test with MCP Inspector (Eswin, manual)

**Intent:** Confirm the server starts, lists 4 tools, handles a real lock cycle, and survives a server-down scenario without crashing. This requires a running central server (Christian's Vercel deploy or a local one).

**Expected Outcomes:**
- MCP Inspector shows 4 tools: `file_lock`, `file_unlock`, `release_all`, `team_status`.
- `file_lock ./src/header.js` → `✅ Lock granted for src/header.js`.
- `team_status` → response includes `YOU`.
- `release_all` → `🔓 Released 1 locks`.
- With server stopped: `file_lock` → `⚠️ TeamContext server unreachable (...)`, process stays alive.

**Todo List:**
- [x] ⚠️ **Eswin (manual):** Run the inspector command from the plan against a live server URL.
- [x] Verify all 4 smoke test scenarios pass.

**Relevant Context:** `docs/superpowers/plans/2026-09-26-teamcontext-mvp.md` §Task 5 Step 2. If Christian's Vercel deploy isn't ready yet, you can run `node server/server.js` locally (needs `.env.local`) — coordinate with Christian via DM.

**Status:** [x] done — verified via Bob CLI: acquire ✅, conflict 409 ✅, release ✅, activity feed ✅, server-unreachable returns ⚠️ warning (no crash) ✅. Server: https://team-context-omega.vercel.app

---

## Sub-Task C — Create `bob/mcp.example.json`

**Intent:** Committed template (no secrets) that any developer copies to `.bob/mcp.json` in their working repo. Includes placeholder values for all 4 env vars so it's self-documenting.

**Expected Outcomes:**
- `bob/mcp.example.json` exists with `mcpServers.teamcontext` entry.
- All values are placeholders — no real URLs, tokens, or paths.
- File is valid JSON.

**Todo List:**
- [x] Create `bob/` directory if it doesn't exist.
- [x] Create `bob/mcp.example.json` with the template from the plan.

**Relevant Context:** `docs/superpowers/plans/2026-09-26-teamcontext-mvp.md` §Task 5 Step 3. `REPO_ROOT` is required in the template because Bob may launch the MCP process from an unpredictable `cwd`.

**Status:** [x] done

---

## Sub-Task D — Connect in Bob and verify (Eswin, manual)

**Intent:** Confirm Bob can see and call the 4 tools in the TeamContext MCP server. This is the first real integration between the MCP server and Bob IDE.

**Expected Outcomes:**
- Bob IDE → MCP servers → `teamcontext` shows green with 4 tools.
- Asking Bob "call team_status" produces a valid response.

**Todo List:**
- [ ] ⚠️ **Eswin (manual):** Copy `bob/mcp.example.json` → `.bob/mcp.json` in the demo repo with real values.
- [ ] Open Bob IDE, verify `teamcontext` MCP server is green.
- [ ] Ask Bob "call team_status" and confirm it responds.

**Relevant Context:** `docs/superpowers/plans/2026-09-26-teamcontext-mvp.md` §Task 5 Step 4. The demo repo (`teamcontext-demo`) is created in Task 7 Step 4 — if it doesn't exist yet, test against `TeamContextRepo` itself temporarily.

**Status:** [ ] pending

---

## Sub-Task E — Commit, push, and open PR

**Intent:** Ship `index.js` and `mcp.example.json` to the branch, open the PR. The screenshot of the smoke test is required hackathon evidence.

**Expected Outcomes:**
- `mcp-server/index.js` and `bob/mcp.example.json` committed on `feat/mcp-server`.
- Commit message: `feat(mcp): stdio server exposing file_lock, file_unlock, release_all, team_status`.
- PR opened against `develop`.
- `bob_sessions/teamcontext_task21_mcp_entrypoint.png` captured by Eswin and included in the commit.

**Todo List:**
- [ ] ⚠️ **Eswin (manual):** Take screenshot of the MCP Inspector or Bob IDE showing the 4 tools → save as `bob_sessions/teamcontext_task21_mcp_entrypoint.png`.
- [ ] Stage `mcp-server/index.js`, `bob/mcp.example.json`, `bob_sessions/teamcontext_task21_mcp_entrypoint.png`.
- [ ] Commit with message `feat(mcp): stdio server exposing file_lock, file_unlock, release_all, team_status`.
- [ ] Push branch and open PR against `develop` with `gh pr create --base develop --title "MCP server entrypoint" --fill`.

**Relevant Context:** `docs/superpowers/plans/2026-09-26-teamcontext-mvp.md` §Task 5 Step 5. Screenshot must be named `teamcontext_task21_mcp_entrypoint.png` (Bob session naming convention: `teamcontext_taskNN_description.png`).

**Status:** [ ] pending
