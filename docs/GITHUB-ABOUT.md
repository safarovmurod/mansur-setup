# GitHub About

## Description

Готовый текст для поля **About → ⚙️ → Description** (GitHub поддерживает обычный текст и emoji; Markdown-таблицы и badges остаются в README):

> ⚡ Antigravity IDE setup: global AI rules, 77 skills, 35 GSD agent roles, 22 extensions, themes, MCP templates, browser testing & backup/restore. 🧠 Model-independent full-stack/design guidance adapted from Claude, Codex, ChatGPT & Claude Design.

Сохраните через **Save changes**. Description укладывается в лимит 350 символов. Подробности о настройках, ролях агентов, источниках рекомендаций и ограничениях находятся в начале [README](../README.md).

35 ролей — уникальные имена файлов в `agents/` без суффикса `.compact`; всего 64 Markdown-файла. 77 skills — каталоги с `SKILL.md`; 22 extensions — записи `config/extensions.json`. MCP перечислены как templates, поскольку подключение и личная авторизация проверяются отдельно. Названия Claude, Codex, ChatGPT и Claude Design обозначают источники адаптированных рекомендаций.

## Статус публикации

В этой среде GitHub API возвращает `403 Forbidden`. Git push обновляет файлы репозитория, но не поле About. До подтверждённой записи и повторного чтения Description считается не обновлённым.
