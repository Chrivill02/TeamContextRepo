# TeamContext

**A traffic light for AI coding agents.** TeamContext stops two developers' AI agents from editing the same file at the same time. Before IBM Bob edits a file, it claims a lock. If a teammate's agent already holds that file, Bob stops and says who has it.

Built for the **IBM Bob 2.0 Hackathon** (lablab.ai × IBM). See [Problem & Solution](PROBLEM_AND_SOLUTION.md) and [How we used IBM Bob](IBM_BOB_USAGE.md).

## The problem

Every developer on the team now codes with their own AI agent, and those agents don't know what the others are doing. The result is two agents editing the same file, merge conflicts, silent API changes, and time lost catching up.

## How it works

```
 Bob (custom mode "TeamContext")
   │  calls MCP tools automatically: team_status → file_lock → edit → file_unlock → release_all
   ▼
 Local MCP server (stdio, one per developer)
   │  HTTPS + team token
   ▼
 Central server — Express on Vercel, data in Supabase Postgres
   │
   ▼
 Live dashboard — who is editing what, conflicts avoided, handoff notes
```

1. **Bob custom mode + rules (`bob/`)**: Bob calls the tools itself, before and after every edit, without being asked.
2. **Local MCP server (`mcp-server/`)**: exposes `file_lock`, `file_unlock`, `release_all` and `team_status`. It detects the repo from `git`, normalizes paths, and never crashes if the server is unreachable.
3. **Central server (`server/`)**: a REST API for locks and activity. Lock acquisition is a single Postgres transaction, locks expire after a TTL, and each unlock carries a handoff summary.
4. **Dashboard (`server/public/`)**: a static page that polls every 4 seconds and holds no secrets.

## Repository layout

```
supabase/migrations/   Postgres schema + atomic acquire() function
server/                Express API (Vercel root directory) + dashboard in public/
mcp-server/            Local MCP server used by Bob
bob/                   TeamContext custom mode, rules, mcp.example.json
bob_sessions/          Screenshots of every Bob task session (hackathon evidence)
docs/superpowers/plans/ Implementation plan
TEAMCONTEXT_CONTEXT.md Project context: hackathon rules, API contract, demo script
```

## Setup

### 1. Central server (Vercel + Supabase)
1. Create a Vercel project with **Root Directory `server`**. Add Supabase from the Vercel Marketplace (Storage → Supabase). This injects `POSTGRES_URL`.
2. Run `supabase/migrations/20260926000000_teamcontext.sql` in the Supabase SQL editor.
3. Set the env vars `TEAM_TOKEN`, `SUPABASE_CA_CERT` and `LOCK_TTL_MINUTES`, then run `vercel --prod`.
4. Check that `curl https://<project>.vercel.app/health` returns `{"ok":true}`.

### 2. Local MCP server (each developer)
The MCP server is published on npm as [`teamcontext-mcp`](https://www.npmjs.com/package/teamcontext-mcp), so there is nothing to clone or install: your MCP client runs it with `npx -y teamcontext-mcp`.

Copy `bob/mcp.example.json` into your project's `.bob/mcp.json` (gitignored) and fill in `CENTRAL_SERVER_URL`, `TEAM_TOKEN`, a unique `DEVELOPER_ID` and `REPO_ROOT`. See [mcp-server/README.md](mcp-server/README.md) for details.

### 3. Bob custom mode
Install `bob/custom_modes.yaml` and `bob/rules-teamcontext/` in your project's `.bob/` folder, then select the **🚦 TeamContext** mode in Bob.

## Development

```bash
npm test          # runs server + mcp-server test suites (node:test, PGlite for Postgres)
```

The MCP server works with any MCP-compatible client, but Bob is the first-class agent.

## License

MIT, see [LICENSE](LICENSE).
