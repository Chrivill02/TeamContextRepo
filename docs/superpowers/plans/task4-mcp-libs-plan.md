# Task 4 — MCP Server Libraries Plan

**Goal:** Build the four pure-logic libraries that the MCP server entry point will use: path normalization, repo detection, HTTP client, and message formatting. All four are tested with `node:test` before any implementation is written (TDD). No running server is needed — the HTTP client is tested with a fake `fetch`.

**Scope:** `mcp-server/` directory only. No entry point (`index.js`) yet — that is Task 5.

**Source of truth:** `docs/superpowers/plans/2026-09-26-teamcontext-mvp.md` §Task 4 (Steps 1–9) and `TEAMCONTEXT_CONTEXT.md` §6.

**Branch:** `feat/mcp-server` off `develop`.

**Expected test result when done:** `cd mcp-server && npm test` → `# pass 25`, `# fail 0`.

---

## Sub-Task A — Bootstrap the `mcp-server` package

**Intent:** Create the `mcp-server/` directory structure and `package.json` with the right module type, test script, bin entry, and dependencies. This must happen before any other sub-task.

**Expected Outcomes:**
- `mcp-server/package.json` exists with `"type": "module"`, `"scripts": { "test": "node --test" }`, `"bin": { "teamcontext-mcp": "index.js" }`, `"engines": { "node": ">=20" }`.
- Dependencies installed: `@modelcontextprotocol/sdk@^1`, `zod@^3`.
- Directories `mcp-server/lib/` and `mcp-server/test/` exist.

**Todo List:**
- [ ] Create branch `feat/mcp-server` off `develop` and pull latest.
- [ ] Run `mkdir -p mcp-server/lib mcp-server/test`.
- [ ] Run `npm init -y` inside `mcp-server/`, then `npm pkg set` to configure type, scripts, bin, engines.
- [ ] Run `npm install @modelcontextprotocol/sdk@^1 zod@^3` inside `mcp-server/`.

**Relevant Context:** `docs/superpowers/plans/2026-09-26-teamcontext-mvp.md` §Task 4 Step 1.

**Status:** [x] done

---

## Sub-Task B — Write failing tests (Red phase)

**Intent:** Write all four test files before writing any implementation. This confirms the interfaces are well-defined and gives a clear target for the Green phase.

**Expected Outcomes:**
- `mcp-server/test/paths.test.js` — 7 tests for `normalizePath`.
- `mcp-server/test/repo.test.js` — 5 tests for `repoNameFromRemote` and `detectRepo`.
- `mcp-server/test/client.test.js` — 5 tests for `createClient` (uses `fakeFetch`, never real network).
- `mcp-server/test/messages.test.js` — 8 tests for all four message functions.
- Running `cd mcp-server && npm test` fails with `Cannot find module` errors (expected at this stage).

**Todo List:**
- [ ] Create `mcp-server/test/paths.test.js` with the 7 path normalization tests.
- [ ] Create `mcp-server/test/repo.test.js` with the 5 repo detection tests.
- [ ] Create `mcp-server/test/client.test.js` with the 5 HTTP client tests (including `fakeFetch` helper).
- [ ] Create `mcp-server/test/messages.test.js` with the 8 message formatting tests.
- [ ] Run `cd mcp-server && npm test` and confirm it fails with module-not-found errors.

**Relevant Context:** `docs/superpowers/plans/2026-09-26-teamcontext-mvp.md` §Task 4 Step 2. Exact test code is provided verbatim in the plan — copy it exactly, do not paraphrase.

**Status:** [x] done

---

## Sub-Task C — Implement `lib/paths.js` (Green)

**Intent:** Produce the canonical lock-key function: converts any file path (absolute, Windows, relative with `./` or `..`) to a repo-relative POSIX string.

**Expected Outcomes:**
- `mcp-server/lib/paths.js` exports `normalizePath(filePath, repoRoot?)`.
- All 7 tests in `paths.test.js` pass.

**Todo List:**
- [ ] Create `mcp-server/lib/paths.js` using the implementation from the plan.
- [ ] Run `cd mcp-server && node --test test/paths.test.js` — all 7 pass.

**Relevant Context:** `docs/superpowers/plans/2026-09-26-teamcontext-mvp.md` §Task 4 Step 4. Key rule: both `./src/A.ts` and `src\A.ts` must map to `src/A.ts`.

**Status:** [x] done

---

## Sub-Task D — Implement `lib/repo.js` (Green)

