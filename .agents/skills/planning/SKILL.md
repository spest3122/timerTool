---
name: planning
description: Triggers when the user asks to write code, modify files, or implement new features.
---

# Planning

Before you do **anything** — writing code, fixing bugs, modifying files, or implementing features — you MUST follow these steps in order.

## Step 1: Environment Setup

1. Check if `nvm` is available:
   ```bash
   export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && nvm use
   ```
2. If the required version is not installed, run `nvm install` first.
3. Verify with `node -v` — must be v22+.
4. If `node_modules/` doesn't exist or `package-lock.json` has changed, run `npm install`.

## Step 2: Understand the Codebase

1. Read the relevant source files before proposing changes.
2. Check if similar patterns already exist in the codebase and follow them.
3. Review `DESIGN.md` if the task involves UI changes.
4. Review `LEARN_PLAN.md` if the task involves new learning features.

## Step 3: Create a Plan

- **Always stop and plan** before taking any action that changes the codebase.
- Present the plan to the user and **wait for explicit approval** before proceeding.
- Do not write a single line of code or make any file modifications until the user approves the plan.

## Step 4: Implement

- Follow the coding conventions documented in `.agents/AGENTS.md`.
- Use CSS custom properties from `src/index.css` — never hardcode design values.
- Keep components focused and under ~250 lines.
- Place data files in `src/data/`, utilities in `src/utils/`.

## Step 5: Verify

- **Always run tests** after changing the codebase:
  ```bash
  npx vitest run
  ```
- If you added new functionality, write tests for it.
- If you changed existing functionality, ensure existing tests still pass.
- For UI changes, verify the dev server runs without errors:
  ```bash
  npm run dev
  ```
