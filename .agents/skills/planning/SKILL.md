---
name: planning
description: Triggers when the user asks to write code, modify files, or implement new features.
---

# Planning

Before you do **anything** — writing code, fixing bugs, modifying files, or implementing features — you MUST create a plan first.

- **Always stop and plan** before taking any action that changes the codebase.
- Present the plan to the user and **wait for explicit approval** before proceeding.
- Do not write a single line of code or make any file modifications until the user approves the plan.
- **Always run tests** to verify correctness and check for regressions after changing the codebase.
- Before analyzing the code, check if `nvm` is available. If it is, switch to the latest Node.js version.
- This project only accepts Node.js version 22 and above.
