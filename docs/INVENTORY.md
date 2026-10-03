# Полный инвентарь настроек Antigravity IDE (Inventory Report)

Unified additions этой версии, их пути/активация и текущие проверки: [UNIFIED-RULES.md](UNIFIED-RULES.md), [UNIFIED-VALIDATION.md](UNIFIED-VALIDATION.md). Следующие исторические сведения не являются тестом нового договора или всех нынешних/будущих моделей.

Исторический inventory первоначального export. Актуальный audit: [AUDIT-2026-10-02.md](AUDIT-2026-10-02.md), все 77 bundles: [SKILLS.md](SKILLS.md), MCP варианты: [MCP_SETUP.md](MCP_SETUP.md). Старые заявления UI/автоодобрения ниже не заменяют новую runtime проверку и правила авторизации текущего агента.

В данном документе зафиксированы все фактические настройки, правила, расширения и утилиты, обнаруженные в среде Antigravity IDE пользователя **Мансур**, с указанием источника, статуса, способа переноса и верификации.

---

## 1. Сводная таблица инвентаря

| № | Компонент / Настройка | Источник в системе | Чем подтверждена активность | Поддерживающие файлы | Как переносится | Как проверяется | Требует ручного шага |
|---|---|---|---|---|---|---|---|
| 1 | **Settings JSON / User Profile** | `%APPDATA%\Antigravity IDE\User\settings.json` | Чтение активного профиля IDE | `config/settings.json` | Автоматически через `lib/installer.js` (deep merge) | `node bin/mansur-setup.js doctor` | Нет |
| 2 | **Тема оформления и иконки** | `Dark+`, `material-icon-theme` в `settings.json` | Экранный вид и настройки `workbench.*` | `pkief.material-icon-theme` | Включается в `settings.json` + автоустановка расширения | Проверка в UI и CLI | Нет |
| 3 | **Шрифт и типографика** | JetBrains Mono, Cascadia Code (15px, ligatures, line-height 25) | `settings.json` | Системный шрифт | Настройки применяются автоматически, ссылка на шрифт в документации | Визуально в редакторе | Ручная установка шрифта (или через winget) |
| 4 | **Native Smooth Cursor & Caret** | `editor.cursorBlinking: smooth`, `cursorSmoothCaretAnimation: on` | `settings.json` | Встроенный движок редактора | Автоматически через `settings.json` | Плавное движение курсора при наборе | Нет |
| 5 | **Отключение Jelly Ripple** | `jellyCursor.rippleEnabled: false`, `animationMode: off` | `settings.json` и `checkAndRepairJellyCursor.js` | `config/jelly-cursor/*` | Автоматически через `settings.json` и состояние | Отсутствие ряби от кликов мыши | Нет |
| 6 | **Jelly Cursor Patch & Recovery** | `%USERPROFILE%\.antigravity\jelly-cursor` | Наличие скриптов и маркера в `workbench.html` | `checkAndRepairJellyCursor.js`, `jelly-cursor.template.js` | Переносится в `%USERPROFILE%\.antigravity\jelly-cursor` | Вызов `repair-ripple.cmd` | Нет |
| 7 | **Prettier & Format on Save** | `editor.defaultFormatter: esbenp.prettier-vscode`, `formatOnSave: true` | `settings.json` | `esbenp.prettier-vscode` | Автоматически через `settings.json` и установку расширения | Форматирование при сохранении `.tsx/.ts/.json` | Нет |
| 8 | **IntelliSense & Tailwind** | `tailwindCSS.*`, `npm-intellisense`, `path-intellisense` | `settings.json` | Расширения Tailwind, Path/Npm intellisense | Автоматически через `settings.json` + расширения | Автокомплит классов Tailwind в `className` | Нет |
| 9 | **Клавиатурные комбинации** | `%APPDATA%\Antigravity IDE\User\keybindings.json` | Фактический файл keybindings | `config/keybindings.json` | Автоматически объединяются без дублирования | Нажатие `Ctrl+Alt+F` (Format), `Ctrl+Space` (Suggest) | Нет |
| 10 | **Терминал и Git Bash профиль** | `terminal.integrated.defaultProfile.windows: "Git Bash"` | `settings.json` | `C:\Program Files\Git\bin\bash.exe` | Автоматически в `settings.json` | Открытие терминала (Ctrl+\`) | Нужен Git for Windows |
| 11 | **Все 22 установленных расширения** | `antigravity-ide --list-extensions --show-versions` | CLI вывод и `extensions.json` | `config/extensions.json` | Автоматически через CLI инсталлятора | `antigravity-ide --list-extensions` | Нет |
| 12 | **Mansur GitHub Panel (Кастомная панель)** | `%USERPROFILE%\.antigravity-tools\github-panel` | Зарегистрировано `mansur.mansur-github-panel@1.1.1` | `extensions/mansur-github-panel/*` | Автоматически собирается VSIX и устанавливается через CLI | Появление вкладки GitHub в левой панели Explorer | Нет |
| 13 | **Global Practice Engine** | `%USERPROFILE%\.gemini\scripts\practice-engine.mjs` | Наличие файла и запуск `practice-engine.mjs` | `scripts/practice-engine.mjs` | Автоматически копируется в `~/.gemini/scripts` | Тесты Git-гардов (`practice:new`, `open`, `save`) | Нет |
| 14 | **GEMINI.md и активные правила** | `%USERPROFILE%\.gemini\GEMINI.md`, `rules/mansur-*.md` | `<user_rules>` в конфигурации сессии | `rules/*.template.md` | Копируется в `~/.gemini/` с подстановкой `displayName` | Запуск сессии AI с правильным обращением | Нет |
| 15 | **Стиль общения и преподавания** | `mansur-01.md`, `mansur-02.md`, `mansur-03.md` | Действующие правила агента | `rules/mansur-*.template.md` | Автоматически устанавливается в `~/.gemini/config/rules/` | Общение на таджикском/русском, TS-only, без лишних файлов | Персональное имя вводится при инсталляции |
| 16 | **Skills (mansur-practice, Vercel)** | `%USERPROFILE%\.gemini\config\skills` | Каталог скиллов IDE | `skills/mansur-practice`, `skills/vercel-react-best-practices` | Автоматически копируются в `~/.gemini/config/skills` | Автоактивация при работе с React/TSX и ветками практики | Нет |
| 17 | **MCP Config (GitHub, GSD, Sequential)** | `%USERPROFILE%\.gemini\config\mcp_config.json`, `~/.gemini/antigravity/` | Список активных MCP серверов в IDE | `config/mcp/*.template.json` | Создаются безопасные шаблоны с плейсхолдерами | Запуск Docker контейнера ghcr.io/github/github-mcp-server | Ввод личного GitHub Token |
| 18 | **Локализация IDE (Русский язык)** | `%USERPROFILE%\.antigravity-ide\argv.json` | `"locale": "ru"` в `argv.json` | `config/argv.json`, `ms-ceintl.vscode-language-pack-ru` | Автоматически объединяется в `argv.json` | Интерфейс на русском языке | Перезапуск IDE |
| 19 | **Авто-одобрение команд терминала** | `chat.tools.terminal.autoApprove` в `settings.json` | `settings.json` | Встроенный чат Antigravity | Автоматически в `settings.json` | Команды `npm run dev/build/lint`, `git status/add/commit` не требуют подтверждения | Нет |
| 20 | **Сторонние / устаревшие утилиты** | `.antigravity-ide\extensions\.obsolete` | `runtime-monitor`, `ai-structure-reviewer`, `mansur-inline-autocomplete` | — | **Исключены** (были помечены obsolete, не используются) | Проверено отсутствие в активных расширениях | — |
| 21 | **Пакет antigravity-manager** | `%USERPROFILE%\AppData\Roaming\npm\antigravity` (остаточные файлы) | Ошибка `npm install -g antigravity-manager` в терминале | — | **Исключен** (сторонний прокси-сервер для ротации токенов, не относящийся к настройке IDE) | См. анализ ошибки в TROUBLESHOOTING.md | — |

---

## 2. Безопасность и исключение личных данных

Перед экспортом проведена фильтрация:
- Никакие токены, ключи API (Gemini, Anthropic, GitHub) не включены в репозиторий.
- Использованы шаблоны с плейсхолдерами: `YOUR_GITHUB_PERSONAL_ACCESS_TOKEN_HERE`.
- Все пути формируются динамически через переменные окружения (`%USERPROFILE%`, `%APPDATA%`, `%LOCALAPPDATA%`).
- Никакие файлы рабочих проектов или история чатов не попали в репозиторий.
