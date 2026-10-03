# Unified rules: установка, update, restore и удаление

Договор `mansur-unified-v1` добавлен к существующему setup. Это новые авторские адаптации требований и источников. Готовые четыре rule, старые guides, 103 selected originals и runtime reports с Windows компьютера отсутствуют в supplied ZIP/cloud; они не представлены как восстановленные копии.

## Файлы и активация

Пути относительно текущего home; личное имя и Windows путь не hardcoded.

| Source в repo | После установки | Механизм |
|---|---|---|
| `rules/mansur-unified-core.template.md` | `~/.gemini/config/rules/mansur-unified-core.md` + полный inline core в `~/.gemini/GEMINI.md` | `always_on`; независимая основа |
| `rules/mansur-unified-full-stack.template.md` | `~/.gemini/config/rules/mansur-unified-full-stack.md` | `model_decision`, API/backend/DB |
| `rules/mansur-unified-design.template.md` | `~/.gemini/config/rules/mansur-unified-design.md` | `model_decision`, визуальная задача |
| `rules/mansur-unified-sources.template.md` | `~/.gemini/config/rules/mansur-unified-sources.md` | `model_decision`, source audit |
| `config/mansur-unified/guides/*.md` | `~/.gemini/config/mansur-unified/guides/` | три guide по теме |
| `config/mansur-unified/source-manifest.json`, `source-coverage.csv`, `source-sections.csv`, `requirements-map.csv` | `~/.gemini/config/mansur-unified/` | provenance, maps и pending audit |
| Созданный ownership registry | `~/.gemini/config/mansur-unified/.installation.json` | hashes managed files |
| Private operation backups | `~/.gemini/backups/mansur-unified-*` | before images и hashes; вне Git |

Общая инструкция одинакова для всех поддерживаемых моделей; source names не меняют runtime selection и не дают provider tools. Core inline в существующем GEMINI.md не зависит от поддержки `@` imports или discovery helper rules конкретной версией IDE. Templates helpers имеют `model_decision`; их прямые пути также указаны в core.

Текущая версия https://antigravity.google/docs/rules не прочитана: proxy отклонил запрос (`403 CONNECT`); live Rules UI недоступен. Установочный механизм на диске проверен, реальная загрузка в новый AI chat — unrun. Нельзя делать из корректного frontmatter вывод о поведении каждого runtime.

## Проверенные CLI команды

В папке clone/распакованного setup:

```bash
node bin/mansur-setup.js install --rules-only --name "Мансур" --dry-run
node bin/mansur-setup.js install --rules-only --name "Мансур"
node bin/mansur-setup.js unified-uninstall --dry-run
node bin/mansur-setup.js unified-uninstall
node bin/mansur-setup.js unified-restore "ПУТЬ_К_BACKUP" --dry-run
node bin/mansur-setup.js unified-restore "ПУТЬ_К_BACKUP"
```

Update — тот же install из актуального source. `--home "ПАПКА_ТЕСТОВОГО_ПРОФИЛЯ"` поддерживается только для этих rules-only/unified операций; обычный запуск использует текущий home. Full Windows installer, doctor и permissions не принимают `--home`. Не указывайте home другого пользователя.

`--rules-only` не пишет settings/keybindings/argv, MCP/permissions database, accounts, extensions, Codex AGENTS.md и другие skills. Общий `install` сохраняет прежние более широкие эффекты профиля из README. Для unified auto-context они не нужны. Полный uninstall всех старых настроек не реализован.

Каждая изменяющая операция сохраняет private backup, затем пишет атомарно по файлу. Ошибка сообщает выполненный rollback или неполный rollback с backup path. Repeat без новых source/name сохраняет bytes/mtime. Unknown same-name files, local edits, broken/duplicate markers, symlinks и повреждённый registry останавливают запись. Не пытайтесь решить конфликт удалением пользовательского файла.

Uninstall сохраняет чужие файлы и текст вне своего блока. Targeted restore возвращает одну операцию, проверяет backup integrity и post-operation hashes всех targets. Если затронутый GEMINI.md или другой target позднее менялся, restore останавливается целиком; согласуйте edits вручную. Широкий старый `restore` возвращает snapshots многих настроек: для узкого rollback используйте `unified-restore`. Full backup теперь включает guides/maps/registry; его pre-install snapshot также удаляет новые managed additions.

## Проверить новый чат и модель

1. Сохраните работу; проверьте global GEMINI.md, triggers и пути guides в установленной IDE. Reload — когда удобно, затем новый чат.
2. Без `/skill`, attachment и подсказки identifier задайте маленькую задачу о форме/API или existing UI. Проверьте язык, простой стиль, текущий стек, отсутствие invented API и честные границы mock/persistence. Context/trace позволяет отдельно подтвердить чтение основы/guide.
3. Запишите IDE version, фактически доступную модель, запрос, поведение и trace. Identifier `mansur-unified-v1` проверяйте в context, не подсказывайте его в test prompt и не принимайте простое повторение названия за доказательство чтения.
4. Повторите с другой доступной моделью в новом чате, верните исходный выбор. Недоступная модель остаётся unrun. Старые Gemini 3.8 Flash High/Gemini 3.1 Pro Low результаты пользователя — история, не тест этой версии repo.
5. Для full-stack требуется настоящий или явно тестовый frontend/API/DB flow с validation/auth и повторным чтением; для дизайна — actual screenshots/interactions. Browser fixture подтверждает инструмент, не соблюдение правил AI.

## GitHub About → Description

> ⚡ Antigravity IDE setup: global AI rules, 77 skills, 35 GSD agent roles, 22 extensions, themes, MCP templates, browser testing & backup/restore. 🧠 Model-independent full-stack/design guidance adapted from Claude, Codex, ChatGPT & Claude Design.

Текст соответствует additions и не обещает установку моделей. Read-only `gh api repos/safarovmurod/mansur-setup` отклонён (`403 Forbidden`); Description нельзя назвать обновлённым до подтверждённой записи и повторного чтения. Токен не извлекался и не запрашивался. Готовый текст остаётся здесь для About → Description. [Как сохранить и что означают числа](GITHUB-ABOUT.md).
