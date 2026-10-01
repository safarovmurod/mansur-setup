# Настройка Model Context Protocol (MCP) в Antigravity IDE

В данной конфигурации Antigravity IDE используются следующие MCP-серверы:
1. `github-mcp-server` — интеграция с GitHub (чтение/создание веток, PR, Issues, репозиториев).
2. `gsd` — координация сложных многофазных задач (Get Stuff Done core).
3. `sequential-thinking` — пошаговое рассуждение для сложных архитектурных решений.

---

## 1. GitHub MCP Server

### Назначение
Позволяет AI-агенту Antigravity взаимодействовать с GitHub API: читать код, проверять коммиты, создавать PR и ветки напрямую без ручного переключения в браузер.

### Prerequisites (Предварительные требования)
- **Docker Desktop для Windows**: сервер запускается в изолированном контейнере `ghcr.io/github/github-mcp-server`.
- **GitHub Personal Access Token (PAT)**.

### Пошаговая настройка

1. **Установите и запустите Docker Desktop:**
   - Скачайте с официального сайта: [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
   - Запустите Docker Desktop и убедитесь, что в трее Windows отображается статус "Docker is running".
   - Проверка в терминале:
     ```powershell
     docker --version
     docker ps
     ```

2. **Создайте GitHub Personal Access Token (PAT):**
   - Перейдите в GitHub: **Settings** -> **Developer settings** -> **Personal access tokens** -> **Tokens (classic)**
   - Прямая ссылка: [https://github.com/settings/tokens](https://github.com/settings/tokens)
   - Нажмите **Generate new token (classic)**.
   - Задайте имя (например, `Antigravity IDE MCP`).
   - Отметьте scopes (права доступа):
     - `repo` (Full control of private repositories)
     - `read:user`
     - `workflow` (опционально, если планируете триггерить GitHub Actions)
   - Нажмите **Generate token** и скопируйте полученную строку токена (`ghp_...`).

3. **Вставьте токен в конфигурационный файл:**
   - Откройте файл: `%USERPROFILE%\.gemini\config\mcp_config.json`
   - Вставьте ваш токен вместо `YOUR_GITHUB_PERSONAL_ACCESS_TOKEN_HERE`:
     ```json
     {
       "mcpServers": {
         "github-mcp-server": {
           "command": "docker",
           "args": [
             "run",
             "-i",
             "--rm",
             "-e",
             "GITHUB_PERSONAL_ACCESS_TOKEN",
             "ghcr.io/github/github-mcp-server"
           ],
           "env": {
             "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_ваш_фактический_токен"
           }
         }
       }
     }
     ```

4. **Проверка работы:**
   - Перезагрузите окно Antigravity IDE: `Ctrl+Shift+P` -> **Developer: Reload Window**.
   - Агент автоматически увидит доступные GitHub MCP инструменты (`create_pull_request`, `search_repositories` и др.).

---

## 2. GSD и Sequential Thinking MCP

### Назначение
- `gsd`: обеспечивает режим FAST/DEEP выполнения задач и координацию структурированных изменений.
- `sequential-thinking`: включается агентом автоматически при разборе запутанных багов и архитектурных рефакторингов.

### Требования и автоматизация
- Никаких токенов не требуется.
- Работает через `npx` (Node.js >= 18).
- Файл конфигурации находится в `%USERPROFILE%\.gemini\antigravity\mcp_config.json`:
  ```json
  {
    "mcpServers": {
      "gsd": {
        "command": "npx",
        "args": ["-y", "-p", "@opengsd/gsd-core", "gsd-mcp-server"]
      },
      "sequential-thinking": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
      }
    }
  }
  ```
- При первом обращении `npx` автоматически загрузит нужные пакеты без дополнительных ручных действий.
