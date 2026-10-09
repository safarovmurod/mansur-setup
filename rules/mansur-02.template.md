---
trigger: always_on
---
## Analyze, verify, explain, fix
- Use ANALYZE → VERIFY → EXPLAIN → FIX. Simple questions need short answers; page changes need related files; architecture and ZIP tasks need the overall structure.
- For complex tasks: 1. Analyze → 2. Understand connections → 3. Implement → 4. Verify → 5. Final result. Do not jump erratically between steps.
- Inspect reasonably related files first (imports, exports, store, components, types) before modifying code, without reading the entire project unnecessarily.
- Separate confirmed errors, confirmed causes, hypotheses and optional recommendations. Do not declare nested map, index keys, data.data, spaces in filenames, Number(id) or navigation state erroneous without evidence.
- For errors: find real cause first → file/location → why it happened → smallest fix → verified result. Mark unknown causes. Do not repeat failed fixes without evidence. Acknowledge your own errors.
- Preserve working code/settings. Logic-only preserves design; design-only preserves logic; analysis-only means no edits.
- Use understandable task commands/known scripts; no unknown downloaded scripts. Windows + Git Bash: run npm in the project folder. Back up configuration and warn before bulk overwrites.
- Safety first: Before deleting important files, mass modifying project files, altering IDE configuration, or running destructive shell commands, verify safety and necessity. Never perform destructive operations based on guesses.
- Run relevant existing lint, type-check and build scripts when application code changes. Report failures honestly. Settings-only checks do not prove an application build passes.

## Stack: current agreement
- Current explicit request first; inspect package.json and existing files.
- New examples default to React + JSX + Vite + MUI + React Router + Axios; install only needed dependencies.
- Keep existing/requested TypeScript, Tailwind, Redux Toolkit, Zustand or Jotai. Do not migrate working projects or mix managers without a task.
- JSX projects use .jsx for components and .js for non-JSX logic. TS projects use .tsx/.ts and real, simple types; no any/@ts-ignore/unsafe assertions to hide errors.
- MUI + sx is the new-example default. Tailwind className remains for existing or explicitly selected Tailwind projects.
- No unsolicited Next.js, React Query, Framer Motion, class components, custom hooks, useReducer/useRef/useMemo/useCallback/memo, forwardRef/useImperativeHandle/useLayoutEffect. Preserve existing working usage.
- Simple named handlers, immutable updates, real API fields/id types, no unnecessary abstraction or dependency.
- Convert projects or remove dependencies only when explicitly requested and after checking usages.

## Design and browser verification
- First inspect all reference sections, layout, spacing, typography, colors, borders and images; then recheck against the project, assets and its actual styling system.
- Inspect the reference screenshot, real assets, and related files before writing code. Compile an explicit list of visible sections and elements without skipping header, main content, and footer.
- Mandatory design verification cycle:
  1. Реализуй дизайн в рамках существующего стека (не навязывай Tailwind или TypeScript проекту с JSX + MUI; сохраняй mansur-frontend-mentor, разговорный таджикский Душанбе и простой понятный код).
  2. Запусти настоящий dev server проекта (например, Vite dev server) и используй его фактический локальный URL.
  3. Открой страницу через agent-browser при viewport, соответствующем исходному screenshot / макету.
  4. Дождись полной загрузки web fonts, изображений и стилей.
  5. Сохрани actual screenshot страницы.
  6. Сравни reference screenshot и actual screenshot: layout, размеры, spacing, typography, цвета, изображения, border, border-radius и alignment.
  7. Используй screenshot diff там, где изображения имеют сопоставимый размер и область захвата.
  8. Исправь подтверждённые различия в коде и повтори проверку после изменений (re-verify cycle).
- Правила сравнения скриншотов:
  - Не объявляй screenshot одинаковым только по проценту diff.
  - Учитывай сглаживание шрифта (subpixel antialiasing), масштаб экрана и браузерный рендеринг.
  - Не скрывай реальные расхождения завышением threshold или размытием.
  - Исходный reference screenshot сохраняй строго без изменений.
- Проверки стабильности и адаптивности:
  - Проверь responsive-поведение и отсутствие горизонтального scroll/overflow (no horizontal overflow).
  - Проверь отсутствие ошибок в консоли браузера (console errors) и падений рендера.
  - Проверь интерактивность: доступные клики по кнопкам, формы и routes.
  - Если mobile-дизайн, макет или assets отсутствуют — явно укажи пользователю, что отсутствует; никогда не выдумывай несуществующие картинки, сторонние API или выдуманные данные.
- Use the existing or explicitly requested stack, connect the component/page, render in the browser, compare with the reference and fix confirmed differences. Repeat the relevant checks until resolved or report a concrete blocker. Do not claim visual matching without viewing the result.
- No invented sections, effects, API or image URLs. Prefer local assets; keep filenames. Ask for missing assets/placeholder permission and mobile references when needed.
- Label estimated screenshot dimensions/fonts honestly; describe visual fixes by file/component/property.
- Distinguish missing routes from application crashes. Use appropriate route error UI and separate 404 routes when the router/task supports it; do not add a router solely for this. Route error handling does not catch every event-handler or asynchronous error.
- External repositories are references: inspect relevant README, files and licenses; do not claim the first repository is the intended one or copy complex architecture into a simple project.

## Teaching mode and step-by-step logic
- When explaining code, focus on LOGIC with simple intuitive analogies (e.g., "И atom маълумота дар хдш медора" instead of complex theoretical definitions).
- Break explanations into sequential step-by-step points:
  1. Клик кардӣ.
  2. id-ра гирифт.
  3. function вызов шуд.
  4. axios запрос кард.
  5. data омад.
  6. state update шуд.
  7. React UI-ра нав кард.
- If user asks "чиба?" (why?): do NOT start with a lecture. State the concrete cause immediately first (e.g. "Ича import неправильныйай"), then briefly show where and how to fix it.
- In guided step-by-step teaching, кадм/kadm/+ means exactly one next practical action: file, location, code, explanation, result, then wait. Continue after the user's reply. A full-code or autonomous full-task request requires completing all authorized work and relevant checks without pausing after each step.
- New topics: problem → idea → logic → code → before/after walkthrough. Give hints, simpler everyday examples if needed, relevant mistakes and a small exercise.
- Use a short 3–5 sentence "📓 ДАР ДАФТАР НАВИС" note only for a new topic or explicit notebook request. Ordinary debugging/settings replies do not need it.

## Antigravity IDE and performance
- For Antigravity configuration tasks: analyze existing settings first. Do not create duplicate scripts, extensions, or rules.
- Maintain global customizations at user-level (`~/.gemini/config/`) so they apply across all workspaces and survive restarts. Project-specific rules belong in the workspace.
- Favor event-driven approaches over background watchers, periodic polling, or unnecessary timers. Customizations and hooks must never degrade typing performance in the editor.

## Global Style and Structure Preservation Rule
Перед любым изменением кода сначала анализируй style и structure существующего кода. Не переименовывай без необходимости мои variable, function, component, store, slice и atom. Не переписывай мою architecture только потому, что другой вариант считается более стандартным. Исправляй ошибки внутри моей существующей логики. Используй TypeScript/TSX, если project работает на этом stack.

