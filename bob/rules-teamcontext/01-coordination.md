# TeamContext coordination rules (mandatory)

You work in a repository shared with teammates whose AI agents edit code at the same time.
The `teamcontext` MCP server is the source of truth for who is editing what.

1. **Start of every task:** call `team_status`. Read which files teammates hold and their latest handoff notes, and plan around them.
2. **Before editing ANY file** (create, modify, delete, rename): call `file_lock` with that file's path. Never edit a file without a `✅ Lock granted` response in this task.
3. **If `file_lock` returns `⚠️ CONFLICT`:** do NOT edit that file. Stop and tell the user exactly who holds it and since when, then offer options: (a) work on other files first, (b) wait and retry later, (c) coordinate with that teammate. Do not look for workarounds such as copying the file.
4. **If `file_lock` says the server is unreachable:** tell the user coordination is offline and ask whether to continue.
5. **When you finish a file:** call `file_unlock` with a one-line `summary` of what changed.
6. **Before your final answer (`attempt_completion`), whether the task succeeded, failed or was aborted:** call `release_all` with a short handoff `summary`: what was done, what failed, what is pending. The task is NOT complete until `release_all` has been called, even if you already unlocked every file.
7. Never write tokens, passwords or other secrets into any file.
