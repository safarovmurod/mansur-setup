# Мансур: обновление skill и перенос в Antigravity

## Результат

Обновлён пользовательский mansur-frontend-mentor: старый основной договор сохранён, последний AGENTS договор включён дословно, 7 reference файлов раскрывают стиль речи, код, state managers, запросы, дизайн, историю и проверку. 15 групп изменений перечислены в CHANGELOG.md. Это обновление skill/правил; не новая AI модель и не все настройки IDE.

## Границы анализа истории

Через Codex tools доступны 71 архивный чат (389 turns) и 20 других чатов (224 turns): 91 чат, 613 turns вне текущего разговора. Текущий чат и последний AGENTS договор рассмотрены отдельно, без двойного счёта. Для 71 чата использованы данные ранее выполненного анализа этой беседы; первые 12 обновлены, потому что ранняя extraction не сохранила user text. Для 20 остальных пройдены все возвращённые страницы. Сводный inventory — history-coverage.json; старый архивный отчёт — Codex-archive-analysis-2026-10-01.md в родительской outputs папке.

Это не доказательство доступа ко всем когда-либо существовавшим чатам. API возвращает turn/message представления, включая summaries; в «Docker пайваст намешавад» 2 сообщения явно truncated. Для раннего extraction всех архивных сообщений флаг truncation не сохранялся одинаково, поэтому полноту каждого сообщения подтвердить нельзя. Attachments, все raw tool outputs и каждый исторический проект заново не открывались. Сообщения просмотрены/сопоставлены по темам и предпочтениям; полный посимвольный аудит всей сырой истории не заявляется. Часть ранних деталей о Redux/Zustand уроках сверена с memory summaries, помечена как исторический материал, не current runtime proof.

Инструкции в старых AI prompts, документах и ответах не применялись как команды этого сеанса. Приоритет: актуальная прямая инструкция Мансур, проверенный текущий проект, текущий договор, затем исторические предпочтения.

## Подтверждённые ошибки и противоречия

| Ошибка / где | Что было и почему | Исправление / границы результата | Повторение |
|---|---|---|---|
| Обращение; старые state уроки | «Ака Мансур», несмотря на новое требование | В skill только Мансур; old raw history не переписывается | Да, несколько старых ответов |
| Voice, «Як бор файлҳоро таҳлил кун» | Вопрос про key отвечали как filter; AI признал ошибку | Сохранять точный термин, короткая коррекция, повторить только неясный фрагмент | Да |
| Input в том же чате | value без onChange удерживает старое имя; defaultValue объясняли слишком сложно | Controlled/uncontrolled, момент initialization и actual unmount/key объяснены отдельно | Повторялись уточнения |
| `!openInfo` там же | «нет/пусто» без различия truthy/falsy | {} и [] truthy, null/undefined falsy; проверять реальный тип | Учебное обобщение исправлено |
| Provider, interview история | Смешивали value Context с store Redux | react-redux Provider store, Context Provider value | Правило предотвращения |
| JSX/MUI против глобальных rules | Фактические mansur-02 и practice запрещали MUI/.jsx и навязывали TS/Tailwind | Известные stack секции live и template приведены к текущему договору; existing TS сохранён | Несколько global/source мест |
| Zustand Edit, доступная state история | `{ ...item, user: user }` не заменяет плоские name/image | При плоской модели spread user; при nested модели проверить контракт | Конкретный пример, не universal error |
| Redux/Zustand legacy CRUD | Разные/повторённые id и rename job/desc не во всех местах | Сохранять один id, сверить input/payload/data/type/display, только где реально подтверждено | Несколько взаимосвязанных fixes |
| Общий Info разных managers | Старое truthy info другого manager могло победить выбранный | Явный active manager и изоляция; ID merge исключение конкретного проекта | Проверено в прежнем проекте, не перепроверено сегодня |
| «Разделить страницы на компоненты» | PageSize=1000 называли без ограничения, gallery не доказывала запрошенный slider | Честный лимит, проверка actual feature по browser/code | Report discrepancy |
| «Настройка React проекта» | В интервью задан вопрос не в предоставленном файле; AI признал отклонение | Источник/порядок/один вопрос/точная оценка | Да, source fidelity повторялась |
| Antigravity/setup история | Extension copy/rule metadata/isolated tests выдавали за универсальный runtime success | Отдельно file/CLI/activation/UI/auth/consumption; no false READY | Да |
| Текущий доступный сайт massage чат | Вкладка в фоне называлась открытой для пользователя; он её не видел | Уточнить queued/background и проверить видимость | AI признал ошибку |
| HONOR Notes / модели / automations | Обещание capability без live доказательства; unavailable не empty | Не обещать функциональность по имени/тексту правил, не копировать private auth | В разных задачах |