**Intent:** Auto-detect the repo name from `git remote get-url origin` and the repo root from `git rev-parse --show-toplevel`. Falls back gracefully when outside a git repo.

**Expected Outcomes:**
- `mcp-server/lib/repo.js` exports `repoNameFromRemote(url)` and `detectRepo(cwd)`.
- All 5 tests in `repo.test.js` pass.

**Todo List:**
- [ ] Create `mcp-server/lib/repo.js` using the implementation from the plan.
- [ ] Run `cd mcp-server && node --test test/repo.test.js` — all 5 pass.

**Relevant Context:** `docs/superpowers/plans/2026-09-26-teamcontext-mvp.md` §Task 4 Step 5. Git calls use `execFileSync` with `stdio: ['ignore', 'pipe', 'ignore']` and swallow exceptions — the function must never throw.

**Status:** [x] done

---

## Sub-Task E — Implement `lib/client.js` (Green)

**Intent:** Thin HTTP wrapper for the central server API. Every method returns `Promise<{ ok, status, data?, error? }>` and never throws — network errors and timeouts become `{ ok: false, status: 0, error: "..." }`. Uses `AbortSignal.timeout` for the 10 s deadline.

**Expected Outcomes:**
- `mcp-server/lib/client.js` exports `createClient({ baseUrl, token, developerId, repo, timeoutMs?, fetchImpl? })`.
- All 5 tests in `client.test.js` pass, including the network-error and timeout tests.

**Todo List:**
- [ ] Create `mcp-server/lib/client.js` using the implementation from the plan.
- [ ] Run `cd mcp-server && node --test test/client.test.js` — all 5 pass.

**Relevant Context:** `docs/superpowers/plans/2026-09-26-teamcontext-mvp.md` §Task 4 Step 6. Critical: 409 is a valid response (conflict), not an error — it must be returned as `{ ok: false, status: 409, data: ... }`, not thrown.

**Status:** [x] done

---

## Sub-Task F — Implement `lib/messages.js` (Green)

**Intent:** Convert HTTP response objects into the human-readable strings that Bob reads. These strings directly influence Bob's behavior — the conflict message must say "Do not edit this file." and the server-down message must be a warning, not a crash.

**Expected Outcomes:**
- `mcp-server/lib/messages.js` exports `lockMessage`, `unlockMessage`, `releaseAllMessage`, `teamStatusMessage`.
- All 8 tests in `messages.test.js` pass.

**Todo List:**
- [ ] Create `mcp-server/lib/messages.js` using the implementation from the plan.
- [ ] Run `cd mcp-server && node --test test/messages.test.js` — all 8 pass.

**Relevant Context:** `docs/superpowers/plans/2026-09-26-teamcontext-mvp.md` §Task 4 Step 7. The `teamStatusMessage` must mark the current developer's own locks as `YOU` and list activity newest-first.

**Status:** [x] done

---

## Sub-Task G — Full test run, commit, and PR

**Intent:** Confirm all 25 tests pass together, then commit and push. The screenshot of the passing test run (`bob_sessions/teamcontext_task20_mcp_libs.png`) is required hackathon evidence.

**Expected Outcomes:**
- `cd mcp-server && npm test` → `# pass 25`, `# fail 0`.
- All files committed on `feat/mcp-server` with message `feat(mcp): path normalization, repo detection, resilient client and tool messages`.
- PR opened against `develop` via `gh pr create`.
- **`bob_sessions/teamcontext_task20_mcp_libs.png` screenshot captured by Eswin** before the commit (Bob cannot take screenshots).

**Todo List:**
- [ ] Run `cd mcp-server && npm test` — confirm `# pass 25`, `# fail 0`.
- [ ] ⚠️ **Eswin: take screenshot** of the passing test output → save as `bob_sessions/teamcontext_task20_mcp_libs.png`.
- [ ] Stage `mcp-server/package.json`, `mcp-server/package-lock.json`, `mcp-server/lib/`, `mcp-server/test/`, and `bob_sessions/teamcontext_task20_mcp_libs.png`.
- [ ] Commit with message `feat(mcp): path normalization, repo detection, resilient client and tool messages`.
- [ ] Push branch and open PR against `develop` with `gh pr create`.

**Relevant Context:** `docs/superpowers/plans/2026-09-26-teamcontext-mvp.md` §Task 4 Step 8–9. `TEAMCONTEXT_CONTEXT.md` §1 ("Required evidence" — one PNG per Bob task, named `teamcontext_task20_...`).

**Status:** [x] done
