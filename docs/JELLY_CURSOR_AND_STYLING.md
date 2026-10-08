# Оформление редактора, нативный курсор и патч Jelly Cursor

Полный installer теперь автоматически устанавливает включённый в package и проверенный JetBrains Mono и выбирает его для editor/terminal. [Текущая установка](../README.md#quick-start), [font/automation проверки](SETUP-AUTOMATION.md). Обычный setup не патчит vendor bundle; legacy patch разделы ниже не являются обязательным шагом.

В данной сборке реализован премиальный минималистичный стиль интерфейса Antigravity IDE: плавный нативный курсор, чистые направляющие отступов, мягкие индикаторы ошибок и отключение отвлекающих эффектов ряби.

---

## 1. Настройки нативного курсора и шрифта

В файле `settings.json` активированы параметры:
```json
"editor.cursorBlinking": "smooth",
"editor.cursorSmoothCaretAnimation": "on",
"editor.cursorStyle": "line",
"editor.cursorWidth": 2,
"editor.lineHeight": 25,
"editor.letterSpacing": 0.3,
"editor.padding.top": 12,
"editor.padding.bottom": 12,
"editor.matchBrackets": "never",
"editor.renderLineHighlight": "none"
```

### Преимущества:
- **Плавная каретка (Smooth Caret):** курсор перемещается с аппаратным ускорением без рывков.
- **Чистый фокус:** убрана резкая рамка текущей строки (`renderLineHighlight: "none"`), что снижает зрительную усталость при долгом чтении кода.
- **Мягкие цвета диагностики:** в `workbench.colorCustomizations` цвет ошибок и предупреждений сбалансирован прозрачностью (`#f8717166`, `#fbbf2455`).

---

## 2. Статус эффекта ряби (Jelly Cursor Ripple)

Эффект кликабельной «водной ряби» (ripple) **отключён** по умолчанию:
```json
"jellyCursor.rippleEnabled": false,
"jellyCursor.animationMode": "off",
"jellyCursor.landingPulseEnabled": false,
"jellyCursor.sparkEnabled": false,
"jellyCursor.trailEnabled": false
```
Это сделано для обеспечения максимальной производительности редактора и отсутствия посторонних графических задержек при быстром вводе текста.

---

## 3. Обновление Antigravity IDE и восстановление патча

Если расширение Jelly Cursor внедряет скрипт в `workbench.html`, при официальном обновлении Antigravity IDE этот файл может быть перезаписан установщиком.

Для этого в системе настроен скрипт автовосстановления:
`%USERPROFILE%\.antigravity\jelly-cursor\checkAndRepairJellyCursor.js`

### Ручной запуск проверки и восстановления:
```cmd
repair-ripple.cmd
```
или через Node.js:
```bash
node "%USERPROFILE%\.antigravity\jelly-cursor\checkAndRepairJellyCursor.js"
```

Скрипт автоматически:
1. Проверяет версию Antigravity IDE.
2. Делает резервную копию `workbench.html.backup-<version>`.
3. Безопасно восстанавливает маркеры патча перед закрывающим тегом `</html>`.
4. Сохраняет историю действий в `jelly-cursor-state.json`.
