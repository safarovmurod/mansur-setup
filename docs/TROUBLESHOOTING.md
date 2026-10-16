# Агар setup хато диҳад

[Командаи асосӣ](../README.md#quick-start) ҳар stage-ро дар terminal нишон медиҳад. `Mansur Setup failed` танҳо натиҷаи охир аст; сабаби аниқ дар чанд сатри болояш меояд. Баъди ислоҳи сабаб ҳамон командaро аз нав иҷро кун. Installer пеш аз навиштани профил backup месозад.

| Хато | Санҷиши аввал |
|---|---|
| `winget is unavailable` ё Node/npm/Git версияи паст | Node.js ≥24, npm ≥10 ва Git-ро насб кун; terminal-ро аз нав кушо. |
| Download/HTTP error | Пайвасти GitHub ва gallery-ро санҷ. Bootstrap бояд `main` commit-ро гирифта тавонад. |
| `Время ожидания операции истекло`, `curl exited with code 28` дар bootstrap | Командаи навро аз README пурра гир ва иҷро кун: Setup 2.1.9 timeout, 3 кӯшиш ва fallback-и Git дорад. Командаи кӯҳнаи аз chat/history гирифташударо истифода набар. Агар боз нашуд, аз `Mansur Setup stage` то error-и охир log-ро фирист; `Mansur Setup failed` танҳо натиҷа аст. Барои ин download `raw.githubusercontent.com`, `codeload.github.com` ё fallback-и `github.com` бояд дастрас бошанд. |
| `Antigravity CLI missing` | Antigravity IDE-ро насб ва CLI-и онро санҷ; extension-ҳо бе CLI ба ҳисоб намераванд. |
| `Antigravity IDE not found` ё portable насби D: | IDE-ро кушо ва командаи setup-ро такрор кун. Барои папкаи сабтнашуда `$env:ANTIGRAVITY_INSTALL_DIR = 'D:\Apps\Antigravity IDE'` гузор; роҳи воқеии худатро истифода бар. |
| `Setup conflict` | Роҳи нишондодаро бо backup муқоиса кун. Файли дастӣ тағйирдода худкор overwrite намешавад. |
| `Unexpected end of JSON input` дар setup-и кӯҳна | Командаи асосиро аз нав иҷро кун: Setup 2.1.3 config-и холӣ/whitespace/BOM-ро бо backup иваз мекунад. Агар JSON воқеан нопурра бошад, паёми нав роҳи дақиқи файлро нишон медиҳад ва профилро тағйир намедиҳад. |
| `Invalid JSON in "..."` ё `JSONC parse error in "..."` | Танҳо файли нишондодаро ислоҳ кун ва setup-ро такрор кун. Нусхаи аслиро нигоҳ дор; файлҳои дигарро кӯр-кӯрона тоза накун. Registry-и `.installation.json` маълумоти насби пешинаро дорад ва config-и ихтиёрии холӣ ҳисоб намешавад. |
| Font hash mismatch | Файли bundled ё download нодуруст аст; package-и навро аз repo гир. Hash check-ро хомӯш накун. |
| Docker/MCP connection error | `docker ps` ва status-и server-ро санҷ; [MCP guide](MCP_SETUP.md). Таърифи config далели пайваст нест. |
| TS MANCHO ё local VSIX registration failed | Натиҷаи `--list-extensions --show-versions` ва stage-и install-ро санҷ; [рӯйхати extension-ҳо](EXTENSIONS.md). |
| `iranon.jelly-cursor@0.0.8 not found` ё `Extension failed: iranon.jelly-cursor` | Командаи умумиро аз нав иҷро кунед: Setup 2.1.8 Jelly Cursor-ро ҳамчун ороиши ихтиёрӣ пропуск мекунад. Он барои React/TypeScript лозим нест; дигар 21 extension ва настройкаҳо насб/санҷида мешаванд. Doctor набудани онро ҳамчун optional нишон медиҳад. Хатои extension-и ҳатмӣ ҳамоно failure аст. |
| Chrome download timeout дар `[9/10]` | Setup 2.1.4 Chrome/Edge-и насбшуда ё cache-и тайёрро истифода мебарад. Browser бояд саҳифаи санҷиширо дар session-и ҷудогона кушода ва пӯшонда тавонад. Агар browser набошад, download ҳамоно лозим аст. Defaults-и browser пеш аз тағйир backup мешаванд. |

PowerShell агар `npx.ps1`-ро манъ кунад, командаи асосии README ин мушкилро надорад: он `powershell.exe -ExecutionPolicy Bypass`-ро танҳо барои bootstrap истифода мебарад. Барои command-и npm дастӣ `npm.cmd`/`npx.cmd`-ро интихоб кун; сиёсати умумии Windows-ро дигар кардан лозим нест.

Барои дидани нақша бе тағйир, дар папкаи repo `node bin/mansur-setup.js install --skip-permissions --dry-run`-ро иҷро кун. Барои санҷиши файлу settings `node bin/mansur-setup.js doctor`; барои rollback аввал `node bin/mansur-setup.js restore --dry-run`. Backup-и дорои credential-ро нашр накун.

| Ҳолат | Чӣ бояд кард |
|---|---|
| Language Pack насб аст, интерфейс English монд | Setup 2.1.8-ро иҷро кун; `locale: ru` интихоб ва startup cache-и translation санҷида/барқарор мешавад. Save кун, **ҳамаи window-ҳои IDE-ро пурра пӯш ва аз нав кушо**. Reload Window барои забон кофӣ нест. Runtime language дар Output-и helper санҷида мешавад. |
| Extension насб аст, настройка фаъол нест | Setup-ро аз нав иҷро кун ва helper 1.1.0-ро бо restart бор кун. **Mansur: Apply and Check Editor Settings** profile-и фаъолро танзим мекунад. `needs-attention` ва workspace override-ро дар Output бин. |
| `docker-mcp` / `github-mcp-server`: executable docker not found | Setup 2.1.8 ин ду entry-ро аз ҳар ду config бо backup тоза мекунад. Барои profile-и ҳозира Docker лозим нест. |
| AI ghost text дар editor | `editor.inlineSuggest.enabled: false` дар global ва JS/TS language overrides татбиқ мешавад. Native IntelliSense ва auto-import фаъол мемонанд. Барои switch-ҳои махсуси Antigravity, helper танҳо configuration-и воқеан сабтшудаи IDE-ро истифода мебарад. |
