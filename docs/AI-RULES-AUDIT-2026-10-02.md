# Проверка личных правил — 02.10.2026

Источник CL4R1T4S просмотрен как внешний материал, README и структура проверены. Выбраны три файла OPENAI/GOOGLE; ссылки, commit SHA и исключения находятся в mentor `references/cl4r1t4s.md`. Подлинность заявленных system prompts не подтверждена. Исходные промты/схемы tools в пакет не скопированы, MCP для текстов не создан.

## Применено

- Codex CLI 0.159.2: сохранён существующий глобальный `~/.codex/AGENTS.md`, добавлен только управляемый блок; активного AGENTS.override.md не было. Доступ к canonical mentor через `~/.agents/skills/mansur-frontend-mentor`.
- Antigravity IDE 1.107.0, core commit `ecfbad74d93962fc8ca485d93ab9b4f3d4cb6cf8`: добавлен глобальный `~/.gemini/config/rules/mansur-agent-work.md`, trigger always_on; mentor/reference обновлены в `~/.gemini/config/skills`. Других global AGENTS.md/config GEMINI.md при проверке не было.
- В source setup добавлены installer/CLI ai-rules, документация и ChatGPT-текст. Правило и reference включаются обычной установкой Antigravity через существующее обнаружение файлов; ai-rules отдельно включает Codex без смены модели/account/settings/extensions.
- JSX + MUI остаётся default последнего AGENTS.md. Явный TS-запрос и существующий TS проект используют .tsx/.ts; исторические defaults не инициируют миграцию.

Новые глобальные backup в `~/.gemini/backups/agent-work-*`, конкретный путь сообщает installer. Перед изменением source сохранена отдельная копия `~/.gemini/backups/agent-rules-2026-10-02-*`. Backup не включён в репозиторий.

## Подготовлено, не применено

ChatGPT Custom Instructions: `config/ai/chatgpt-custom-instructions.txt`, 1268 символов. В доступном браузере https://chatgpt.com/ показал «Войти», доступ к персонализации авторизованного пользователя отсутствовал. Пользователь сохраняет текст через Settings → Personalization. Изменение локального Codex AGENTS.md не меняет ChatGPT.

## Реальная проверка

- 13 npm tests прошли: прежние 10 + 3 новых. Проверены preview без записи, сохранение чужих инструкций, repeat без изменений, backup/restore, active override и broken markers → отказ до записи. Большой существующий AGENTS.md превышал стандартный лимит 32 KiB: компактный управляемый блок перенесён в начало, его окончание и ссылка на mentor входят в первые 32 KiB; прежний текст сохраняется. Проверен сценарий большого файла. Это не гарантирует загрузку всего старого хвоста: полный личный договор доступен в mentor reference.
- Doctor: 52 passed, 0 warnings, 0 failures. Это диагностика файлов/CLI, не доказательство нового ответа Gemini.
- Повтор реальной команды ai-rules вернул changed: [] и backup: null.
- Оба действующих MCP config сохранили SHA-256. Secret-аудит проверяет реальные значения из локального MCP без вывода самих секретов; в source совпадений не найдено.
- npm pack включает config/ai, rule, installer, mentor/reference и docs. Исходная коллекция, credentials и backup не включены.
- Новый read-only Codex exec, обычный вопрос про useState + TSX без /skill и без упоминания mentor: агент самостоятельно прочитал canonical SKILL.md и references, ответил «Мансур», простым таджикским, с именованной function/handler, MUI Button и TSX. Файлы проекта не менял. Это проверка CLI ответа, не каждой модели/каждого проекта.
- В первом дополнительном тесте запрет команд не дал агенту прочитать локальный skill; он честно это сообщил. Не считать этот тест доказательством skill consumption. Во втором чтение наблюдалось. PowerShell вывел часть кириллицы с неверной кодировкой; сами UTF-8 файлы корректны. Добавлена рекомендация явного UTF-8 чтения; отдельный ответ после этой рекомендации не запускался.
- Обновлённый глобальный AGENTS.md также автоматически появился в контексте текущего Codex чата.

## Не удалось проверить

Новый ответ Gemini в Antigravity и персонализированный ответ ChatGPT: native UI не доступен в подключённом управлении, ChatGPT браузер не авторизован. Нового Gemini-чата/reload не выполнялось, активная работа не прерывалась. Не заявляется 100% использования всех skills или отсутствие любых будущих ошибок.

Независимый untracked `tests/test-agent-browser-smoke.mjs`, появившийся от параллельной работы в workspace, сохранён на диске и не включён в commits этой настройки. Его тест не входит в заявленные 13 passed.

## Git

Подтверждённый remote: https://github.com/safarovmurod/mansur-setup.git, ветка `mancho-setting-antigraviti`. Предыдущий разрешённый audit отдельно сохранён commit `62967de881457a6875c84036c740b89f7f282e92` с названием `Mancho Setting Antigraviti`. Текущие AI-rules подготовлены отдельным минимальным commit; фактический SHA push указывается в итоговом ответе после проверки remote. Main не переключался и не перезаписывался.
