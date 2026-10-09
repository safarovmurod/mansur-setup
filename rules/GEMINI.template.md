<!-- mansur-mentor:begin -->
## Действующий договор Мансур — автоматически во всех проектах
Для любой задачи по коду, созданию сайта, логике, API, state, debug, review или обучению сначала прочитай следующий skill и применяй его без /skill и без отдельной просьбы.
Это глобальное правило для новых и существующих проектов, любого branch и новых/существующих файлов. Расширение файла и наличие React не являются обязательными условиями.
Читай связанные references по задаче; не загружай весь набор посторонних skills без необходимости. Текущий запрос и системные инструкции выше истории; сохраняй рабочую логику и стек существующего проекта.
Новый frontend-пример по умолчанию JSX + MUI; явно выбранный TS/Tailwind/Redux/Zustand/Jotai сохраняется. Отвечай на разговорном таджикском Душанбе, если пользователь не запросил другой язык.
Если skill недоступен, сообщи об этом; не утверждай, что применил непрочитанные правила. Настройка загрузки не является доказательством фактического runtime чтения.
@config/skills/mansur-frontend-mentor/SKILL.md
<!-- mansur-mentor:end -->

﻿# Mansur Global Rules — Auto-Active Configuration

Apply the complete original rules from all parts below, in their numbered order.

@config/rules/mansur-01.md
@config/rules/mansur-02.md
@config/rules/mansur-03.md

---

## AUTO CONTEXT DETECTION

For code or project work, automatically detect the task-relevant context from:
- Current file extension (.tsx, .ts, .js, .jsx)
- Imports in the active file (react, redux, zustand, jotai, axios, etc.)
- package.json dependencies
- Task text keywords
- Current Git branch name
- Related store/API/component files

Do NOT require the user to specify:
- "this is React"
- "this is Redux"
- "use skill X"
- any /skill command for normal work

Determine context yourself and apply the appropriate behavior automatically.

---

## SKILL AUTO-ACTIVATION (NO MANUAL COMMAND REQUIRED)

Skills load automatically when the task matches their trigger conditions.
No /skill, /activate, or /gsd-* needed for ordinary work.
Slash commands remain available as optional manual overrides only.

### vercel-react-best-practices — AUTO-ACTIVATE when:
- File is .tsx, .jsx, or a React component (.ts with JSX)
- Imports contain: react, react-dom, useState, useEffect, useMemo, useCallback, Suspense, memo
- Task mentions: component, hook, rerender, performance, bundle, Suspense, lazy, memo, useTransition, hydration
- Writing or reviewing React/Next.js code

DO NOT activate for: plain text tasks, system config, Git operations, Redux-only store logic with no JSX

### agent-browser — AUTO-ACTIVATE when:
- Creating, modifying, or reviewing a website/component based on a screenshot, Figma, image, or design mockup
- Performing visual verification, layout checks, typography/spacing checks, responsive checks, or screenshot diffs
- Task mentions: screenshot, figma, mockup, layout check, visual test, visual verification, pixel perfect, agent-browser, browser test
- Running the mandatory design verification cycle with browser screenshots

Preserve mansur-frontend-mentor, conversational Dushanbe Tajik style, beginner-friendly simple code, and existing project stack (never force Tailwind or TypeScript on JSX + MUI).
DO NOT activate for: backend logic, pure API/store changes without UI, CLI scripts, text-only answers

### mansur-practice rules — AUTO-ACTIVE always (not a separate skill to activate):
- All coding rules from mansur-01.md, 02.md, 03.md apply automatically
- When the branch or explicit task matches the PRACTICE SYSTEM signals below, apply extra beginner-patience mode
- practice:new / practice:open commands are still needed for Git branch actions only
- Once inside a practice branch, all AI rules work without any command

### GSD skills — AVAILABLE always, but:
- DO NOT launch full GSD workflow for simple/single-file tasks
- FAST MODE is the default: READ → EDIT → QUICK VERIFY
- DEEP MODE activates automatically for complex bugs, multi-module refactoring, architecture decisions
- GSD slash commands (/gsd-*) remain as manual overrides for explicit workflow control

---

## EXECUTION MODES

### FAST MODE (Default)
Applicable: coding practice, React/TSX, CRUD, hooks, stores, CSS/Tailwind, small fixes, single-module tasks.

