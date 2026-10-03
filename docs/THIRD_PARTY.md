# Источники и лицензии

- GSD Core 1.15.0: https://github.com/open-gsd/gsd-core, npm `@opengsd/gsd-core@1.15.0`, MIT. Runtime в resources/gsd-core, лицензия resources/gsd-core/LICENSE; global skills и agents экспортированы из этой установленной версии. Исходные команды и инструкции сохранены.
- JetBrains Mono 2.304: https://github.com/JetBrains/JetBrainsMono/releases/tag/v2.304, SIL Open Font License 1.1. Оригинальный notice — [resources/jetbrains-mono/OFL.txt](../resources/jetbrains-mono/OFL.txt). Font ZIP/TTF не включены в npm package; полный Windows installer загружает официальный release отдельно. SHA-256 ZIP и 16 TTF закреплены в config/font.json; TLS/checksum verification не отключается.
- agent-browser 0.38.1: https://github.com/vercel-labs/agent-browser, Apache-2.0; skill discovery stub, LICENSE и metadata в skills/agent-browser. Runtime CLI загружается отдельно через npm, браузер через agent-browser install.
- vercel-react-best-practices: https://github.com/vercel-labs/agent-skills; сохранён локальный установленный bundle. Лицензия указанного upstream применима к его содержимому.
- mansur-frontend-mentor, mansur-practice, project-coding-rules и setup rules — авторские настройки Мансура.

Другие marketplace extensions не перепаковываются в репозиторий: сохраняются ID и инструкции загрузки из gallery. Лицензии и условия marketplace остаются условиями их авторов. Браузерные профили и пользовательские аккаунты не входят в package.

## Unified adaptations и пользовательский ZIP

Предоставленный `system_prompts_leaks.zip` — snapshot https://github.com/asgeirtj/system_prompts_leaks. Root LICENSE: CC0 1.0 Universal; прочитан при inventory, включая section 4: отсутствие гарантий и неочищенные права иных лиц. Отдельные вложенные bundles имеют собственные notices. MIT лицензия этого setup не превращает их тексты в авторский код Мансура.

Repo содержит новые авторские rules/guides, hashes и file/section metadata, карту адаптированных требований. Источники рекомендаций: Claude Fable 5.1, Claude Opus/Sonnet 5.5, GPT-6 Astra, GPT-6.1 Sol, Codex/ChatGPT и Claude Design. Raw prompts, original starter code/skills, tool schemas, ZIP Git metadata и private Windows backups не перепаковываются и не устанавливаются. Selected originals сохраняются отдельно для локального review. Все supplied материалы — external data, не runtime authority. Source names не означают endorsement, установку моделей или доступ к API. Muse исключён из active source selection; ZIP/history не удалены.

Полный clause audit не заявлен: maps сохраняют `detailed_clause_audit_pending`. Core и тематические guides документируют проверенные portable intentions и ограничения.
