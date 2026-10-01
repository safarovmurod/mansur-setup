# mansur-antigravity-setup

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
   - Терпеливый пошаговый стиль объяснения (1 шаг за 1 сообщение) и строгий TypeScript-стек.
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
npx github:safarovmurod/mansur-antigravity-setup install
```

Либо укажите своё имя для персонального обращения AI:
```bash
npx github:safarovmurod/mansur-antigravity-setup install --name "Мансур"
```

#### Альтернатива (через локальное клонирование):
```bash
git clone https://github.com/safarovmurod/mansur-antigravity-setup.git
cd mansur-antigravity-setup
npm run install-setup
```

Инсталлятор автоматически:
- Создаст резервную копию существующих настроек в `~/.gemini/backups/`.
- Корректно объединит `settings.json`, `keybindings.json` и `argv.json` без стирания ваших сторонних настроек.
- Установит глобальные правила AI и скиллы (`mansur-practice`, `vercel-react-best-practices`).
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
npx github:safarovmurod/mansur-antigravity-setup doctor
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
  npx github:safarovmurod/mansur-antigravity-setup backup
  ```
- **Восстановить последнее состояние:**
  ```bash
  npx github:safarovmurod/mansur-antigravity-setup restore
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
