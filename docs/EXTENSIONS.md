# Справочник расширений Antigravity IDE (Extensions Guide)

В данном руководстве описаны все 22 расширения, используемые в сборке Antigravity IDE, с проверенными командами CLI и инструкциями для ручной установки.

---

## 1. Таблица всех расширений

| Extension ID | Название | Назначение | Автоматическая установка (CLI) | Ручная установка (UI) |
|---|---|---|---|---|
| `esbenp.prettier-vscode` | Prettier - Code formatter | Форматирование JavaScript, TypeScript, React JSX, CSS, HTML, JSON | `antigravity-ide --install-extension esbenp.prettier-vscode` | Поиск `esbenp.prettier-vscode` во вкладке Extensions -> Install |
| `bradlc.vscode-tailwindcss` | Tailwind CSS IntelliSense | Автодополнение классов Tailwind, подсветка и превью цветов | `antigravity-ide --install-extension bradlc.vscode-tailwindcss` | Поиск `Tailwind CSS IntelliSense` -> Install |
| `pkief.material-icon-theme` | Material Icon Theme | Иконки папок и файлов в стиле Material Design | `antigravity-ide --install-extension pkief.material-icon-theme` | Поиск `Material Icon Theme` -> Install |
| `usernamehw.errorlens` | Error Lens | Отображение ошибок и предупреждений линтера прямо в строке кода | `antigravity-ide --install-extension usernamehw.errorlens` | Поиск `Error Lens` -> Install |
| `streetsidesoftware.code-spell-checker` | Code Spell Checker | Проверка орфографии в коде (настроено для английского и русского языков) | `antigravity-ide --install-extension streetsidesoftware.code-spell-checker` | Поиск `Code Spell Checker` -> Install |
| `dsznajder.es7-react-js-snippets` | ES7+ React/Redux Snippets | Готовые сниппеты для React компонентов, хуков и Redux (`rfc`, `rfce`, `tsrfce`) | `antigravity-ide --install-extension dsznajder.es7-react-js-snippets` | Поиск `ES7+ React/Redux` -> Install |
| `formulahendry.auto-rename-tag` | Auto Rename Tag | Автоматическое переименование парного закрывающего тега при изменении открывающего | `antigravity-ide --install-extension formulahendry.auto-rename-tag` | Поиск `Auto Rename Tag` -> Install |
| `christian-kohler.path-intellisense` | Path Intellisense | Автодополнение относительных путей к файлам при импортах | `antigravity-ide --install-extension christian-kohler.path-intellisense` | Поиск `Path Intellisense` -> Install |
| `christian-kohler.npm-intellisense` | npm Intellisense | Автодополнение установленных npm пакетов при написании `import ... from` | `antigravity-ide --install-extension christian-kohler.npm-intellisense` | Поиск `npm Intellisense` -> Install |
| `edwinhuish.better-comments-next` | Better Comments Next | Цветовая подсветка комментариев (`!`, `?`, `TODO`, `*`) | `antigravity-ide --install-extension edwinhuish.better-comments-next` | Поиск `Better Comments Next` -> Install |
| `kisstkondoros.vscode-gutter-preview` | Image Preview in Gutter | Миниатюрное превью картинок слева на полях редактора и при наведении | `antigravity-ide --install-extension kisstkondoros.vscode-gutter-preview` | Поиск `Image Preview` -> Install |
| `anteprimorac.html-end-tag-labels` | HTML End Tag Labels | Отображение подсказок с именем класса/id рядом с закрывающим тегом `</div>` | `antigravity-ide --install-extension anteprimorac.html-end-tag-labels` | Поиск `HTML End Tag Labels` -> Install |
| `bradgashler.htmltagwrap` | htmltagwrap | Оборачивание выделенного блока в HTML/JSX тег по горячей клавише `Alt+W` | `antigravity-ide --install-extension bradgashler.htmltagwrap` | Поиск `htmltagwrap` -> Install |
| `wix.vscode-import-cost` | Import Cost | Показывает примерный размер импортируемого пакета в строке импорта | `antigravity-ide --install-extension wix.vscode-import-cost` | Поиск `Import Cost` -> Install |
| `ritwickdey.liveserver` | Live Server | Локальный сервер с live reload для простых HTML/JS проектов | `antigravity-ide --install-extension ritwickdey.liveserver` | Поиск `Live Server` -> Install |
| `github.vscode-github-actions` | GitHub Actions | Управление и мониторинг CI/CD воркфлоу GitHub Actions прямо из IDE | `antigravity-ide --install-extension github.vscode-github-actions` | Поиск `GitHub Actions` -> Install |
| `akintomiwa-fisayo.icon-classes` | Icon Classes | Автодополнение классов иконок | `antigravity-ide --install-extension akintomiwa-fisayo.icon-classes` | Поиск `Icon Classes` -> Install |
| `ms-ceintl.vscode-language-pack-ru` | Russian Language Pack | Официальный языковой пакет для русского интерфейса редактора | `antigravity-ide --install-extension ms-ceintl.vscode-language-pack-ru` | Поиск `Russian Language Pack` -> Install |
| `ms-mssql.mssql` | SQL Server (mssql) | Поддержка Microsoft SQL Server, подсветка и выполнение запросов | `antigravity-ide --install-extension ms-mssql.mssql` | Поиск `SQL Server (mssql)` -> Install |
| `oxc.oxc-vscode` | JavaScript/TypeScript (OXC) | Быстрый анализатор и линтер JavaScript и TypeScript на базе Oxlint | `antigravity-ide --install-extension oxc.oxc-vscode` | Поиск `OXC` -> Install |
| `iranon.jelly-cursor` | Jelly Cursor | Движок кастомного курсора (настроен в режим плавного нативного курсора с выключенной рябью) | `antigravity-ide --install-extension iranon.jelly-cursor` | Поиск `Jelly Cursor` -> Install |
| `mansur.mansur-github-panel` | Mansur GitHub Panel | **Кастомное расширение**: панель в проводнике Explorer для быстрого push, смены и создания веток с защитой от незафиксированных изменений и утечки секретов | `powershell -File extensions/mansur-github-panel/install-github-panel.ps1` | Скопировать папку `extensions/mansur-github-panel` в `%USERPROFILE%\.antigravity-ide\extensions\mansur.mansur-github-panel-1.1.1` |

---

## 2. Установка шрифта JetBrains Mono

В настройках Antigravity IDE по умолчанию прописана типографика:
```json
"editor.fontFamily": "'JetBrains Mono', 'Cascadia Code', monospace",
"terminal.integrated.fontFamily": "'JetBrains Mono', monospace"
```

### Способы установки:

1. **Через Windows Package Manager (рекомендуется, 1 команда в PowerShell/CMD):**
   ```powershell
   winget install JetBrains.JetBrainsMono
   ```

2. **Вручную с официального сайта:**
   - Скачайте архив шрифта: [https://www.jetbrains.com/lp/mono/](https://www.jetbrains.com/lp/mono/) или прямой архив [JetBrainsMono-2.304.zip](https://download.jetbrains.com/fonts/JetBrainsMono-2.304.zip)
   - Распакуйте папку `fonts/ttf`
   - Выделите все `.ttf` файлы, нажмите правой кнопкой мыши -> **Установить для всех пользователей** (или **Установить**).
   - Перезапустите Antigravity IDE.
