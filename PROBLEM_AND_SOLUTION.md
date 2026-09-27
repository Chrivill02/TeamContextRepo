# Problem & Solution

## The problem

Every developer on a team now codes with their own AI agent, and those agents are blind to each other. Two agents edit the same file at the same time, and the team only finds out at merge time: merge conflicts, silent API changes, and time lost rebuilding context about what a teammate's agent already did. The faster agents write code, the more often this happens, and the more expensive each collision becomes, because nobody wrote the conflicting code by hand and nobody remembers why it changed.

Today teams coordinate this manually, by asking in chat who is touching which file, or they don't coordinate at all and pay for it in rework.

**Who it is for:** software teams of two or more developers working in the same repository, where each developer codes with their own AI agent. It matters most in small, fast-moving teams (startups, agencies, hackathon teams) where people touch the same files every day and there is no time for manual coordination.

## The solution

**TeamContext is a traffic light for AI coding agents.**

Before IBM Bob edits a file, it claims a lock through the TeamContext MCP server. If a teammate's agent already holds that file, Bob stops, tells the developer who has it and since when, and proposes alternatives (work on other files first, wait and retry, or coordinate with the teammate) instead of creating a conflict. When Bob finishes, it releases the file with a one-line handoff summary, so the next developer knows exactly what changed.

The developer does not have to remember any of this: a Bob custom mode makes Bob do it on its own, before and after every edit.

## How it works

1. **Bob custom mode + rules** (`bob/`): the 🚦 TeamContext mode tells Bob to call `team_status` at the start of a task, `file_lock` before every edit, `file_unlock` with a summary after each file, and `release_all` with a handoff note before its final answer.
2. **Local MCP server** (`mcp-server/`, published on npm as [`teamcontext-mcp`](https://www.npmjs.com/package/teamcontext-mcp)): exposes those four tools, detects the repository from git and normalizes paths so every teammate talks about the same file. If the central server is unreachable, it reports it instead of crashing.
3. **Central server** (`server/`): an Express API on Vercel with data in Supabase Postgres. Lock acquisition is a single atomic Postgres function, and locks expire after a TTL so a crashed session never blocks the team.
4. **Live dashboard** (`server/public/`): who is editing what, conflicts avoided, and the activity feed of handoff notes.

## Impact

- **Conflicts are prevented before they are written**, not resolved after they happen. Each blocked attempt is counted on the dashboard as a conflict avoided.
- **Less manual coordination**: nobody has to ask "are you touching this file?" in chat; the answer is on the dashboard and Bob checks it automatically.
- **Faster handoffs**: every released file carries a summary of what changed, so a teammate picks up the work without reading the whole diff.
