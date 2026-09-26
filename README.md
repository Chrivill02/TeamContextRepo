# TeamContext

**TeamContext** is a semaphore-based Model Context Protocol (MCP) system designed to prevent code collisions when multiple developers use AI agents (like Bob) on the same repository. It acts as a lightweight traffic controller, alerting developers and their AI agents if someone else is already editing a specific file.

Built for the **IBM BOB 2.0 Hackathon**.

## Overview

When a team of developers works on the same codebase using AI assistants, two agents might try to modify the same file simultaneously, leading to merge conflicts or lost work. TeamContext solves this by introducing an explicit lock/unlock mechanism.

### Key Components

1. **Central Server (`/server`)**: A Node.js + Express + SQLite backend that tracks active file locks across the team.
2. **Local MCP Server (`/mcp-server`)**: Runs locally on each developer's machine. Exposes `file_lock` and `file_unlock` tools to the AI assistant, allowing it to claim files before modifying them.
3. **Web Dashboard (`/dashboard`)**: A real-time static dashboard to visualize currently locked files and who is working on them.

## Folder Structure

```text
teamcontext/
├── server/                    # Central Server (deployed to Render/Railway/etc)
├── mcp-server/                # Local MCP Server (runs on each developer's machine)
├── dashboard/                 # Static Web Dashboard (served from Central Server)
└── README.md
```

## How It Works

1. The AI assistant decides to edit `src/components/Header.tsx`.
2. Before making changes, it calls the `file_lock` MCP tool.
3. The Local MCP Server forwards this request to the Central Server.
4. **If the file is free:** The lock is granted, and the AI proceeds with its edits.
5. **If the file is locked:** The AI receives a conflict warning indicating which developer currently holds the lock, prompting it to wait or notify the user.
6. Once the edit is complete, the AI calls the `file_unlock` tool, freeing the file for others.

## Setup & Deployment

*Refer to the [Execution Plan](./teamcontext-mvp-plan.md) for detailed implementation and deployment steps.*

### 1. Central Server
- Deploy the `server/` directory to a Node.js hosting provider (e.g., Render, Railway).
- Set the `TEAM_TOKEN` environment variable.

### 2. Local MCP Server
- Each developer runs the `mcp-server` locally.
- Configure `.bob/mcp.json` with the `CENTRAL_SERVER_URL`, `TEAM_TOKEN`, and a unique `DEVELOPER_ID`.

### 3. Dashboard
- Accessible via the Central Server's public URL (served statically). Polls the server to show real-time lock statuses.

## License

MIT License
