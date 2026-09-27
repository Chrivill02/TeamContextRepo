# Task 6: Dashboard — Implementation Plan

## Overview

Create a polling-only, token-free status dashboard for TeamContext. The dashboard reads from two public read-only endpoints (`GET /api/locks/status` and `GET /api/activity`) and renders live lock state and activity in the browser. No new libraries, no auth tokens, no changes to server logic.

Four files are created:
- `server/test/dashboard-view.test.js` — 6 unit tests for pure view functions (TDD: write first, run failing, implement, run passing)
- `server/public/view.js` — Pure ESM view-rendering functions (no DOM)
- `server/public/app.js` — Browser entry-point: polls APIs and injects rendered HTML
- `server/public/index.html` — Static HTML shell with dark-mode CSS

---

## Sub-Tasks

### Sub-Task 1: Write the failing test file

**Intent:** Follow TDD — write the tests before the implementation exists so we see the expected failure first.

**Expected Outcomes:**
- `server/test/dashboard-view.test.js` exists
- Running `cd server && npm test` fails with `Cannot find module '.../server/public/view.js'`

**Todo List:**
- [ ] Create `server/test/dashboard-view.test.js` with the exact content from the plan (lines 1531–1569 of `2026-09-26-teamcontext-mvp.md`)

**Relevant Context:**
- Import path: `../public/view.js` (relative to `server/test/`)
- Test runner: `node --test` (auto-discovers `*.test.js`)
- All 6 tests use a fixed `now = new Date('2026-09-26T10:10:00.000Z')` to stay deterministic

**Status:** `[ ] pending`

---

### Sub-Task 2: Implement `server/public/view.js`

**Intent:** Make all 6 tests pass with pure, side-effect-free ESM functions.

**Expected Outcomes:**
- `server/public/view.js` exists and exports `escapeHtml`, `timeAgo`, `renderLocks`, `renderActivity`, `countConflicts`
- Running `cd server && npm test` reports `# pass 24`, `# fail 0` (existing ~18 tests + 6 new ones)

**Todo List:**
- [ ] Create `server/public/` directory
- [ ] Create `server/public/view.js` with the exact implementation from the plan (lines 1578–1613 of `2026-09-26-teamcontext-mvp.md`)

**Relevant Context:**
- `escapeHtml`: replaces `& < > " '` using a lookup map
- `timeAgo(iso, now)`: returns `"Xs"`, `"Xm"`, or `"Xh Ym"` based on elapsed seconds
- `renderLocks`: returns an `all-clear` div when empty, otherwise a `<table>` with class `locked` rows
- `renderActivity`: returns a `<ul class="feed">` where conflict events get `class="event conflict"`, summaries are HTML-escaped
- `countConflicts`: pure filter count — no DOM dependency

**Status:** `[ ] pending`

---

### Sub-Task 3: Implement `server/public/app.js`

**Intent:** Wire the view functions to the live API via 4-second polling.

**Expected Outcomes:**
- `server/public/app.js` exists
- Uses `import` from `./view.js` (ESM module)
- Polls `/api/locks/status` and `/api/activity` every 4 seconds
- Shows error message in `#updated` on network failure (never crashes)
- Reads optional `?repo=` query param to scope API calls
- Contains **no tokens or secrets**

**Todo List:**
- [ ] Create `server/public/app.js` with the exact implementation from the plan (lines 1623–1657 of `2026-09-26-teamcontext-mvp.md`)

**Relevant Context:**
- `<script type="module" src="app.js">` in the HTML — must be ESM
- Poll interval: 4000 ms (per AGENTS.md constraint: polling-only, no WebSockets/SSE)
- Error path updates `#updated` text and adds class `error` — never throws to the event loop

**Status:** `[ ] pending`

---

### Sub-Task 4: Implement `server/public/index.html`

**Intent:** Provide the static HTML shell: CSS variables, layout grid, stat counters, and the `<div>` mount points for the two sections.

**Expected Outcomes:**
- `server/public/index.html` exists
- Dark-mode design using CSS custom properties
- Two-column responsive grid (`locks` section + `activity` section) with stats bar
- `<script type="module" src="app.js">` at end of body
- **No tokens anywhere in the file** (confirmed by view-source)

**Todo List:**
- [ ] Create `server/public/index.html` with the exact content from the plan (lines 1662–1706 of `2026-09-26-teamcontext-mvp.md`)

**Relevant Context:**
- DOM element IDs expected by `app.js`: `#repo`, `#lock-count`, `#conflicts`, `#updated`, `#locks`, `#activity`
- CSS uses `color-mix(in srgb, ...)` for tinted backgrounds — modern browsers only, no polyfill
- Plan line 1718 explicitly requires: "confirm that no token appears in view-source"

**Status:** `[ ] pending`

---

## Files Created (summary)

| File | Type | Notes |
|------|------|-------|
| `server/test/dashboard-view.test.js` | Test | 6 unit tests, no DOM, deterministic clock |
| `server/public/view.js` | Library | Pure ESM, no DOM, importable in Node for tests |
| `server/public/app.js` | Browser | ESM module, polls every 4 s, no tokens |
| `server/public/index.html` | Static | Dark-mode CSS, no frameworks |

## Non-Goals (explicit)

- Do NOT touch `server/lib/`, `server/server.js`, `server/package.json`
- Do NOT touch `supabase/`
- Do NOT add any npm packages
- Do NOT commit, push, or create a PR
- Do NOT add any auth tokens to the HTML/JS
