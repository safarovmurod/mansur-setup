# 🚀 Автоматизация установки и её проверки

## Один понятный маршрут

[README → Установка](../README.md#quick-start) содержит два альтернативных входа: готовые Node/Git → `npx install --skip-permissions`; отсутствующие prerequisites → Windows bootstrap, который сам вызывает install. Повторять оба маршрута не требуется. Для уже настроенной IDE отдельный `--rules-only` добавляет 4 unified rules и 3 guides, сохраняя остальной профиль.

Все пользовательские пути выбираются автоматически. `unified-restore` без аргумента выбирает последний завершённый unified backup, сообщает `sourceBackup`, проверяет integrity и последующие edits, затем делает собственный recovery backup. Pending операции пропускаются; повреждение завершённого backup не приводит к молчаливому выбору другого. Старые backups без completion metadata остаются доступными при полной проверке records/hashes. Повтор restore отменяет предыдущий restore.

## Что теперь автоматизировано

| Этап | Поведение |
|---|---|
| Bootstrap | Проверяет Windows, Node >=24, npm >=10 и Git; при необходимости использует winget `OpenJS.NodeJS.LTS` / `Git.Git`, обновляет PATH дочернего процесса, проверяет результат и запускает полный setup/Doctor. `-DryRun` ничего не устанавливает. |
| Шрифт | Полный Windows install проверяет/загружает официальный JetBrains Mono 2.304, проверяет ZIP SHA-256 и 16 TTF hashes, устанавливает недостающие файлы в `%LOCALAPPDATA%\Microsoft\Windows\Fonts`, регистрирует в HKCU, проверяет readback и загрузку GDI, посылает `WM_FONTCHANGE`. |
| Выбор оформления | Settings выбирают JetBrains Mono для editor/terminal, Dark+ и Material Icon Theme; font step идёт перед записью этих settings. Если font step не прошёл, итог сообщает неполную установку, а не успешный download. |
| Прогресс | 10 этапов full install; `Skill [n/77]` с именем и процентом после копирования каждого bundle; отдельные имена extensions; живой npm/IDE/browser output; реальные bytes/% font-download. Rules-only выводит прогресс в stderr, JSON результата остаётся в stdout. |
| Permissions | `--skip-permissions` сохраняет approvals и подходит для терминала открытого IDE. Изменение `mcp(*)` остаётся отдельным optional действием с закрытым IDE и version guard. |
| Preview/restore | Rules-only, unified removal/restore и широкий setup restore поддерживают `--dry-run` без записи. Отсутствующий или конфликтующий backup сообщает ошибку до изменений. |

Font ZIP: `https://github.com/JetBrains/JetBrainsMono/releases/download/v2.304/JetBrainsMono-2.304.zip`.

SHA-256: `6f6376c6ed2960ea8a963cd7387ec9d76e3f629125bc33d1fdcd7eb7012f7bbf`. Все per-file hashes — [config/font.json](../config/font.json); лицензия — [OFL.txt](../resources/jetbrains-mono/OFL.txt).

Если 16 пользовательских font-файлов уже имеют эти bytes, ZIP повторно не скачивается. Личные файлы с отличающимися bytes или регистрации с другим путём не перезаписываются. Fonts/prerequisites/npm/marketplace packages не удаляются обычным файловым restore; это восстановление профиля, а не rollback всей Windows. `--skip-font` отключает font step, сохраняя существующую системную установку.

## Что действительно проверено в cloud

Linux, Node 24.19.0, npm 11.9.0. Тестовые профили изолированы; настройки/аккаунты реального пользователя не менялись.

| Проверка | Результат и граница |
|---|---|
| `npm test` | **33 passed, 0 failed, 0 skipped**. Включает прежние 25 и 8 новых behavioral tests. |
| Restore без пути | CLI preview без записи; выбор newest completed, recovery/undo restore, pending operation exclusion, corrupt newest stop, no-backup/edited-target errors. |
| Широкий restore preview | Не меняет bytes/mtime и не удаляет unified additions. |
| Font orchestration | Проверены dry-run/no-launch, unsupported platform, manifest rejection, live-output subprocess contract, nonzero/launch failure handling. Windows subprocess смоделирован; реальная регистрация этим тестом не доказана. |
| Installer/progress | Реальный isolated full install скопировал 77 skills, показал names и `[77/77] 100%`, выбрал обе font settings; `--skip-permissions` сохранил bytes synthetic preferences DB. |
| Extensions | Тестовый executable CLI подтверждает: success message без регистрации не считается успехом; зарегистрированный ID проходит. Это не live Windows gallery test. |
| Официальные font assets | ZIP реально скачан по HTTPS; ZIP hash и каждый из 16 TTF проверены. Extraction проверена также через PowerShell/.NET ZIP APIs, используемые installer. |
| PowerShell | Оба скрипта разобраны официальным parser PowerShell 7.4.6; native C# declaration скомпилирована. PowerShell runtime получен по HTTPS и проверен по официальному release checksum. Это syntax/asset check в Linux, не запуск Windows 5.1/winget/GDI. |
| Browser smoke | **1 passed, 0 failed, 0 skipped**: actual screenshot, identical-image diff, changed background и button click. |
| Package | Упакованный CLI прошёл scoped preview/install/repeat/automatic restore/uninstall/undo и широкий backup/restore preview/restore; обязательные assets присутствуют, ZIP/TTF/private backups отсутствуют. |

## Что требует настоящего Windows/аккаунта

Здесь нет Windows Antigravity: bootstrap/winget, Windows PowerShell 5.1, user font registry/GDI/rendering, live IDE extension install и reload **не запускались**. Нет новой runtime проверки AI-чатов, переключения моделей и подключения личных MCP credentials. Будущие модели не объявляются протестированными. Исторические Windows отчёты не заменяют проверку этой версии.

Сохранение работы, reload при необходимости, начало нового чата и личный login остаются действиями пользователя. Системная политика Windows, UAC, отсутствие winget, network/marketplace доступ и чужие project overrides могут остановить автоматическую часть. Installer показывает конкретную причину; он не обходит эти ограничения и не обещает «100% на любом ПК».
