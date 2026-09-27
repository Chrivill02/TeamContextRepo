# How we used IBM Bob

Bob is both the builder of TeamContext and the core of the product. Session summaries for every Bob task are in [`bob_sessions/`](bob_sessions/).

## Bob as the product's agent

TeamContext ships a custom Bob mode, **🚦 TeamContext** ([`bob/custom_modes.yaml`](bob/custom_modes.yaml)), plus coordination rules ([`bob/rules-teamcontext/`](bob/rules-teamcontext/)). With the mode selected, Bob coordinates on its own, without the developer prompting it:

1. calls `team_status` at the start of the task;
2. calls `file_lock` before editing any file, and never edits without a granted lock;
3. on a conflict, does not touch the file: it reports who holds it and since when, and offers alternatives;
4. calls `file_unlock` with a one-line summary after finishing each file;
5. calls `release_all` with a handoff note before its final answer.

In our demo repository, Bob in TeamContext mode received a task, checked the team status, locked both files it needed, made the change, and left handoff notes that appeared on the live dashboard (`teamcontext_on_bob.png`, `teamcontext_final_test_dashboard.png`).

## Bob as the builder

We wrote an implementation plan ([`docs/superpowers/plans/2026-09-26-teamcontext-mvp.md`](docs/superpowers/plans/2026-09-26-teamcontext-mvp.md)) split into numbered tasks, and gave Bob one task at a time in **Agent mode**. Bob read the plan, built its own todo list, and worked through it step by step with test-driven development: write the failing test, run it, implement, run the suite again.

| Task | What Bob built | Evidence |
|---|---|---|
| 0 + 1 | Server configuration, Postgres pool and lock store | `teamcontext_task0_1_serverconfig.png` |
| Fixes | A race between acquire and release (retry loop in the SQL function, with a test that reproduces it) and a missing `pool.on('error')` handler that crashed the Vercel instance | `teamcontext_fix_task1.png` |
| 2 | HTTP API: auth, routes, Express app and Vercel entrypoint | `teamcontext_task2_API.png` |
| 6 | Live dashboard | `teamcontext_task06_dashboard.png` |
| 10 | Standup endpoint (tests 27 → 29 passing) | `teamcontext_task10_standup.png` |
| 20 | MCP server libraries: paths, repo detection, HTTP client, messages | `teamcontext_task20_mcp_libs_bob.png`, `teamcontext_task20_mcp_libs_tests.png` |
| 21 | MCP server entrypoint | `teamcontext_task21_mcp_entrypoint.png` |

Project rules in `.bob/` (`rules-agent`, `rules-ask`, `rules-plan`) and `AGENTS.md` kept Bob on our architecture and conventions across tasks: ESM only, factory functions, real Postgres (PGlite) in tests instead of mocks, and no secrets in the repository.

## Bob with the product

Testing the TeamContext mode with Bob changed the product. In a live run, Bob locked and unlocked files by itself but skipped the final `release_all`, so the handoff note never reached the dashboard. We tightened the rule so `release_all` must run before Bob's final answer, even when every file is already unlocked, and verified the full lock → conflict → unlock → handoff flow end to end.
