# teamcontext-mcp

A traffic light for AI coding agents. This MCP server makes your agent **lock a file before editing it**, so two teammates' agents never edit the same file at the same time and you avoid merge conflicts before they happen.

It talks to a [TeamContext central server](https://github.com/Chrivill02/TeamContextRepo), which stores the locks and shows them on a live dashboard.

## Tools

| Tool | What it does |
|---|---|
| `team_status` | Shows which files teammates are editing and their latest handoff notes |
| `file_lock(file_path)` | Claims a file before editing it. Returns `⚠️ CONFLICT` if a teammate holds it |
| `file_unlock(file_path, summary?)` | Releases a file with a one-line summary of what changed |
| `release_all(summary?)` | Releases every lock you hold, with a handoff note |

If the central server is unreachable, the tools report it instead of crashing.

## Setup

Requires Node.js 20 or newer. Add this to your MCP client's config (for IBM Bob: `.bob/mcp.json` in your project):

```json
{
  "mcpServers": {
    "teamcontext": {
      "command": "npx",
      "args": ["-y", "teamcontext-mcp"],
      "env": {
        "CENTRAL_SERVER_URL": "https://<your-project>.vercel.app",
        "TEAM_TOKEN": "<shared team token>",
        "DEVELOPER_ID": "<your-unique-name>",
        "REPO_ROOT": "/absolute/path/to/your/repo"
      }
    }
  }
}
```

| Variable | Required | Description |
|---|---|---|
| `CENTRAL_SERVER_URL` | yes | URL of your team's TeamContext server |
| `TEAM_TOKEN` | yes | Shared secret for your team. Never commit it |
| `DEVELOPER_ID` | yes | Unique name shown to teammates, e.g. `eswin` |
| `REPO_ROOT` | no | Repository root. Defaults to the working directory |

Every teammate must point at the same repository (same `origin` remote), so file paths match.

Works with any MCP client. For automatic locking in IBM Bob, use the TeamContext custom mode from the [main repo](https://github.com/Chrivill02/TeamContextRepo/tree/main/bob).

## License

MIT
