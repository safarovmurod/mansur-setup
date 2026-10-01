# Mansur frontend mentor — переносимое обновление

Это skill и небольшой installer правил, а не VSIX расширение и не полный installer всех extensions/MCP/theme. Здесь обновлены речь, обучение, код и логика по доступной истории. API keys, auth state и личные сообщения сюда не входят.

## Antigravity: 3 шага

Для скачивания непосредственно из актуального GitHub репозитория:

```bash
npx --yes github:safarovmurod/mansur-setup mentor --dry-run
npx --yes github:safarovmurod/mansur-setup mentor
```

Это точечное обновление mentor. Для полного IDE setup на Windows используется команда `install` из README. После изменения source skill в репозитории повторить установку: само редактирование/пуш ещё не обновляет профили остальных пользователей.

1. Распакуй ZIP и открой эту папку в Antigravity. В терминале этой папки проверь Node: `node --version`. Если команды нет, установи Node с https://nodejs.org/en/download и заново открой терминал. Никакой npm registry package публиковать для этого не нужно.
2. Выполни preview, затем install:

```bash
node scripts/install-mentor-skill.cjs --dry-run
node scripts/install-mentor-skill.cjs
```

Для дополнительной копии, доступной инструментам, читающим ~/.agents/skills, можно выбрать `node scripts/install-mentor-skill.cjs --shared`. Antigravity копия ставится в `~/.gemini/config/skills/mansur-frontend-mentor`; существующие известные mansur правила согласуются с текущим договором, другие настройки сохраняются. Неизвестный layout останавливает installer до записи. Backup создаётся в ~/.gemini/backups. Не запускай общий installer setup репозитория ради этого небольшого обновления.

3. Reload Window и открой новый AI чат. Напиши:

> Прочитай ~/.gemini/config/skills/mansur-frontend-mentor/SKILL.md и нужные references. Обращайся ко мне только «Мансур». Без изменения файлов объясни коротко на разговорном таджикском Душанбе: чем отличаются локальный массив в global Zustand store и API data; покажи простой filter Delete для id 2 из [1,2,3]. Назови прочитанный skill и reference. Не запускай Git и не делай запросы к внешним API.

Правильный smoke результат: имя Мансур; простая речь; global не равен API/persistence; результат [1,3]. Этот запрос проверяет ограниченный сценарий, не все уроки. Если skill не найден — проверить реальный профиль/skill path, не утверждать auto-loading по одному файлу. Первый explicit запрос не доказывает ambient auto-discovery: вторым новым чатом без указания path отдельно проверить automatic consumption по доступным loader logs.

## Восстановление

Installer печатает путь backup. Вставь его целиком в кавычках:

```bash
node scripts/install-mentor-skill.cjs --restore "ПОЛНЫЙ_ПУТЬ_BACKUP"
```

Restore проверяет что файлы не редактировали после install. При конфликте остановится и не затрёт новые изменения; ничего не force-удаляет.

## Структура

- skills/mansur-frontend-mentor/SKILL.md — основной договор и маршруты к reference.
- references/current-agreement.md — последняя инструкция Мансур дословно.
- communication.md — речь, короткий ответ, интервью, voice.
- state-and-logic.md — local/global, Zustand/Redux/Jotai, CRUD и UI flow.
- api-forms-and-routing.md — запрос, response, forms/F5/auth/effect.
- design-and-code.md — MUI/sx и className по выбранному stack.
- history-and-verification.md — ошибки AI, evidence, setup/Git границы.
- learning-map.md — темы и честное отличие «проходили» от «освоил».
- [отчёт](MANSUR-MENTOR-REPORT.md) / [история](mansur-mentor-history-coverage.json) — источники, изменения и границы проверки.
- install-skill.cjs / test-install.cjs — installer и изолированные проверки.

Копию skills/mansur-frontend-mentor можно импортировать как обычный Agent Skill в другой инструмент, который поддерживает SKILL.md. Точный UI loader/включение в каждом инструменте проверяется отдельно. Plugin cache исходного anthropic-skills не редактируется: обновлённая копия принадлежит пользователю и переживает обновление плагина.

