# Mansur · Antigravity IDE

Конфиги охирини Antigravity-и шеф барои Windows. **Setup 2.1.10.** Settings, MD, skills, agents, hooks, runtime ва **21 extension** бо як команда барқарор мешаванд. Jelly Cursor дар catalog ҳамчун extension-и ихтиёрӣ мемонад. Версияҳои extension дар ҳамин repo нигоҳ дошта мешаванд: **TS MANCHO 3.1.2**, **Mansur Antigravity Stability 1.1.0** ва **Mansur GitHub Panel 1.2.1** ҳам дохиланд.

**[Скачать TS MANCHO 3.1.2 (.vsix)](https://github.com/safarovmurod/mansur-setup/raw/main/extensions/ts-mancho/ts-mancho-3.1.2.vsix)** — насб: Extensions → Install from VSIX. Quiet mode хатҳои сурх/зардро дар тамоми editor ва unused hints-ро дар JS/TS пинҳон мекунад; санҷиши TypeScript фаъол мемонад. Сохтани VSIX аз source: `npm run build:ts-mancho`.

Иловаҳои интихобшудаи 4–5–6: **typing pulse** дар JS/TS бо затухание-и 280 ms; **Auto Save** пас аз 1000 ms пауза; **Format** дар status bar бо formatter-и интихобкардаи editor. Танзимҳо: `tsMancho.typingPulse`, `tsMancho.autoSaveAfterTyping`, `tsMancho.autoSaveDelayMs`, `tsMancho.showFormatButton`. Агар native Auto Save фаъол бошад, delay-и худи editor истифода мешавад.

<a id="quick-start"></a>

## Насб ё update бо як команда

Antigravity IDE-ро кушо → **Terminal → New Terminal → PowerShell**. Ҳамин командаро пурра гузор:

```powershell
& {
  $ErrorActionPreference = 'Stop'
  $ProgressPreference = 'SilentlyContinue'
  [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
  $p = Join-Path $env:TEMP ('mansur-setup-' + [guid]::NewGuid() + '.ps1')
  $url = 'https://raw.githubusercontent.com/safarovmurod/mansur-setup/main/scripts/bootstrap.ps1?t=' + [guid]::NewGuid()
  try {
    $curl = Get-Command curl.exe -ErrorAction SilentlyContinue
    for ($i = 1; $i -le 3; $i++) {
      try {
        Write-Host "Downloading latest bootstrap ($i/3)..."
        if ($curl) {
          & $curl.Source --fail --location --show-error --connect-timeout 20 --max-time 120 --output $p $url
          if ($LASTEXITCODE -ne 0) { throw "curl exited with code $LASTEXITCODE" }
        } else {
          Invoke-WebRequest -UseBasicParsing -Uri $url -OutFile $p -TimeoutSec 120 -ErrorAction Stop
        }
        if (-not (Test-Path -LiteralPath $p -PathType Leaf) -or (Get-Item -LiteralPath $p).Length -eq 0) { throw 'Bootstrap download is empty' }
        break
      } catch {
        if (Test-Path -LiteralPath $p) { Remove-Item -LiteralPath $p -Force }
        if ($i -eq 3) { throw "Bootstrap download failed: $url. $($_.Exception.Message)" }
        Write-Warning "Download failed: $($_.Exception.Message). Retrying..."
        Start-Sleep -Seconds (2 * $i)
      }
    }
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $p -Name "Шеф"
    if ($LASTEXITCODE -ne 0) { throw 'Mansur Setup failed; read the error above.' }
  } finally {
    if (Test-Path -LiteralPath $p) { Remove-Item -LiteralPath $p -Force }
  }
}
```

Команда bootstrap-и охирини `main`-ро бо cache-busting URL мегирад, commit-и ҷориро як бор муайян мекунад ва install + Doctor-ро аз ҳамон commit иҷро мекунад. Setup 2.1.10, TS MANCHO 3.1.2, роҳҳои ислоҳшудаи agent ва hook-ҳои бо quote ба ҳамин download дохиланд. VSIX-и кӯҳна дар архиви ҷорӣ нест; нусхаи кӯҳнаи npm cache истифода намешавад. Node.js ≥24, npm ≥10 ва Git санҷида мешаванд; агар лозим бошад, bootstrap онҳоро бо `winget` насб мекунад. `-Name "Шеф"` танҳо номи log аст. Дар log бояд **Package 2.1.10** ё версияи навтар барояд.

**Агар интернет суст бошад:** download то 3 кӯшиш мекунад. Bootstrap timeout-и 120 сония, ZIP timeout-и 600 сония дорад. Агар сервери ZIP дастнорас бошад, ҳамон commit бо Git аз `github.com` гирифта мешавад. Барои ислоҳи timeout командаи навро аз ҳамин README пурра нусха гир; TLS ва hash-check хомӯш намешаванд.

**Дар насби автоматӣ нестанд:** Pyrefly, Python, Python Debugger, Python Environments, Ruby LSP, GitHub Actions, Go, Gradle for Java, Icon Classes, JetBrains New UI Product Icon Theme, Container Tools, clangd ва Docker. Setup онҳоро насб/нав намекунад; агар пештар насб шуда бошанд, худкор нест намекунад. Docker 2.0.0 ҳам хориҷ шудааст, чун ба Container Tools вобаста аст ва онро аз нав насб мекард. Иконкаҳои интерфейс ба варианти стандартии IDE (`Default`) гузаштанд; Material Icon Theme барои файлҳо мемонад.

Jelly Cursor танҳо ороиши курсор аст ва барои React/TypeScript лозим нест: setup онро худкор насб намекунад. Агар пештар насб шуда бошад, нигоҳ дошта мешавад. Набудани он насби асосӣ ва Doctor-ро қатъ намекунад. Барои agent-browser Chrome/Edge-и мавҷуд истифода мешавад; Chrome танҳо ҳангоми набудани runtime скачат мешавад. Browser дар session ва profile-и муваққатӣ санҷида мешавад.

Пас аз насб **Save кун, ҳамаи window-ҳои Antigravity-ро пурра пӯш ва IDE-ро аз нав кушо**. Барои забони русӣ full restart лозим аст; Reload Window кофӣ нест. Language Pack насб мешавад, `locale: ru` худкор интихоб ва cache-и startup аз translation-файлҳои воқеӣ барқарор мешавад. Қисмҳои махсуси худи Antigravity метавонанд тарҷума надошта бошанд.

**Настройкаҳои extension-и аллакай насбшуда ҳам татбиқ мешаванд.** Helper 1.1.0 plan-и `~/.gemini/config/mansur-setup/editor-profile.json`-ро мехонад ва танзимоти дастгиришавандаро бо API-и editor дар profile-и фаъол менависад: theme/icons, Prettier барои JS/TS/React, Auto Save, font, smooth caret ва typing pulse. Натиҷа дар **Output → Mansur Antigravity Stability** аст. Command-и дастӣ: **Mansur: Apply and Check Editor Settings**. Project override-и мухолиф нишон дода мешавад; settings-и project пинҳонӣ иваз намешавад.

**Подсказкаҳо:** AI inline/ghost text хомӯш; IntelliSense-и оддӣ, keyword-и `const`, номҳои component, path ва auto-import фаъол мемонанд. Helper switch-ҳои autocomplete-и Antigravity/Codeium-ро танҳо аз schema-и extension-и насбшуда ёфта хомӯш мекунад; option-и номавҷуд сохта намешавад.

**MCP:** `docker-mcp` ва `github-mcp-server` дигар илова/скачат намешаванд. Update ин ду entry-ро аз ҳар ду config бо backup мебарорад. GSD, Sequential Thinking ва Chrome DevTools мемонанд.

## Чӣ барқарор мешавад

| Қисм | Конфиги ҳозира | Ҷойи насб |
|---|---|---|
| Editor settings | 220 key, snapshot-и пурра | `%APPDATA%\Antigravity IDE\User\settings.json` |
| Keybindings | 15 binding | `%APPDATA%\Antigravity IDE\User\keybindings.json` |
| Startup / locale | Аргументҳои идорашавандаи ҳозира | `~/.antigravity-ide/argv.json` |
| MD / rules / guides | GEMINI.md, 2 rule, 2 guide | `~/.gemini/GEMINI.md`, `~/.gemini/config/` |
| Skills | 78 skill, 163 file | `~/.gemini/config/skills/` |
| Agents | 64 file | `~/.gemini/config/agents/` |
| Hooks | 43 file | `~/.gemini/antigravity/hooks/` |
| GSD Core | 756 file | `~/.gemini/antigravity/gsd-core/` |
| Runtime scripts / GSD config | 23 script ва 3 profile/manifest | `~/.gemini/antigravity/` |
| Android skill-и иловагӣ | 2 ҷой, ҳар кадом 3 file | `~/.gemini/skills/`, `~/.gemini/antigravity/skills/` |
| MCP runtime | 3 package бо package-lock-и дақиқ | `~/.gemini/config/mcp-runtime/` |
| Extensions | 18 gallery + 3 local; Jelly Cursor ихтиёрӣ | `~/.antigravity-ide/extensions/` |
| Font / browser tooling | JetBrains Mono, agent-browser ва browser runtime | Windows font / npm CLI / browser cache |

Antigravity метавонад дар C:, D: ё диски дигар насб бошад. Installer нусхаи кушодаи IDE, CLI-и PATH, папкаҳои стандартӣ ва registry-и насбро месанҷад; роҳи EXE ва CLI-и дохили `bin`-ро дуруст ҷудо мекунад. Settings ба `APPDATA`, extensions/rules ба home ва download ба `TEMP`-и ҳамон Windows мераванд: IDE дар D: будан settings-ро худсарона аз C: намекӯчонад. Барои portable IDE-и сабтнашуда метавон `ANTIGRAVITY_INSTALL_DIR`-ро ба папкаи IDE таъин кард. Snapshot workspace/project history ё credential-и шефро дарбар намегирад.

## Иҷозатҳои чати Antigravity

Барои `npx tsc --noEmit` дар editor ва agent қоидаи auto-approve илова шудааст. Барои иҷрои ҳамаи командаҳо бе пурсиш дар **Antigravity (Windows) → Settings → Agent → Terminal Command Auto Execution → Always Proceed** интихоб кун; барои бе review гузаштани планҳо **Artifact Review Policy → Always Proceed** интихоб кун. Ин интихобҳо танзимоти худи IDE мебошанд, на TS MANCHO. Онҳо хатарноканд: командаҳои вайронкунанда ҳам метавонанд бе тасдиқ иҷро шаванд. `Deny`-ҳо, policy-и ташкилот ва баъзе тасдиқҳои ҳатмӣ метавонанд боқӣ монанд. Баъди иваз кардани танзимот чати нав кушо. [Agent settings](https://www.antigravity.google/docs/agent-settings) · [Artifact review](https://www.antigravity.google/docs/artifact-review).

## Update ва тозакунии кӯҳнаҳо

Installer пеш аз тағйир backup месозад. Settings ва keybindings пурра ба snapshot-и ҳозира мегузаранд. Файлҳои кӯҳнаи аз ҳамин setup насбшуда бо ownership/hash шинохта, тоза мешаванд. Launcher-ҳои MCP нав мешаванд; token, headers-и authorization ва ҳолати enable/disable нигоҳ дошта мешаванд. TS MANCHO-и кӯҳна аз папкаи фаъол бо backup бароварда мешавад.

Файли шахсии таҳриршуда conflict нишон медиҳад; installer онро пинҳонӣ пок намекунад. `config/migrations/legacy-payload.json` танҳо catalog-и тозакунии setup-и пешина аст — rule-и фаъол ё нусхаи насбшавандаи кӯҳна нест.

```powershell
node bin/mansur-setup.js install --skip-permissions --name "povilitel" --dry-run
node bin/mansur-setup.js doctor
node bin/mansur-setup.js restore --dry-run
```

`--dry-run` нақшаро нишон медиҳад. Барои restore-и воқеӣ `node bin/mansur-setup.js restore` истифода мешавад. Backup дар `~/.gemini/backups/` мемонад.

## Санҷиш

[Аудити Setup 2.1.10: ислоҳҳо, тестҳо ва маҳдудиятҳо](docs/REPOSITORY-AUDIT.md). Doctor акнун файлҳои payload, hooks, keybindings, MCP launcher-ҳо ва extension-ҳои ҳатмиро пурра муқоиса мекунад; набудани қисми ҳатмӣ дигар ҳамчун муваффақият ҳисоб намешавад. Backup-и нав набудани config-и пешина ва rule-ҳои дохили зерпапкаро ҳам барқарор мекунад.

[Отчёти санҷиш ва hash-ҳо](docs/PROFILE-SYNC-REPORT.json) · [CI-и main](https://github.com/safarovmurod/mansur-setup/actions/workflows/setup-checks.yml) · [Inventory](docs/INVENTORY.md)

```powershell
npm.cmd test
npm.cmd run test:bootstrap
npm.cmd run test:bootstrap:network
npm.cmd run test:powershell
```

Санҷиши воқеии се MCP: `npm.cmd ci --prefix resources/mcp-runtime`, баъд `npm.cmd run test:mcp`. Санҷиши download/extract аз GitHub ба profile-и муваққатӣ: `npm.cmd run test:bootstrap:live` (PowerShell 7 лозим). Ин тест насби native Windows, font registration ё тамоми gallery-ро исбот намекунад.

Санҷиши воқеии TS MANCHO дар VS Code: `MANSUR_VSCODE_PATH=/path/to/Code npm run test:ts-mancho:editor`. Барои headless Linux `Xvfb` ё `MANSUR_XVFB_PATH=/path/to/Xvfb` лозим аст. Runner худи VSIX-ро дар profile-и муваққатӣ месанҷад: pulse-и намоён, сабти воқеии файл, click-и Format, quiet decorations ва smooth cursor. Profile-и шахсӣ истифода намешавад.

Doctor файлҳо, versions ва settings-ро месанҷад. Authorization-и MCP, иҷрои ҳамаи workflows ва UI-и ҳар extension санҷиши алоҳида мехоҳанд. Дастрасии gallery/download аз интернет ва Antigravity CLI вобаста аст.

[Rules](docs/UNIFIED-RULES.md) · [Skills](docs/SKILLS.md) · [MCP](docs/MCP_SETUP.md) · [Stability](docs/STABILITY.md) · [Troubleshooting](docs/TROUBLESHOOTING.md) · [License / sources](docs/THIRD_PARTY.md)

## Catalog — 22 extension: 21 ҳатмӣ + Jelly Cursor ихтиёрӣ

Версия ва ID-и дақиқ дар [рӯйхати extension-ҳо](docs/EXTENSIONS.md) ҳаст. 21 extension-и ҳатмӣ бо ҳамон командаи боло насб мешаванд; Jelly Cursor пропуск мешавад.

| Ном | Чӣ кор мекунад |
|---|---|
| HTML End Tag Labels | Номи блокро назди теги пӯшидаи HTML нишон медиҳад. |
| htmltagwrap | Коди интихобшударо дохили HTML tag мегузорад. |
| Tailwind CSS IntelliSense | Барои Tailwind CSS autocomplete ва санҷиши классҳо медиҳад. |
| npm Intellisense | Номи npm package-ҳоро ҳангоми import пешниҳод мекунад. |
| Path Intellisense | Роҳи файл ва папкаҳоро autocomplete мекунад. |
| ES7+ React/Redux/React-Native snippets | Шаблонҳои кӯтоҳи React, JavaScript ва TypeScript медиҳад. |
| Better Comments Next | TODO, warning ва дигар comment-ҳоро бо ранг ҷудо мекунад. |
| Prettier - Code formatter | Кодро автоматӣ формат мекунад. |
| Auto Rename Tag | Номи HTML tag-и ҷуфтро якҷоя иваз мекунад. |
| Jelly Cursor (ихтиёрӣ) | Барои cursor аниматсия ва glow медиҳад; худкор насб намешавад. |
| Image preview | Preview-и расмро дар gutter ва ҳангоми hover нишон медиҳад. |
| TS MANCHO | Хатҳои сурх/зард ва unused hints-ро пинҳон мекунад; санҷиши JS/TS фаъол аст. Typing pulse, Auto Save ва тугмаи Format медиҳад. |
| Mansur Antigravity Stability | Настройкаҳоро дар profile-и фаъол татбиқ/санҷида мекунад ва ду ислоҳи extension-ҳоро нигоҳ медорад. |
| Mansur GitHub Panel | Панели GitHub барои дидани branch, сохтан, гузаштан ва ҳазфи branch медиҳад. |
| Russian Language Pack for Visual Studio Code | Интерфейси editor-ро ба русӣ мегузорад. |
| SQL Server (mssql) | Ба SQL Server пайваст мешавад ва query/schema-ро идора мекунад. |
| Oxc | Oxlint ва Oxfmt-ро барои lint ва format пайваст мекунад. |
| Material Icon Theme | Иконкаҳои файл ва папкаҳоро ба Material Icons мегузорад. |
| Live Server | Сервери маҳаллӣ барои HTML/CSS/JS бо live reload мекушояд. |
| Code Spell Checker | Хатоҳои имлои матн ва номҳои дохили кодро нишон медиҳад. |
| Error Lens | Хато ва warning-ҳоро бевосита назди сатри код нишон медиҳад. |
| Import Cost | Андозаи package-и import/require-шударо назди код нишон медиҳад. |
