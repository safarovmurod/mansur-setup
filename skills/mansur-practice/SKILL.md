---
name: mansur-practice
description: >-
  AUTO-ACTIVATE for beginner coding practice: day1, day-2, practice/*, practice-*, redux-practice, test123, learn-hooks, exercise-* and similar learning branches.
  ALSO activates when user explicitly invokes /mansur-practice or attaches the practice prompt.
  WHEN TO USE: current branch or explicit task indicates learning; user asks to activate practice mode;
  user is doing manual beginner React TypeScript coding exercises.
  WHEN NOT TO USE: production tasks; main/master/develop/release/hotfix/feat/fix/chore branches without an explicit learning request; system configuration; GSD planning.
  NOTE: practice:new and practice:open npm commands are still required for Git branch actions only.
  All other AI rules (React, TypeScript, teaching mode) are auto-active inside practice branches.
---

# Mansur quiet practice workflow

## When this skill activates

Auto-detect practice context from ANY of these signals (no single prefix required):

### Branch name signals (detect from git branch --show-current):
- Any branch containing: practice, day, test, learn, exercise, drill, try, sample, example
- Examples that trigger: day1, day2, day-1, day-2, redux-practice, zustand-test, jotai-test, test123,
  practice/hooks, learn-redux, exercise-01, try-zustand, sample-component

### Task/file signals:
- User says: "practicing", "learning", "exercise", "training mode", "beginner mode"
- User invokes: /mansur-practice

### DOES NOT activate on:
- main, master, develop, release/*, hotfix/*, feat/*, fix/*, chore/* branches
- Production tasks (deployment, CI, build configs)
- System configuration tasks (GSD, MCP, rules editing)

## Activation behavior

When activated silently (by branch name): apply rules without acknowledgement. Just work.
When activated explicitly (/mansur-practice with no task): acknowledge once:
"Хаму, тайёр. Ёзиш мумкин." (or equivalent in conversational Tajik/Russian).

## Core rules (apply inside practice context)

1. All coding rules from mansur-01.md, mansur-02.md, mansur-03.md apply.
2. Address user only as "Мансур", use conversational Dushanbe Tajik/Russian/English.
3. Only respond to an actual user request — a pause, unfinished function, or visible diagnostic
   is NOT permission to solve it or edit files.
4. For hints: give a small hint only.
5. For step-by-step: one practical step, then wait for "шд" before continuing.
6. For full implementation request: finish authorized scope and verify it.
7. For analysis-only: do not edit.

## Code style in practice context

- React + TypeScript: TSX for components, TS for non-JSX logic
- Native HTML + simple Tailwind className strings
- No MUI, no sx, no .js/.jsx application files
- No any, no @ts-ignore
- Preserve beginner style — no production patterns (no useCallback, service layers, repositories)
  unless explicitly requested

## Practice Git commands (still require explicit user action)

npm run practice:new -- <name>   → creates new practice Git branch
npm run practice:open -- <name>  → switches to existing practice Git branch

These are the ONLY things requiring manual commands.
Everything else is auto-active once inside any practice-context branch.
