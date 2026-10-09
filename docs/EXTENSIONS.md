# Все 23 расширения

Installer устанавливает gallery IDs через обнаруженный Antigravity CLI; custom panel — из локального VSIX. Количество 23 означает записи catalog этой версии, не результат native runtime на каждом компьютере. На другом компьютере доступность gallery проверяется при установке, ошибки не скрываются.

| Название | ID | Для чего | Установка вручную |
|---|---|---|---|
| Prettier - Code formatter | `esbenp.prettier-vscode` | Code formatter using prettier | `antigravity-ide --install-extension esbenp.prettier-vscode` |
| Tailwind CSS IntelliSense | `bradlc.vscode-tailwindcss` | Intelligent Tailwind CSS tooling for VS Code / Antigravity | `antigravity-ide --install-extension bradlc.vscode-tailwindcss` |
| Material Icon Theme | `pkief.material-icon-theme` | Material Design Icons for Files and Folders | `antigravity-ide --install-extension pkief.material-icon-theme` |
| Error Lens | `usernamehw.errorlens` | Improve highlighting of errors, warnings and other language diagnostics | `antigravity-ide --install-extension usernamehw.errorlens` |
| Code Spell Checker | `streetsidesoftware.code-spell-checker` | Spelling checker for source code (configured for en, ru) | `antigravity-ide --install-extension streetsidesoftware.code-spell-checker` |
| ES7+ React/Redux/React-Native snippets | `dsznajder.es7-react-js-snippets` | Extensions for React, Redux and React Native with TypeScript support | `antigravity-ide --install-extension dsznajder.es7-react-js-snippets` |
| Auto Rename Tag | `formulahendry.auto-rename-tag` | Auto rename paired HTML/XML/JSX tag | `antigravity-ide --install-extension formulahendry.auto-rename-tag` |
| Path Intellisense | `christian-kohler.path-intellisense` | Autocompletes filenames in imports and paths | `antigravity-ide --install-extension christian-kohler.path-intellisense` |
| npm Intellisense | `christian-kohler.npm-intellisense` | Autocompletes npm modules in import statements | `antigravity-ide --install-extension christian-kohler.npm-intellisense` |
| Better Comments Next | `edwinhuish.better-comments-next` | Human-friendly colored comments in code | `antigravity-ide --install-extension edwinhuish.better-comments-next` |
| Image preview | `kisstkondoros.vscode-gutter-preview` | Shows image preview in the editor gutter and on hover | `antigravity-ide --install-extension kisstkondoros.vscode-gutter-preview` |
| HTML End Tag Labels | `anteprimorac.html-end-tag-labels` | Shows opening tag class/id labels at end tags | `antigravity-ide --install-extension anteprimorac.html-end-tag-labels` |
| htmltagwrap | `bradgashler.htmltagwrap` | Wraps selected text in HTML/JSX tags (Alt+W) | `antigravity-ide --install-extension bradgashler.htmltagwrap` |
| Import Cost | `wix.vscode-import-cost` | Display imported package size inline in editor | `antigravity-ide --install-extension wix.vscode-import-cost` |
| Live Server | `ritwickdey.liveserver` | Launch a development local Server with live reload feature | `antigravity-ide --install-extension ritwickdey.liveserver` |
| GitHub Actions | `github.vscode-github-actions` | GitHub Actions workflows management in IDE | `antigravity-ide --install-extension github.vscode-github-actions` |
| Icon Classes | `akintomiwa-fisayo.icon-classes` | Icon autocomplete and classes helper | `antigravity-ide --install-extension akintomiwa-fisayo.icon-classes` |
| Russian Language Pack for Visual Studio Code / Antigravity | `ms-ceintl.vscode-language-pack-ru` | Localization for Russian UI | `antigravity-ide --install-extension ms-ceintl.vscode-language-pack-ru` |
| SQL Server (mssql) | `ms-mssql.mssql` | Develop Microsoft SQL Server, Azure SQL Database and SQL Data Warehouse databases | `antigravity-ide --install-extension ms-mssql.mssql` |
| JavaScript and TypeScript (OXC) | `oxc.oxc-vscode` | Fast JS/TS linter using the Oxlint engine | `antigravity-ide --install-extension oxc.oxc-vscode` |
| Jelly Cursor | `iranon.jelly-cursor` | Cursor animation provider (configured in native smooth mode, ripple disabled) | `antigravity-ide --install-extension iranon.jelly-cursor` |
| Mansur GitHub Panel | `mansur.mansur-github-panel` | GitHub Explorer panel with Git push, branch switch, new branch, dirty protection, and secret filtering | Installer собирает VSIX из extensions/mansur-github-panel |

