# Full-stack guide — mansur-unified-v1

## Контекст и контракт

Начни с package.json, существующих components/routes/client calls, backend handlers, migrations, конфигурации и имеющихся тестов. Определи реальные runtime и сервисы, команды запуска, environment requirements и источник API контракта: код сервера, OpenAPI или предоставленная документация. Отдельно запиши неизвестные method/path, request/response shape, status codes, pagination, auth и error format. Не заполняй неизвестные значения выдуманным работающим API. Fixtures допустимы для тестов и явно обозначенного prototype; они не являются production интеграцией.

Для нового учебного frontend по умолчанию React + JSX + Vite + MUI + React Router + Axios, .jsx для JSX и .js без JSX. Подключай только то, что необходимо сценарию. Сохраняй существующий TypeScript (.tsx/.ts), Next.js, Tailwind и выбранный state manager. Формы, requests и transitions должны оставаться понятными; не прячь учебную логику за factories, repositories и custom hooks без причины. Не мигрируй working code ради примера.

## Frontend и интеграция

Соедини экран и endpoint по проверенному контракту. Проверь формы, pending submit, disabled состояние, loading/empty/error/success, navigation и отмену устаревшего запроса, если это реально нужно. Не сохраняй один источник данных независимо в нескольких state managers. Правильно передавай route parameters, идентификаторы и тела запросов. Обработай timeout, network failure, validation errors и истёкшую сессию без ложного success. Подтверждай успешное сохранение ответом сервера; optimistic UI требует rollback и задачи, которая это оправдывает.

## Сервер, validation и authorization

Validation — на границе API, не только в браузере. Проверяй types, required fields, ограничения длины/размера, допустимые значения и неизвестные поля согласно контракту. Authentication устанавливает identity; authorization отдельно проверяет разрешение на действие и конкретный объект/tenant на сервере при каждом нужном запросе. Скрытая кнопка не является access control. Выбирай существующий механизм sessions/tokens; не изобретай cookies/OAuth flow. Для cookie auth оцени CSRF, HttpOnly/Secure/SameSite; для cross-origin настрой CORS на необходимые origins. Не ослабляй auth ради smoke test production.

Ошибки должны иметь понятный публичный формат и правильный HTTP status, но не stack traces, connection strings или secrets. Логи полезны для диагностики, без токенов и лишних личных данных. Rate limiting и abuse protection добавляй там, где этого требует реальный публичный сценарий, а не как новую несвязанную платформу.

## База, uploads и persistence

Используй установленную базу и migration workflow. Parameterized queries/ORM параметры вместо SQL конкатенации. Необходимые foreign keys, uniqueness и ограничения целостности должны защищать данные, а не только UI. Несколько связанных операций, которые должны завершаться вместе, выполняй в transaction; проверяй rollback при ошибке. Для повторных запросов оцени idempotency и race conditions, особенно деньги, inventory и создание уникальных записей. Не добавляй кеш и сложную синхронизацию без измеренной проблемы.

Upload требует проверки прав, размера, типа/содержимого, безопасного generated filename и места хранения. Не доверяй client filename/MIME; блокируй traversal и исполняемый контент согласно сценарию. Не показывай private uploads без server authorization. Документируй limits и lifecycle удаления. Нельзя выдавать object URL или временный файл в памяти за сохранение в постоянное хранилище.

Проверь запись и последующее чтение из настоящего тестового storage; когда применимо, перезапусти только запущенный тобой тестовый сервис и снова прочитай данные. Состояние React или успешный POST само по себе не доказывает persistence. Production database и реальные пользовательские данные не используй как разрушительный fixture.

## Secrets, производительность и проверки

Сначала проверь имена/наличие уже настроенных bindings, затем необходимую операцию. Никогда не печатай значения credentials. Новый секрет запрашивай только через поддерживаемые secure settings. Server secrets не попадают в Vite/Next public variables, клиентский bundle, Git, screenshots или отчёт. TLS/checksum/signature остаются включёнными.

Перед оптимизацией измерь реальный узкий участок. Проверь лишние requests, N+1 queries, pagination, индексы подходящих запросов, размер assets и bundle. Не применяй useMemo/useCallback ко всему без причины. Совместимость и простой работающий код важнее декоративного refactor.

Проверь основной успешный поток и существенные ошибки: невалидные данные, anonymous/forbidden user, отсутствующий объект, duplicate/race при необходимости, сеть и повторное чтение. Запусти существующие tests/build/type checks. Browser, API и persistence результаты считай отдельно. В отчёте укажи команды, фактическое поведение и skipped/unrun части. Этот guide не устанавливает сервер, базу, модель или API и не доказывает, что агент его прочитал.
