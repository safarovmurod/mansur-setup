# Source adaptation — mansur-unified-v1

## Происхождение

Требования Мансура и предоставленный system_prompts_leaks.zip служат материалом анализа. Активные группы: Claude Fable 5.1, Claude Opus 5.5, Claude Sonnet 5.5, GPT-6 Astra, GPT-6.1 Sol, Codex/ChatGPT рабочие рекомендации и Claude Design с релевантными skills. Имена указывают на источники адаптированных рекомендаций. Установщик не ставит Claude, Codex, ChatGPT, Claude Design или перечисленные модели и не меняет выбранную модель Antigravity.

Это новые авторские адаптации требований, не восстановленные копии четырёх Windows rules. Файлы mansur-unified-core/full-stack/design/sources.md, старые guides, 103 source-originals и прошлые runtime reports отсутствуют в предоставленном ZIP. Личные Windows пути и исторические Gemini 3.8/3.1 проверки не являются результатами текущего запуска.

## Inventory и состояние аудита

source-manifest.json фиксирует SHA-256 ZIP, текущие количества и границы выборки. source-coverage.csv содержит все 654 внешних и 26 вложенных файлов, hashes, binary/text/archive классификацию, duplicates, selection и pending status. source-sections.csv индексирует Markdown headings и отдельные XML section tags по строкам. Это иной критерий, чем прежние 3735 sections; не подменяй им прошлый отчёт. В этой выборке 62 сохранённых originals, не 103.

Все выбранные originals сохранены отдельно для локального аудита, вне распространяемого Git/package. Raw prompts, .git metadata, private backups и provider tool schemas не устанавливаются в context. Перед повторным inventory пользовательского ZIP проверь границы путей; ничего из него не исполняй. Muse не используется как активный источник, его history/ZIP сохраняются. Это никак не запрещает runtime модель с таким именем.

requirements-map.csv связывает проверенные требования с repo file, installed path, activation и проверкой. detailed_clause_audit_pending в file/section maps означает, что полный аудит каждой фразы ещё не доказан. Не меняй статус из-за присутствия файла, keyword match, успешного копирования или одного ответа модели. Условия лицензии пользовательского ZIP и вложенных bundles не превращают все материалы в авторский MIT код: attribution и отсутствие гарантий исходной коллекции отмечены в docs/THIRD_PARTY.md.

## Что адаптировано

- Codex/ChatGPT: сохранение контекста задачи, действия в рамках разрешения, минимальные изменения, чтение файлов до правки, проверка результата и честный отчёт. Не импортируются hidden instructions, tool namespaces, platform identity, internal paths, approval implementations или service-specific permissions.
- Claude: анализ намерения, ясная коммуникация, проверка источников и факт/неопределённость. Persona, фиксированные даты, provider-specific safety/identity и список доступных инструментов не становятся инструкциями Antigravity.
- Claude Design/frontend-design/hi-fi-design: назначение и визуальное направление, existing UI context, реальные assets, варианты и проверка. Универсальные эстетические запреты заменены приоритетом реального brand/project.
- create-design-system: source component inventory, реальные числовые tokens, assets, состояния и явные omissions. Host-specific @dsCard/@startingPoint, generated bundles и import UI не навязываются обычному React/Vite/MUI проекту.
- wireframe/options: устойчивые IDs вариантов и сохранение прежних решений применимы при запросе вариантов; служебный canvas markup требует настоящего соответствующего host.
- interactive-prototype: реальные interactions, state и navigation. Mock flow остаётся mock; API, auth и persistence требуют отдельной реализации и тестов.
- Export, 3D, video, maps, provider API и research workflows — только когда запрошены и доступны соответствующие tools. Их raw instructions остаются справкой с незавершённым clause audit, а не установленной способностью.

## Приоритет и доказательства

Текущий запрос/системные ограничения и конкретный проект выше этой общей рекомендации. При переносе намерения используй настоящий schema доступного tool; не отключай approval/auth/sandbox/TLS и не изобретай credentials. Полная основа inline в ~/.gemini/GEMINI.md; helpers с model_decision в config/rules и guides читаются по теме. Совместимость mechanism не равна доказательству поведения каждого нынешнего/будущего runtime. Проверка настоящего нового чата без /skill, attachment или подсказки identifier должна выполняться в доступной Antigravity; запиши версию IDE, фактическую модель, запрос, ответ/trace и отдельно доступность модели. Если IDE недоступна, результат — unrun, а не pass.