В UI: Ctrl+Shift+X → вставь ID из таблицы → Install. Если команда antigravity-ide отсутствует в PATH, основной installer сам обнаруживает .cmd; ручной вариант — UI.

## Точные настройки

Все экспортированные значения лежат в [config/settings.json](../config/settings.json), shortcuts — [config/keybindings.json](../config/keybindings.json). Ниже настройки расширений; отсутствие индивидуальных значений означает defaults самого расширения.

```json
{
  "jellyCursor.rippleEnabled": false,
  "jellyCursor.landingPulseEnabled": false,
  "jellyCursor.sparkEnabled": false,
  "jellyCursor.trailEnabled": false,
  "jellyCursor.rainbowEnabled": false,
  "jellyCursor.glowEnabled": false,
  "jellyCursor.springEnabled": false,
  "jellyCursor.animationMode": "off",
  "jellyCursor.effectPreset": "custom",
  "jellyCursor.statusBar": false,
  "jellyCursor.reminders": false,
  "cSpell.language": "en,ru",
  "oxc.enable.oxfmt": false,
  "auto-rename-tag.activationOnLanguage": [
    "html",
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "prettier.tabWidth": 2,
  "prettier.singleQuote": false,
  "prettier.semi": false,
  "prettier.trailingComma": "es5",
  "prettier.printWidth": 100,
  "prettier.bracketSameLine": false,
  "tailwindCSS.includeLanguages": {
    "javascript": "javascript",
    "javascriptreact": "javascriptreact",
    "typescript": "typescript",
    "typescriptreact": "typescriptreact"
  },
  "tailwindCSS.emmetCompletions": true,
  "tailwindCSS.classAttributes": [
    "class",
    "className"
  ],
  "tailwindCSS.lint.cssConflict": "ignore",
  "tailwindCSS.lint.invalidTailwindDirective": "ignore",
  "tailwindCSS.lint.invalidApply": "ignore",
  "tailwindCSS.lint.invalidScreen": "ignore",
  "tailwindCSS.lint.invalidVariant": "ignore",
  "tailwindCSS.lint.invalidConfigPath": "ignore",
  "tailwindCSS.lint.recommendedVariantOrder": "ignore",
  "errorLens.enabled": true,
  "errorLens.followCursor": "activeLine",
  "errorLens.delay": 2000,
  "errorLens.gutterIconsEnabled": false,
  "errorLens.enabledDiagnosticLevels": [
    "error",
    "warning"
  ],
  "errorLens.excludeBySource": [
    "tailwindcss",
    "ts(6133)",
    "ts(6138)",
    "ts(6192)",
    "ts(6196)",
    "ts(6198)",
    "ts(6199)",
    "ts(6205)"
  ],
  "errorLens.excludeByMessage": [
    "Form elements must have labels",
    "Select element must have an accessible name",
    "Buttons must have discernible text",
    "Button elements must have discernible text"
  ]
}
```

Prettier выбран editor.defaultFormatter; formatOnSave=true, formatOnPaste=false. В существующем проекте локальная конфигурация formatter может иметь приоритет. Theme: Dark+, icons: material-icon-theme; JetBrains Mono, размер 15, lineHeight 25, native smooth cursor on, Jelly effects off.

## Mansur Antigravity Stability

ID: `mansur.antigravity-stability-helper` 1.0.1. Второй локальный VSIX включён в полный installer; восстанавливает только два известных hash/version. [Поведение и ограничения](STABILITY.md).
