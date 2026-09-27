# TeamContext — lablab.ai submission

> Fields of the lablab.ai form, in order. Replace every `[TODO: ...]` before submitting.

## Project Title

TeamContext — a traffic light for AI coding agents

## Short Description

Every developer now codes with their own AI agent, and those agents can't see each other. TeamContext makes IBM Bob lock a file before editing it, so two teammates' agents never edit the same file at once: conflicts are avoided before they happen, not fixed after.

## Technology & Category Tags

IBM Bob 2.0, MCP (Model Context Protocol), Node.js, Express, Vercel, Supabase Postgres, Developer Tools, AI Agents, Collaboration

## Long Description — Problem & Solution Statement

**The problem.** Teams no longer write code alone: each developer drives their own AI agent. The agents are fast, but blind to each other. Ask your agent to add a search box to the header while a teammate's agent adds a dark-mode toggle to the same header, and neither agent knows. Both edit `src/header.js`, both push, and the team finds out at merge time: a conflict, rework, and a conversation to reconstruct what the other agent changed. The faster the agents get, the more often this happens.

**The solution.** TeamContext is a coordination layer — a traffic light — for AI-assisted teams. Before an agent edits a file, it asks for a lock. If a teammate's agent already holds it, the agent stops and tells its developer who is working on the file and since when, instead of creating a conflict.

It has four parts:

1. **A custom IBM Bob mode, "🚦 TeamContext".** Its rules make Bob call the coordination tools on its own: check team status at the start of a task, lock each file before editing it, unlock it with a one-line summary of what changed, and leave a handoff note when the task ends. The developer just asks for the feature; they never mention locks.
2. **An MCP server, published on npm as `teamcontext-mcp`.** It exposes four tools (`team_status`, `file_lock`, `file_unlock`, `release_all`), detects the repository from git and normalizes paths so every teammate refers to the same file. It never crashes the agent: if the server is unreachable, it says so.
3. **A central server** on Vercel with Supabase Postgres. Lock acquisition is a single atomic Postgres function, so two requests can never be granted the same file. Locks expire automatically after a TTL, so a crashed session never blocks the team.
4. **A live dashboard** showing who is editing which file, conflicts avoided, and a feed of handoff notes written by the agents.

**Target users.** Small and medium teams where several developers use AI coding agents on the same repository — especially during fast iterations such as hackathons, feature sprints and pair work across time zones.

**How they use it.** One `npx` line in Bob's MCP configuration and the custom mode in the project's `.bob/` folder. From then on, developers work exactly as before; Bob coordinates for them.

**Impact.** In our before/after demo, the same two tasks on the same file produced a merge conflict that took [TODO: X] minutes to resolve without TeamContext. With TeamContext, the second agent stopped at the lock, retried after the first finished, and edited the updated file: zero merge conflicts, and the handoff note told the second developer exactly what changed.

**Why it is new.** Existing tools resolve conflicts after they happen (merge tools) or rely on humans announcing what they are working on (chat, tickets). TeamContext moves coordination to the moment of editing and gives it to the agents themselves, so it scales with how fast AI agents now write code.

## IBM Bob Usage Statement

IBM Bob is both the product's core and the tool we built it with.

**Bob is the core of the product.** TeamContext only works because Bob follows project-level instructions reliably:

- **Custom mode.** We created the "🚦 TeamContext" mode (`.bob/custom_modes.yaml`) with its own role definition, tool groups (read, edit, execute, mcp) and instructions.
- **Mode-specific rules.** `.bob/rules-teamcontext/01-coordination.md` defines the coordination protocol: call `team_status` at the start, `file_lock` before editing any file, stop on a conflict and offer alternatives, `file_unlock` with a summary, and `release_all` with a handoff note before the final answer.
- **MCP integration.** Bob connects to our `teamcontext` MCP server through the workspace `.bob/mcp.json`. With the mode active, Bob calls the tools without being asked: in our test, the prompt "Add the current year to the footer" made Bob lock `src/footer.js`, edit it and release it with a summary, all recorded on the dashboard.
- **Conflict handling.** When a file is held by a teammate, Bob does not work around it; it explains who holds the file and since when and proposes options: work on other files, wait and retry, or coordinate with the teammate.

While testing, we saw Bob unlock files but skip the final handoff. We fixed it by tying the rule to a concrete moment (before `attempt_completion`), an example of iterating on Bob's behavior through rules rather than code.

**Bob built the product.** We split the work into scoped tasks from a written implementation plan and ran them in Bob:

- The MCP server libraries (path normalization, repository detection, a resilient HTTP client and tool messages) and their tests (task 20).
- The MCP server entrypoint that registers the four tools over stdio (task 21).
- The live dashboard (task 06) and other server tasks run by my teammate.
- `AGENTS.md` gives Bob persistent project context across sessions: architecture, commands, testing rules and conventions. [TODO: confirm whether it was generated with `/init`.]

Screenshots of every Bob task session summary are in `bob_sessions/`, from both team members.

The MCP server works with any MCP client, but Bob is the primary agent: the custom mode, the rules and the demo all run on Bob.

## Links

- **Public code repository:** [TODO: https://github.com/Chrivill02/TeamContextRepo once it is public]
- **Demo application (dashboard):** https://team-context-omega.vercel.app
- **MCP server on npm:** https://www.npmjs.com/package/teamcontext-mcp
- **Demo repository:** https://github.com/Chrivill02/teamcontext-demo
- **Demo Application Platform:** Web (Vercel) + IBM Bob IDE