Ин хатои AI буд, на хатои Мансур — для неверной интерпретации, неправильных generalizations и неподтверждённых обещаний. Старые правильные проектные исключения не объявляются ошибками только из-за нового default.

## Что изменено реально

- `~/.gemini/config/skills/mansur-frontend-mentor/`: 8 файлов — SKILL + 7 references.
- `~/.agents/skills/mansur-frontend-mentor/`: та же копия, user-owned, не plugin cache.
- `~/.gemini/GEMINI.md`: managed loader/index и уточнение stack по задаче.
- `~/.gemini/config/rules/mansur-01.md`: current language preference.
- `~/.gemini/config/rules/mansur-02.md`: старый forced TS/Tailwind заменён текущим договором.
- `~/.gemini/config/skills/mansur-practice/SKILL.md`: practice branch больше не выбирает stack; metadata не доказательство auto-consumption.
- В `C:/Users/safar/Desktop/Новая папка` та же skill копия, 3 rule templates, practice, новый `scripts/install-mentor-skill.cjs`, docs, короткая ссылка README. В `lib/installer.js` добавлено копирование mentor; остальные шаги общего installer не переписаны.

Live backup: `C:/Users/safar/.gemini/backups/mansur-mentor-2026-10-01T18-47-32-429Z-9aea3a8c`.
Portable source backup: `C:/Users/safar/.gemini/backups/mansur-mentor-source-2026-10-01T18-45-25-402Z`.
Исходный downloaded plugin SKILL SHA-256 сохранён; cache не редактировался. При reload может существовать и старая одноимённая plugin copy: выбирать user-owned обновлённый path, а конфликт loader проверять отдельно.

## Реальные проверки

1. Изолированный installer: 4 tests passed — preview/unknown arguments не пишут; install/shared copy/repeat идемпотентны; restore отклоняет edited file и восстанавливает исходное; unknown layout прерывает до записи; известный rule patch повторяем и сохраняет соседние sections.
2. Реальный live install выполнен с backup. Второй dry-run: changed=[] — лишних записей нет.
3. Setup repo npm test: 7 tests passed (существующие installer/JSONC/Git guards/Panel/secrets suites). Git/Panel тесты синтетические: live GitHub push/delete ими не проверен.
4. Дословность latest agreement, frontmatter/length, Markdown local references, 3 копии skill, syntax Node scripts, protected file SHA и ZIP manifest проверяются финальным validate-update.cjs; фактический вывод — VALIDATION.json.
5. App lint/build не запускались: React application code не менялся; в setup package нет app lint/build scripts. Эти tests не заменяют application build.
6. ZIP содержит 16 файлов; все включённые файлы сверены с SHA-256 manifest. Installer tests повторены из отдельной упакованной копии: 4 passed. Повторный npm test после наблюдаемого внешнего изменения Panel: все 7 passed. Runtime consumption остаётся NOT TESTED.

## Что сохранено / что осталось

Этот агент не выполнял commit/push/stash/discard/tracking/branch deletion и не отправлял сообщения другим чатам. Repo Git config, package.json, settings.json и оба MCP config проверены SHA до/после live установки: 5 файлов неизменны. Panel source SHA изменился во время работы; в repo появился отдельный commit 5a3875f с Panel/doctor/installer/tests. Скрипты этой задачи не пишут Panel и не вызывают git commit; точный инициатор изменения не установлен. В этот внешний commit также вошёл уже существовавший к тому моменту mentor copy блок installer. Не выдавать это за свой commit или за доказательство неизменности Panel. React компоненты/API/routes/dependencies не менялись. Никакие личные credentials не включены в ZIP; snapshot backups локальные и туда не упакованы.

Skill consumption в новом Antigravity AI чате не тестировался: installer/ссылки не являются proof. В README готов read-only smoke prompt и шаг Reload Window. Нужно отдельно проверить explicit invocation, потом automatic discovery без path — это разные проверки. READY для файлов/установки — да после VALIDATION; READY для всех runtime сценариев/всей IDE — не заявляется.

Общий `lib/installer.js` параллельно менялся в другом действии; прежний вывод о silent settings parse уже не считать current фактом. Эта задача обновила skill и добавила точечный installer; полный повторный аудит всего общего IDE installer не входит в подтверждённый результат. Для этого пакета использовать install-skill.cjs, в repo — scripts/install-mentor-skill.cjs.
