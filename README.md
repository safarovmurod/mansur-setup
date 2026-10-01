# mansur-setup

Переносимые настройки Мансура для **Antigravity IDE на Windows**: глобальные rules, 77 skills, GSD Core 1.15.0 и агенты, browser verification, 22 extension IDs, тема, иконки, shortcuts и practice engine. Настройки работают на уровне пользователя во всех workspace; AI выбирает skills по задаче без /skill. Это настройка загрузки, а не гарантия 100% соблюдения моделью.

## Установка: 3 шага

**1. Подготовь компьютер.** Установи [Antigravity](https://antigravity.google/download), [Node.js LTS](https://nodejs.org/en/download) и [Git for Windows](https://git-scm.com/downloads/win). Перезапусти терминал IDE. Проверь `node --version` и `git --version`. Используй актуальный Node LTS; полный setup требует Node >=24 и npm >=10 (runtime GSD и agent-browser). Никаких наших API keys и аккаунтов не требуется.

**2. В терминале Antigravity установи глобально**, заменив имя своим:

```bash
npx --yes github:safarovmurod/mansur-setup#mancho-setting-antigraviti install --name "Мансур"
```

Эта ветка содержит текущий проверенный audit. Она не требует публикации npm registry package. Интернет нужен для скачивания package, marketplace extensions, agent-browser и Chrome. Installer создаёт backup, сохраняет посторонние settings и существующие MCP configs, применяет values из config/settings.json, устанавливает все bundles из skills/, все template rules, runtime scripts и GSD dependencies. Ошибки extensions или browser установки дают неполный результат и ненулевой exit code.

Для preview добавь `--dry-run`: он не записывает файлы и не запускает установки. Пример:

```bash
npx --yes github:safarovmurod/mansur-setup#mancho-setting-antigraviti install --name "Мансур" --dry-run
```

**3. Reload и проверка.** Ctrl+Shift+P → Developer: Reload Window → открой новый чат. В терминале:

```bash
npx --yes github:safarovmurod/mansur-setup#mancho-setting-antigraviti doctor
```

Doctor различает отсутствующие файлы, настройку MCP и неподтверждённые live tools. Секреты не показывает. Затем попроси небольшой код или работу по screenshot. Для подтверждения чтения skill нужны фактические read/tool traces; одно название skill в ответе не доказывает чтение.

## Если ZIP или clone уже скачан

Открой распакованную/клонированную папку в Antigravity, затем:

```bash
node bin/mansur-setup.js install --name "Мансур"
node bin/mansur-setup.js doctor
```

Не запускай несуществующий install-skill.cjs в корне. `scripts/install-mentor-skill.cjs` — отдельный точечный updater mentor, а не полная установка. Простое скачивание файлов не устанавливает их глобально.

## Что внутри

| Часть | Source | Глобальная установка |
|---|---|---|
| Все skills и catalog | skills/, config/skill-inventory.json | ~/.gemini/config/skills/, skill-inventory.json |
| GSD agents / workflows / runtime | agents/, resources/gsd-core/ | ~/.gemini/config/agents/, ~/.gemini/antigravity/gsd-core/ |
| Rules и договор | rules/*.template.md | ~/.gemini/GEMINI.md, ~/.gemini/config/rules/ |
| Editor, тема Dark+, Material Icons, IntelliSense | config/settings.json | Antigravity IDE User/settings.json |
| Shortcuts / locale | config/keybindings.json, argv.json | User/keybindings.json, ~/.antigravity-ide/argv.json |
| Practice engine | scripts/practice-engine.mjs | ~/.gemini/scripts/ |
| 22 extensions | config/extensions.json, extensions/mansur-github-panel/ | Через настоящий Antigravity CLI / VSIX |
| Browser verification | skills/agent-browser/, rules/mansur-02.template.md | agent-browser CLI + Chrome for Testing |
| MCP templates | config/mcp/ | Создаются только если файл отсутствует; credentials вводятся локально |

Все имена skills: [SKILLS.md](docs/SKILLS.md). Все 22 названия, ID, назначение, terminal/UI установка и settings: [EXTENSIONS.md](docs/EXTENSIONS.md). Шрифт JetBrains Mono: [официальная загрузка](https://www.jetbrains.com/lp/mono/). Установи .ttf двойным кликом → Install, если шрифт отсутствует; fallback Cascadia Code/monospace останется до установки. Installer не пишет в vendor bundle IDE и не обещает копирование injection при смене версии IDE.

## Screenshot → сайт → проверка

Отправь screenshot и реальные assets агенту. Он сохраняет выбранный стек (новый frontend по умолчанию JSX+MUI), собирает дизайн, запускает dev server, снимает actual screenshot при сопоставимом viewport и сравнивает layout/spacing/fonts/colors/images. agent-browser предоставляет screenshots, click, errors и pixel diff. Исправления проверяются повторно. Нет mobile/assets — агент указывает, чего не хватает; API по screenshot не придумывается.

## Что каждый подключает сам

- Вход в Antigravity, GitHub или сторонний provider — личный аккаунт пользователя.
- GitHub PAT / Docker или hosted MCP; optional PAL/Clink / AI provider credentials: [MCP_SETUP.md](docs/MCP_SETUP.md). Пошаговые ссылки там. Наши токены, пароли, cookies, профили Chrome, mssql connections и auth database не входят в package.
- Ввод имени через `--name` меняет setup rules. Личные исторические references mentor остаются историей Мансура; это специально персональный профиль, а не обезличенная чужая история.

## Обновления и свои дополнения

Повтори команду install из шага 2, затем Reload. Новые bundles из skills/, *.template.md из rules/ и runtime scripts из scripts/ будут установлены автоматически. Runtime scripts — .js/.mjs/.cjs/.ps1; repo-only install-* не копируются в профиль. Внутренние dependencies нового script должны тоже быть добавлены и проверены. Правила/skills сами по себе не публикуют изменения и не запускают background watcher.

Если работаешь через clone: `git pull --ff-only`, затем локальный install. Dirty/diverged clone сначала проверь; не делай reset/stash/discard автоматически. Новые extensions добавляются в config/extensions.json с правильным ID; их настройка — в config/settings.json. Secret/auth configs никогда не копировать в source. Shared skills для других tools сохранены и перечислены отдельно в SKILLS.md.

## Диагностика и восстановление

```bash
node bin/mansur-setup.js backup
node bin/mansur-setup.js restore
npm test
```

Backup лежит в ~/.gemini/backups/, включает настройки, rules, skills, scripts, agents, GSD runtime и оба MCP configs. Restore восстанавливает сохранённые файлы; не удаляет новые неизвестные файлы и не откатывает marketplace/npm установки. Это восстановление конфигурации, не полный rollback операционной системы.

`--skip-extensions` пропускает gallery installation; custom panel проверяется отдельно. `--skip-agent-browser` пропускает browser installation. Эти flags означают частичную установку и не подтверждают готовность пропущенных компонентов. `npm warn allow-scripts` сначала проверяй через `agent-browser --version`; не разрешай все scripts вслепую.

## Проверки и ограничения

[Фактический audit report](docs/AUDIT-2026-10-02.md), [third-party sources](docs/THIRD_PARTY.md). Windows проверяется отдельно от Linux/macOS: полный installer использует Windows paths, поэтому cross-platform full setup не объявляется поддержанным. Browser CLI сам имеет Linux вариант `agent-browser install --with-deps`, но это не делает весь этот setup Linux-compatible. MCP auth, чтение skills AI, Tailwind IntelliSense и format-on-save в UI требуют отдельной runtime проверки. Нельзя подменять её unit tests или CLI exit code 0.
