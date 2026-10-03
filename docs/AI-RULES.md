# Codex, ChatGPT и Gemini: подключение личных правил

Новый общий Antigravity договор `mansur-unified-v1` ставится через `node bin/mansur-setup.js install --rules-only`: [UNIFIED-RULES.md](UNIFIED-RULES.md). Core inline предназначен для всех поддерживаемых моделей без ручного skill. `ai-rules` ниже остаётся отдельной командой старого Codex/mentor набора и не ставит unified guides. Имя источника не означает установку продукта/модели.

В репозитории теперь компактные дополнения для агента и справка по выборочным материалам CL4R1T4S. Чужие system prompts, tools и весь репозиторий не импортируются. Их наличие не добавляет MCP или возможности модели.

## 1. Установить / обновить Codex и Antigravity

Из папки скачанного setup:

```bash
node bin/mansur-setup.js ai-rules --dry-run
node bin/mansur-setup.js ai-rules
```

Или из основной ветки main, из любого терминала:

```bash
npx --yes github:safarovmurod/mansur-setup ai-rules
```

Команда обновляет личный mentor в `~/.agents/skills` и `~/.gemini/config/skills`, добавляет управляемый блок в Codex `~/.codex/AGENTS.md` (или существующий `CODEX_HOME` внутри home) и глобальное правило Antigravity `~/.gemini/config/rules/mansur-agent-work.md`. Существующие инструкции вне своего блока сохраняются. Backup создаётся до записи в `~/.gemini/backups/agent-work-*`; повтор без новых изменений ничего не пишет. Если активен `AGENTS.override.md`, команда останавливается до записи, чтобы не выдавать изменение неактивного AGENTS.md за рабочую настройку. Файлы авторизации, модели, MCP и extensions не меняются.

Полная команда `install` автоматически включает новый Antigravity rule и reference благодаря обнаружению rules/skill-файлов. Для Codex выполните `ai-rules` отдельно: установка Antigravity сама по себе не меняет другой продукт. Новый reference сохраняется внутри существующего mentor, число skills остаётся 77.

Для безопасного восстановления только записанных файлов:

```bash
node scripts/install-mentor-skill.cjs --restore "ПУТЬ_К_BACKUP_ИЗ_ОТЧЁТА"
```

Восстановление откажется перезаписывать файл, если он изменён после установки. Копия backup содержит ваши старые пользовательские инструкции: не публикуйте её.

## 2. Применить в ChatGPT

Откройте ChatGPT → Settings → Personalization → Custom Instructions. Сначала сохраните текущий текст себе. Добавьте или согласуйте с ним текст [chatgpt-custom-instructions.txt](../config/ai/chatgpt-custom-instructions.txt), включите customization и сохраните. Текст специально короче 1500 символов. Прямой вход: https://chatgpt.com/ — меню профиля → Settings.

При наличии инструкции Project учтите её отдельно: она может задавать более конкретный стек. Для справочных материалов можно загрузить `skills/mansur-frontend-mentor/references/cl4r1t4s.md` в нужный Project, это ручное действие. ChatGPT не получает автоматический доступ к локальной папке Codex. Установщик не меняет Custom Instructions и всегда сообщает `chatgptApplied: false`.

Официальная инструкция: https://help.openai.com/en/articles/8096356-chatgpt-custom-instructions

## 3. Проверить новый ответ

Начните новый чат Codex и Antigravity, не вызывайте /skill. Спросите: «Бо мисоли кӯтоҳ фаҳмон useState баъди click чӣ мешавад». Ожидается обращение «Мансур», простой таджикский, обычные функции, понятная логика. Для явной проверки TS спросите «мисол дар TSX» — компоненты `.tsx`, код без JSX `.ts`. Существующий проект должен оставаться в своём стеке.

В Antigravity Rules проверьте `mansur-agent-work` и `mansur-mentor-auto`. Если текущий чат не перечитал rule, новый чат или Developer: Reload Window применяет новую конфигурацию; не прерывайте активную работу. Факт сохранения подтверждается файлами, факт использования — новым ответом. Глобальный default может уступить конкретным правилам проекта и прямому запросу.

## Источники и актуальность

Полная таблица выбранных файлов, commit, причин и исключений: [cl4r1t4s.md](../skills/mansur-frontend-mentor/references/cl4r1t4s.md).

Codex: https://learn.chatgpt.com/docs/agent-configuration/agents-md
Antigravity: https://www.antigravity.google/docs/rules/

Последний AGENTS.md Мансура задаёт JSX + MUI для новых примеров. Прямой запрос TypeScript и существующие TS-проекты используют `.tsx/.ts`; это не автоматическая миграция. Простота, стиль Душанбе, пошаговое обучение и source-only quiz сохранены.
