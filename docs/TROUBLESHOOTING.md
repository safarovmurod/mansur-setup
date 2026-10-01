# Решение проблем и частые вопросы (Troubleshooting Guide)

---

## 1. Анализ ошибки из терминала: `npm install -g antigravity-manager`

В истории терминала была зафиксирована попытка установки:
```bash
npm install -g antigravity-manager
```
завершившаяся ошибками `deprecated`, `cleanup` и `EPERM`.

### Фактический разбор:
1. **Что это за пакет:**
   `antigravity-manager` — это сторонний прокси-сервер (автор `hizawye`, опубликован 8 месяцев назад), предназначенный для ротации токенов AI API (Claude, OpenAI, Gemini) и обхода квот через sqlite.
2. **Нужен ли он нашей настройке:**
   **НЕТ.** Он не имеет никакого отношения к Antigravity IDE, конфигурации редактора, стилям или правилам AI.
3. **Фактически установился ли он:**
   **НЕТ.** Команда `npm list -g --depth=0` показывает пустой список глобальных пакетов. В `%APPDATA%\Roaming\npm\` остались лишь пустые бинарные обёртки-шиммеры (`antigravity.cmd`), но самой библиотеки `node_modules/antigravity-manager` нет.
4. **Причина EPERM:**
   Пакет зависит от `better-sqlite3`, который компилирует нативный бинарный C++ код (`node-gyp`). На Windows без установленных Visual Studio C++ Build Tools или при блокировке антивирусом сборка прерывается с ошибкой `EPERM`, после чего npm запускает процедуру отката `cleanup` и удаляет распакованные файлы.
5. **Рекомендация:**
   Не пытайтесь повторно устанавливать данный пакет с правами Администратора или флагом `--force`. Он полностью исключён из нашей архитектуры.

---

## 2. Antigravity IDE CLI не найден

**Симптом:** Инсталлятор сообщает `Antigravity IDE CLI not found`.

**Причина:** Путь к бинарному файлу `antigravity-ide.cmd` не добавлен в системную переменную `PATH`.

**Решение:**
1. Стандартный путь на Windows:
   `%LOCALAPPDATA%\Programs\Antigravity IDE\bin`
2. Нажмите `Win + R` -> введите `sysdm.cpl` -> вкладка **Дополнительно** -> **Переменные среды** -> найдите в `Path` пользователя и добавьте путь:
   `C:\Users\<ВашПользователь>\AppData\Local\Programs\Antigravity IDE\bin`
3. Перезапустите терминал.

---

## 3. Git Bash профиль не открывается

**Симптом:** Терминал внутри Antigravity выдаёт ошибку при открытии Git Bash.

**Причина:** Git установлен в нестандартную директорию (по умолчанию ожидается `C:\Program Files\Git\bin\bash.exe`).

**Решение:**
1. Найдите расположение `bash.exe` на вашем компьютере:
   ```cmd
   where bash.exe
   ```
2. Откройте `settings.json` (`Ctrl+,` -> иконка файла справа вверху) и скорректируйте путь:
   ```json
   "terminal.integrated.profiles.windows": {
     "Git Bash": {
       "path": "C:\\Ваш\\Путь\\К\\Git\\bin\\bash.exe",
       "args": ["--login", "-i"]
     }
   }
   ```

---

## 4. Ошибка Docker для GitHub MCP Server

**Симптом:** Агент сообщает `Docker is not running` или `connection refused` при попытке работы с GitHub MCP.

**Решение:**
1. Убедитесь, что Docker Desktop запущен (зелёная иконка в трее Windows).
2. Выполните проверку в PowerShell:
   ```powershell
   docker ps
   ```
3. Если Docker запускается с ошибкой WSL2:
   ```powershell
   wsl --update
   ```
   и перезапустите Docker Desktop.

---

## 5. Восстановление исходных настроек из резервной копии

Если вам необходимо вернуть прежнее состояние IDE:
1. Запустите команду восстановления:
   ```bash
   npx mansur-antigravity-setup restore
   ```
   или выберите конкретную папку из списка:
   ```bash
   node bin/mansur-setup.js restore "C:\Users\<Имя>\.gemini\backups\<папка-бэкапа>"
   ```
2. Перезагрузите окно Antigravity IDE (`Ctrl+Shift+P` -> **Developer: Reload Window**).
