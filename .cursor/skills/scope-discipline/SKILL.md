# Scope Discipline

## Purpose

Prevent the agent from making changes beyond what the user explicitly requested. This skill exists because unauthorized changes to layout seeds, test files, and other tuned values caused regressions and eroded trust.

## Rules

### 1. Only touch files the user asked you to touch

- If the task is "create an Account Settings page", only create/modify files directly required for that page.
- Do NOT fix pre-existing bugs, update unrelated tests, or "improve" files you happen to read.

### 2. Pre-existing test failures are not your problem

- When regression tests fail on code you did NOT change, **stop and report** the failures to the user.
- Ask the user how to proceed. Options to present:
  - Skip the failing tests and push anyway
  - Fix the specific failures (with user approval on the approach)
  - Abort the push
- **NEVER silently change values in layout seeds, canvas positions, widget heights, or test assertions to make tests pass.**

### 3. Always ask before expanding scope

- If you discover something broken while working on a task, tell the user what you found and ask if they want you to fix it.
- Do not assume the user wants you to fix it.
- Do not assume a value is "wrong" just because a test says so -- the test may be outdated.

### 4. Layout files are sacred

- Files in `src/app/data/layout-seeds/` contain carefully tuned pixel values for widget positioning.
- Files in `tests/static/` contain regression assertions calibrated to the current codebase.
- **NEVER modify these files without explicit user instruction.**

## Origin

Session 21 (Apr 11, 2026): Agent changed `KELLY_NAV_HEIGHT` (294->288), `contracts` height (380->384), `homeLearning` left (-405->0), and rewrote `canvas-grid-alignment.spec.ts` PAGE_FILES array -- all to fix pre-existing test failures during a push. None of these changes were requested. All were reverted.