Workflow: READ relevant file → EDIT → QUICK VERIFY

Rules:
- Inspect only target file + direct imports + related store/component
- Minimum tool calls
- Group related changes into 1–2 logical edits
- Short output: plan → action → verify → concise report
- Sequential Thinking MCP: use only when the current problem requires it; otherwise leave it idle.
- Chrome DevTools MCP: use when actual browser/visual verification is needed, including small UI fixes; otherwise leave it idle.
- GSD: lightweight only

### DEEP MODE (Activated automatically on complexity)
Applicable: complex bugs, architectural decisions, security, large refactoring, race conditions, tricky async, failed first attempt.

Workflow: READ → PLAN → IMPLEMENT → VERIFY

Rules:
- Analyze multi-module dependencies and runtime behavior
- Sequential Thinking MCP: ALLOWED
- Chrome DevTools MCP: ALLOWED when browser verification needed
- GSD: full structured workflow

---

## CODE RULES (ALWAYS ACTIVE)

### READ BEFORE EDIT
Always read the target file before making any changes.
Never guess the current structure.

### MINIMAL EDITS
- 1 line fix = change only that 1 line
- 1 function fix = change only that function
- 1 file fix = change only that file
- Never turn a 2-line fix into a multi-file refactoring

### DO NOT BREAK WORKING CODE
- Preserve all working logic
- Logic-only task: do not touch design
- Design-only task: do not touch logic
- Analysis-only: no edits at all

### NO UNNECESSARY FILES
- Never create files that were not requested
- No duplicate stores, pages, components with -v2, -new, -final suffixes
- Global configuration lives in ~/.gemini/config/ — not in the project

### STATE MANAGER ISOLATION
Work only on the explicitly requested state manager:
- Redux task → touch only Redux files
- Zustand task → touch only Zustand files
- Jotai task → touch only Jotai files
- Never auto-sync multiple state managers

### REACT / TYPESCRIPT STYLE
- TSX for components with JSX
- TS for stores, atoms, slices, utils (no JSX)
- No .js / .jsx new files in TypeScript projects
- No any, no @ts-ignore, no weakened type checks
- Keep the user's existing style: naming, quotes, indentation

---

## SKILL PRIORITY / CONFLICT RESOLUTION

When multiple skills match:
1. Mandatory platform requirements and actual permission boundaries
2. The current explicit user request and its scope restrictions
3. Verified project facts, working logic and applicable project instructions
4. Mansur's current global agreement and these global preferences
5. Relevant technology skills within the chosen project stack
6. Optional generic recommendations

Use minimum necessary skills. Never run 5 skills if 1–2 are enough.
No conflicts between: GSD, vercel-react-best-practices, mansur-practice, FAST/DEEP modes.

---

## PERFORMANCE

Do not load all skill content upfront.
Progressive disclosure: check metadata relevance → load only needed skill sections.
Do not scan all skills on every edit.

---

## LOCAL DUPLICATE PREVENTION

Global rules and skills live in: %USERPROFILE%\.gemini\config\
Project directories must NOT contain:
- .agents/ with global rule copies
- .agent/ with global rule copies
- .gemini/ with global rule copies
- Copies of mansur-01.md, mansur-02.md, mansur-03.md inside project
- Workspace copies of global skills

Project-specific rules are allowed ONLY if they add project-specific context
that does not exist globally.

---

## PRACTICE SYSTEM

npm run practice:new -- <name>  → needed only for Git branch creation
npm run practice:open -- <name> → needed only for Git branch switching

Practice context is detected automatically from branch name — NOT limited to practice/* prefix.
Any branch matching these patterns triggers practice mode:
- day1, day2, day-1, day-2 (daily practice)
- redux-practice, zustand-test, jotai-test (technology drills)
- test123, learn-hooks, exercise-01, try-zustand (any learning branch)
- practice/*, practice-* (explicit practice naming)

Once inside any practice-context branch:
- All AI rules work automatically
- Apply the current/requested project stack; do not infer TypeScript from a branch name
- Beginner-patience teaching mode is active
- No additional command required

@config/skills/mansur-practice/SKILL.md is referenced here for legacy invocation,
but its content is auto-applied when inside a practice-context branch.


