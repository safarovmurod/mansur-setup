# Design guide — mansur-unified-v1

## Источники и сохранение дизайна

Сначала выясни назначение, аудиторию и обязательные референсы. Прочитай существующий UI и design system, используй доступные Figma/code/assets; screenshots полезны как референс, но не заменяют доступный исходный компонент. Если предоставленный источник недоступен, сообщи конкретно, что не прочитано; не выдумывай его tokens и component inventory. Не реконструируй фирменный логотип по памяти. Если нужного asset нет, обозначь это и используй согласованный placeholder, не выдавая его за оригинал.

В existing UI сохраняй visual vocabulary: typography, цвета, density, spacing, radii, shadows, layout, copywriting, hover/focus, motion. Точные значения реального kit важнее привычного 4/8px grid или defaults MUI/shadcn. Не перестраивай working design при задаче про API/логику. Не копируй vendor-specific internal files и не внедряй .dc.html, <helmet>, @dsCard или custom tools, если проект не использует соответствующий host.

## Новое направление, layout и typography

Для нового дизайна выбирай ясное направление по задаче, а не одинаковый template для всего. Выбор необычной typography или композиции должен улучшать смысл и читабельность. При наличии brand используй его; универсальный запрет Arial/Inter или обязательные gradients из стороннего prompt не имеет приоритета над проектом. Если пользователь просит варианты, дай различимые направления с устойчивыми именами/ID, сохрани предыдущие варианты; не вынуждай выбор для маленькой правки.

Установи иерархию: primary action, заголовки, body, navigation, content groups. Проверяй ширины, alignment, baseline, line height, длину строки, отступы, vertical rhythm и плотность. Используй согласованные tokens и переиспользуй существующие компоненты. Не добавляй пустые секции, фиктивные KPI и декоративные cards ради заполнения экрана. Содержимое, иконки и фотографии должны отвечать задаче и иметь понятное происхождение/условия использования.

## Компоненты, состояния и взаимодействие

Если source задаёт список component families, перечисли его и отслеживай каждую нужную задаче семью; не объявляй произвольный subset полной системой. Документируй сознательное дополнение и отсутствующую семью. Сохраняй public API компонентов и допустимые variants. Проверь normal/hover/focus/disabled, loading/empty/error/success, формы, validation feedback, dialogs и navigation. В interactive prototype реализуй нужные transitions и state; явно отличай fake data, stub calls и mock auth от production backend.

Motion используй с целью, учитывай prefers-reduced-motion. Не делай постоянные отвлекающие эффекты или тяжёлые анимации для простого интерфейса. Для maps, video, 3D, email, decks или документов используй только реально доступный renderer/export pipeline; специальный инструмент из Claude Design не появляется от имени источника. Проверяй export отдельно: рабочий web preview не доказывает корректный PDF/PPTX/email.

## Responsive и accessibility

Проверь desktop и mobile и существенные intermediate размеры. Не обрезай содержимое фиксированной высотой, не скрывай главный action и не допускай горизонтальный overflow без причины. Учитывай длинные строки, кириллицу, реальные изображения и touch targets.

Используй semantic HTML и доступные компоненты выбранной библиотеки: headings, labels, keyboard navigation, visible focus, dialog focus/escape, alt text по смыслу. Проверь contrast, ошибки вне цвета, zoom и reduced motion. Не объявляй accessibility соответствующей стандарту только из-за наличия aria attributes; сообщай, какие проверки выполнены.

## Реальная визуальная проверка

Запусти нужный dev/build workflow, открой результат доступным browser tool/CLI. Сделай actual screenshots и сравни с референсом при согласованном viewport, масштабе, fonts и состоянии. Исправь существенные расхождения и пересними. Проверь interactions, console/runtime errors, broken assets и mobile layout. Screenshot diff полезен, но его число не заменяет смысловую оценку.

Не вызывай dc_write, ready_for_verification, get_design_context или иной tool только потому, что он указан в raw prompt; сначала проверь, есть ли он в этой среде. Разрешённый fallback — существующие файлы, обычный dev server и доступный браузер. Не выдавай статическое чтение guide за тест работающего UI или будущей модели. В отчёте отделяй реализованное, проверенное и недоступное.
