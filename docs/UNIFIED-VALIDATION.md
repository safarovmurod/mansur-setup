# Unified validation — 2026-10-03

Этот отчёт описывает первоначальные 25 tests unified-набора. Последующее расширение до 33 tests, automatic restore, font assets и bootstrap — в [SETUP-AUTOMATION.md](SETUP-AUTOMATION.md).

## Текущий запуск

Cloud Linux, Node.js 24.19.0, npm 11.9.0, Git 2.52.0, agent-browser 0.38.1 и image-provided Chromium. Windows paths пользователя недоступны. Tests используют synthetic home с пробелами/кириллицей и temporary repositories, не реальный auth/profile пользователя.

| Проверка | Результат |
|---|---|
| `npm test` | 25 passed, 0 failed, 0 skipped: 17 existing + 8 unified |
| CLI preview/install/repeat | inline core, triggers, каждый guide/map, UTF-8 home, чужие конфиги byte-identical, repeat сохраняет mtime |
| Update + targeted restore | guide из нового source обновляется; прежняя версия восстанавливается |
| Uninstall + undo | только owned файлы/блок, чужие файлы и поздний global текст сохраняются |
| Conflict handling | local edits, unmanaged files, broken markers, symlink, invalid registry блокируют запись |
| Injected write failure | previous writes откатываются, recoverable backup сохраняется |
| Backup integrity | tampered backup и edited target блокируют restore до записи |
| Existing setup/backup integration | full installer ставит additions; snapshots включают данные; pre-install restore удаляет только новые managed additions |
| Browser smoke | `npm run test:browser`: 1 passed, 0 failed/skipped; 800×600 screenshot, identical-image diff, changed-background detection, button click |
| Clean npm package | `npm pack` + extract: обязательные assets присутствуют, raw ZIP/originals/private backups отсутствуют; CLI preview/install/repeat/restore/uninstall/undo passed в новом изолированном home |
| Fresh local Git clone | повторная проверка выбранного commit выполняется перед push; commit/SHA и результат сообщаются отдельно |
| Source/secret audit | existing secrets test сканирует repo; originals/private backups вне Git/package |

`mansur-01.template.md` действительно не имел frontmatter в inspected source. Добавлен `trigger: always_on`; это файловое исправление, не доказательство runtime исправления старого MCP Error.

## Ограничения

Установочные tests доказывают код безопасного deployment/update/restore. **Windows Antigravity, marketplace installation, новый чат, смена модели, Gemini 3.8/3.1 и модельный full-stack/design scenario — unrun.** В repo нет рабочего frontend/backend/DB продукта; guides его не устанавливают. Browser HTTP/screenshots/diff/click fixture подтверждает инструмент, не AI behavior или production persistence. Будущие модели не тестировались.

Официальная Antigravity docs проверка и GitHub API read отклонены proxy (`403`). Description подготовлен, подтверждённого metadata update нет. Git read через существующий HTTPS origin успешен; push сообщается отдельно после проверки remote SHA. Исторические Windows/модельные отчёты не выдаются за результаты этой новой установки.

## Источники и полнота

SHA-256 ZIP и counts: `config/mansur-unified/source-manifest.json`. Прочитаны bytes всех 654 внешних и 26 вложенных files (680), проверены hashes, duplicates и text/binary/archive classification. По критерию новой выборки 62 originals сохранены вне Git для локального review. Прежние 103 originals и ready Windows rules не предоставлены. Новый section index содержит 12901 Markdown headings/XML tags, не прежние 3735 sections.

**File/section maps сохраняют detailed_clause_audit_pending**: inventory/keyword match не является полной semantic проверкой. Critical requirement adaptations перечислены в requirements-map.csv, включая core workflow, API/server/data и design/context/assets/components, а также portability boundaries. Provider identity/raw schemas/internal paths/account data/Muse active source/host-specific mechanics не импортированы как authority. Полностью непрочитанные clause-level детали не объявляются проверенными.
