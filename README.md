# mansur-setup

> Готовая, переносимая и автоматизированная среда разработки для **Antigravity IDE** на Windows: нативный плавный курсор, Prettier, Tailwind CSS, Material Icons, панель GitHub Explorer, движок практики React/TypeScript, MCP-серверы и персональные правила AI-ассистента.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform: Windows](https://img.shields.io/badge/Platform-Windows-0078D6.svg)]()
[![Node: >=18](https://img.shields.io/badge/Node-%3E%3D18-339933.svg)]()

---

## Что входит в этот Setup

1. **Идеальная типографика и нативный курсор:**
   - Плавная аппаратная каретка (`cursorSmoothCaretAnimation: on`).
   - Отключены отвлекающие эффекты водной ряби (Jelly ripple) и спарка.
   - Оптимальный межстрочный интервал (25px) и отступы под шрифт **JetBrains Mono**.
   - Мягкая цветовая палитра без раздражающих рамок текущей строки.
2. **Форматирование и статический анализ:**
   - Prettier по умолчанию для всех языков (`.ts`, `.tsx`, `.js`, `.jsx`, `.html`, `.css`, `.json`, `.md`).
   - Форматирование при сохранении (`formatOnSave: true`).
   - Настроенный **Tailwind CSS IntelliSense** с автодополнением в `className`.
   - **ErrorLens** с задержкой 2 сек и фильтрацией шумных предупреждений.
3. **Кастомная панель GitHub Explorer (`mansur-github-panel` v1.2.0):**
   - Удобная боковая вкладка в проводнике с 4 раскрывающимися блоками:
     - **CURRENT:** текущая ветка, статус синхронизации с origin, поле ввода commit message, кнопка Git Push (защита базовой ветки `main/master`, проверка секретов перед staging).
     - **NEW BRANCH:** создание новой ветки строго из базового шаблона (`origin/main`), переключение и немедленный push с установкой tracking.
     - **MY BRANCH:** выпадающий список существующих веток (`local`, `origin`, `local + origin`) для безопасного переключения без дубликатов.
     - **DELETE BRANCH:** компактный список с чекбоксами для безопасного удаления одной или нескольких веток с защитой текущей/базовой веток и предупреждением об уникальных коммитах.
   - Встроенная защита от случайной отправки секретов (`.env`, `.pem`, `.key`, `credentials.json`) и блокировка операций при наличии несохранённого кода.
4. **Обучающий движок и правила AI (Practice System):**
   - Глобальный скрипт `practice-engine.mjs` (`practice:new`, `practice:save`, `practice:open`).
   - Автоматическая активация режима практики для веток `day1`, `redux-practice`, `learn-hooks` и др.
   - Терпеливый пошаговый стиль объяснения (1 шаг за 1 сообщение), разговорная речь Душанбе и обновлённый `mansur-frontend-mentor`.
   - Новый пример по умолчанию JSX + MUI; существующий или явно выбранный TypeScript/Tailwind сохраняется. Zustand, Redux Toolkit и Jotai изучаются отдельно, локально и с API.
5. **Model Context Protocol (MCP):**
   - Готовые безопасные шаблоны подключения **GitHub MCP Server** (через Docker), **GSD** и **Sequential Thinking**.

---

## 3 простых шага для установки на любом Windows ПК

### Шаг 1. Предварительные требования (Prerequisites)
Убедитесь, что на компьютере установлены:
1. **Windows 10 или 11**
2. **Node.js >= 18** (проверка в терминале: `node -v`)
3. **Git for Windows** (проверка: `git --version`)
4. **Antigravity IDE**

> [!TIP]
> Рекомендуемый шрифт: **JetBrains Mono**. Установить в одну команду: `winget install JetBrains.JetBrainsMono`.

---

### Шаг 2. Автоматическая установка

Откройте терминал (PowerShell или CMD) и выполните **одну проверенную команду**:

```bash
npx --yes github:safarovmurod/mansur-setup install
```

Либо укажите своё имя для персонального обращения AI:
```bash
npx --yes github:safarovmurod/mansur-setup install --name "Мансур"
```

#### Альтернатива (через локальное клонирование):
```bash
git clone https://github.com/safarovmurod/mansur-setup.git
cd mansur-setup
npm run install-setup
```

Инсталлятор автоматически:
- Создаст резервную копию существующих настроек в `~/.gemini/backups/`.
- Корректно объединит `settings.json`, `keybindings.json` и `argv.json` без стирания ваших сторонних настроек.
- Установит глобальные правила AI и скиллы (`mansur-frontend-mentor`, `mansur-practice`, `vercel-react-best-practices`).
- Установит кастомную панель `mansur-github-panel` и зарегистрирует 22 расширения.

---

### Шаг 3. Персональное подключение и перезагрузка

1. **Перезагрузите окно Antigravity IDE:**
   - Нажмите `Ctrl + Shift + P`
   - Введите `Developer: Reload Window` и нажмите `Enter`.
2. **Подключение GitHub MCP (если требуется интеграция с репозиториями):**
   - Запустите Docker Desktop.
   - Откройте файл `%USERPROFILE%\.gemini\config\mcp_config.json`.
   - Вставьте ваш GitHub Personal Access Token вместо `YOUR_GITHUB_PERSONAL_ACCESS_TOKEN_HERE`.
   - Подробнее в руководстве [docs/MCP_SETUP.md](docs/MCP_SETUP.md).

---

## Проверка состояния системы (Doctor)

Чтобы убедиться, что все пути, настройки, расширения и правила работают корректно, запустите:

```bash
npx --yes github:safarovmurod/mansur-setup doctor
```

или локально:
```bash
npm run doctor
```

---

## Резервное копирование и откат (Backup & Restore)

Инсталлятор гарантирует безопасность ваших существующих файлов. Перед каждым обновлением создаётся timestamped-бэкап.

- **Создать бэкап вручную:**
  ```bash
  npx --yes github:safarovmurod/mansur-setup backup
  ```
- **Восстановить последнее состояние:**
  ```bash
  npx --yes github:safarovmurod/mansur-setup restore
  ```

---

## Дополнительные флаги инсталлятора

| Флаг | Назначение |
|---|---|
| `--name <name>` | Установить отображаемое имя пользователя для AI (по умолчанию: `Мансур`) |
| `--dry-run` | Предпросмотр всех планируемых изменений без записи файлов на диск |
| `--skip-extensions` | Применить настройки редактора, правила и скрипты, не устанавливая расширения |
| `doctor` | Диагностика компонентов и путей Antigravity |
| `backup` | Создать ручной бэкап текущего профиля |
| `restore` | Откатить настройки из резервной копии |

---

## Подробная документация

- [Инвентарь всех настроек (Inventory Report)](docs/INVENTORY.md)
- [Справочник и список 22 расширений](docs/EXTENSIONS.md)
- [Настройка Docker и GitHub MCP Server](docs/MCP_SETUP.md)
- [Руководство по учебному движку практики](docs/PRACTICE_WORKFLOW.md)
- [Настройки курсора, стили и патч Jelly](docs/JELLY_CURSOR_AND_STYLING.md)
- [Решение проблем (Troubleshooting)](docs/TROUBLESHOOTING.md)

---

## Лицензия

MIT License (c) 2026 Mansur.


## Обновлённый frontend mentor

Речь, beginner-код, Zustand/Redux/Jotai local/global и честная проверка: [инструкция и границы обновления](docs/MANSUR-MENTOR-UPDATE.md). Для точечного обновления без общего IDE installer: `node scripts/install-mentor-skill.cjs --dry-run`, затем `node scripts/install-mentor-skill.cjs`.

Обновить только mentor глобально из GitHub, без повторной установки тем/расширений/MCP:

```bash
npx --yes github:safarovmurod/mansur-setup mentor --dry-run
npx --yes github:safarovmurod/mansur-setup mentor
```

В уже клонированной папке сначала `git pull --ff-only`, затем `node scripts/install-mentor-skill.cjs`.
`changed: []` означает, что текущие исходники уже установлены; новые правила попадут глобально после обновления копии репозитория.
Автоматический фоновый watcher/commit/push не включается. Для переноса новых предпочтений сначала обновляются `skills/mansur-frontend-mentor` и связанные templates, затем install/проверка и выбранный Git commit/push.

Полный IDE setup рассчитан на Windows. Mentor использует домашнюю папку пользователя; профиль Antigravity должен читать `~/.gemini/config/skills`. Наличие файлов не подтверждает работу чата: после установки Reload Window и read-only smoke prompt из инструкции.
