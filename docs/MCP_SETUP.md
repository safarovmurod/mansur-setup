# MCP: подключение с нуля без экспорта чужих ключей

Для установки из открытого Antigravity terminal рекомендован `install --skip-permissions`: templates/rules устанавливаются, текущие approvals сохраняются. Автоматизация ниже не заменяет личную MCP авторизацию. [Полная установка](../README.md#quick-start).

Installer сохраняет существующие server definitions, env, headers и credentials. Неприсутствующие GitHub/GSD/Sequential templates добавляются в активный ~/.gemini/config/mcp_config.json; GitHub template disabled и без credentials. Неподдерживаемое server metadata $typeName удаляется с backup. Существующий legacy config ~/.gemini/antigravity/mcp_config.json сохраняется. Фактический активный источник проверь в IDE: Agent panel → меню MCP servers / Manage MCP Servers → View raw config. Название меню может отличаться между версиями; редактируй именно открытый IDE файл. Сделай local backup.

## GitHub — hosted, без Docker

1. Создай свой PAT: [fine-grained tokens](https://github.com/settings/personal-access-tokens/new). Выбери только нужные repositories и permissions под реальные read/write задачи; не выдавай все права ради установки. Ссылка [classic tokens](https://github.com/settings/tokens) — если необходима совместимость, права также минимальные.
2. В активном config добавь entry из [github-remote.template.json](../config/mcp/github-remote.template.json). Замени placeholder Authorization своим `Bearer ...`, disabled установи false. Не замени весь mcpServers — добавь/обнови только github-mcp-server. serverUrl: https://api.githubcopilot.com/mcp/.
3. Reload → refresh MCP → попроси безопасный read-only get_me/list tools. Не считать enabled запись доказательством соединения. При auth/transport error сверяй client support и [официальную remote документацию](https://github.com/github/github-mcp-server/blob/main/docs/remote-server.md). Если transport не поддержан, используй Docker вариант ниже.

PAT хранится только локально вне repo. Не отправляй его агенту в чат, screenshot или issue.

## GitHub — Docker Desktop на Windows или Docker на Linux

1. Windows: [скачай Docker Desktop](https://www.docker.com/products/docker-desktop/), установи, выполни требования WSL2 из [официальной инструкции](https://docs.docker.com/desktop/setup/install/windows-install/) и запусти Docker Desktop. Linux: [Docker Engine по своему дистрибутиву](https://docs.docker.com/engine/install/). Проверь `docker --version` и `docker ps`. Установка Desktop в Windows не равна установке Linux Engine в WSL.
2. Используй [mcp_config.template.json](../config/mcp/mcp_config.template.json), подставив только свой PAT в env.GITHUB_PERSONAL_ACCESS_TOKEN. Сохрани остальных servers. `docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN ghcr.io/github/github-mcp-server` загружает image автоматически при первом запуске MCP. Не выводи env/token командой echo.
3. Reload/refresh и фактический безопасный read tool. [Официальный server](https://github.com/github/github-mcp-server).

## GSD и Sequential Thinking

Entry names и команды: [mcp_antigravity.template.json](../config/mcp/mcp_antigravity.template.json). Node/npm должны быть доступны процессу IDE. GSD package закреплён на версии 1.15.0, совпадающей с exported runtime; npx скачивает package при первом запуске. [Официальный GSD MCP guide](https://github.com/open-gsd/gsd-core/blob/next/docs/how-to/connect-gsd-mcp-server.md), [Sequential Thinking](https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking). Наличие skill не подтверждает доступность MCP tool; проверяй list tools и безопасный вызов.

## PAL MCP + Clink — optional, отдельно от стандартного installer

PAL не был обнаружен в этих двух configs, поэтому не помечается как установленный. Это отдельный multi-model сервер, не бесплатная раздача аккаунтов Claude/OpenAI. Clink вызывает внешние CLI; соответствующий CLI и его личная авторизация нужны. Выбирай доступные модели в своём provider, названия моделей не выдумывать.

1. Для PAL поставь [Python](https://www.python.org/downloads/) и [uv](https://docs.astral.sh/uv/getting-started/installation/). Проверь `python --version`, `uv --version`, `uvx --version` в терминале IDE; если Windows alias выводит только Python, это ещё не рабочий Python. Получи собственный ключ выбранного provider: [OpenRouter](https://openrouter.ai/keys), [Google AI Studio](https://aistudio.google.com/apikey), [OpenAI Platform](https://platform.openai.com/api-keys). Локальные модели — отдельная возможность, не эквивалент Claude/GPT.
2. Добавь PAL entry в активный MCP config, следуя [getting started](https://github.com/BeehiveInnovations/pal-mcp-server/blob/main/docs/getting-started.md). Общая команда: `uvx --from git+https://github.com/BeehiveInnovations/pal-mcp-server.git pal-mcp-server`. Используй фактический путь uvx, если IDE не видит PATH. Env содержит только собственный key. Для Windows native есть [run-server.ps1](https://github.com/BeehiveInnovations/pal-mcp-server/blob/main/run-server.ps1); WSL route настраивается внутри WSL, не смешивай Windows paths с Linux paths.
3. Reload/refresh → проверь tools. Для Clink следуй [Clink docs](https://github.com/BeehiveInnovations/pal-mcp-server/blob/main/docs/tools/clink.md): сначала установи выбранный внешний CLI и авторизуйся самостоятельно. Проверяй CLI version и простой read-only запрос до объявления «работает». Токены не клади в repo. PAL installation/auth не выполняются standard installer автоматически.

Ошибки doctor config/launcher показываются без credentials. Doctor не обещает, что конкретный сервер принял токен, модель доступна или AI использовал его инструмент.

Native MCP Refresh/reload IDE 2.5.5 имеет наблюдаемую lifecycle проблему; helper не исправляет vendor runtime. [Доказательства и ограничения](STABILITY.md).
