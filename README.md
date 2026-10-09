# Mansur Setup · Antigravity IDE

Настройкаҳои Мансур барои Windows 10/11: **78 skills, 35 роли GSD, 23 extension ID, rules, theme, font, browser ва MCP templates**. Версияи setup: **1.1.0**.

Ин профили шахсии Мансур аст. Antigravity ва аккаунтҳоро Google/provider медиҳад; setup модел ё подписка намехарад. [Тағйирот ва ҷойи файлҳо](docs/UPDATE-1.1.0.md).

<a id="quick-start"></a>

## 1. Install ё update — як команда

Antigravity-ро насб кун. Дар он **Terminal → New Terminal → PowerShell** кушо. Ҳамин **як сатр**-ро гузор ва Enter зан:

```powershell
& { $p = Join-Path $env:TEMP ('mansur-setup-' + [guid]::NewGuid() + '.ps1'); try { Invoke-WebRequest -UseBasicParsing -Uri ('https://raw.githubusercontent.com/safarovmurod/mansur-setup/main/scripts/bootstrap.ps1?t=' + [guid]::NewGuid()) -OutFile $p -ErrorAction Stop; & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $p -Name "Мансур"; if ($LASTEXITCODE -ne 0) { throw 'Mansur Setup failed; read the error above.' } } finally { if (Test-Path -LiteralPath $p) { Remove-Item -LiteralPath $p -Force } } }
```

**Барои насби нав ва касе, ки пештар скачать карда буд, ҳамин команда аст.** Дар `-Name "Мансур"` номи худро навишта метавонӣ. Папкаи кӯҳнаро кушодан ё дастӣ файл кӯчондан лозим нест.

Команда:

1. Node.js ≥24, npm ≥10 ва Git-ро месанҷад. Агар набошанд, ба воситаи `winget` насб мекунад; Windows метавонад тасдиқи худро талаб кунад.
2. Commit-и ҳозираи `main`-ро як бор мегирад. Install ва Doctor аз **ҳамон версия** кор мекунанд; package-и кӯҳнаи `npx` истифода намешавад.
3. Пеш аз тағйир backup месозад. Rules, skills, agents, settings, font ва extensions-ро update мекунад.
4. Файли кӯҳнаро танҳо бо роҳ ва hash-и тасдиқшудаи ҳамин setup тоза мекунад. Файли дастӣ тағйирдодаро нигоҳ медорад.
5. Doctor-ро иҷро мекунад ва download-и муваққатиро тоза мекунад.

Ин команда permissions, terminal approvals ва workspace trust-и ҳозираро нигоҳ медорад. `ExecutionPolicy Bypass` танҳо барои process-и ҳамин скрипт аст; сиёсати Windows тағйир намеёбад. Internet лозим аст; хатои download/install пинҳон намешавад.

## 2. Баъди тамом шудан

Дар терминал `Setup files applied` ва натиҷаи `Doctor`-ро бин. Failure бошад, матнашро хон. `100%`-и копияи skills далели омодагии тамоми IDE нест.

Коратро Save кун. Ҳангоми тайёр буданат **Ctrl+Shift+P → Developer: Reload Window**-ро интихоб кун ва AI-чати нав кушо. Setup IDE-ро худкор намебандад.

Command Palette:

- **Mansur: Check Antigravity Stability** — status-и ду extension.
- **Mansur: Restore Known Extension Fixes** — repair-и версияҳои аниқ санҷидашуда.
- **Mansur: Reconnect MCP (Reload Window)** — panel-и тозаи Manage MCPs-ро мебандад ва reload-и native-ро бо интихоби дастии ту иҷро мекунад.

Helper **HTML End Tag Labels 1.0.0** ва **Auto Rename Tag 0.1.10**-ро танҳо бо hash-и маълум ислоҳ мекунад. Версияи нав ё коде, ки фарқ мекунад, нигоҳ дошта мешавад.

**Маҳдудияти MCP:** native Refresh/reload дар Antigravity IDE 2.5.5 баъзан серверҳоро дуруст боз оғоз намекунад. Setup ин хатои дохилии Google-ро ислоҳ намекунад. [Далел ва санҷиш](docs/STABILITY.md). GitHub token ва иҷозати аккаунт барои ҳар кас алоҳидаанд.

## 3. Файлҳо ба куҷо мераванд?

| Чӣ | Ҷой дар Windows |
|---|---|
| Editor settings / keybindings | `%APPDATA%\Antigravity IDE\User` |
| Locale / argv | `%USERPROFILE%\.antigravity-ide\argv.json` |
| Дастури асосии AI | `%USERPROFILE%\.gemini\GEMINI.md` |
| Rules / skills / agents | `%USERPROFILE%\.gemini\config\rules`, `skills`, `agents` |
| MCP-и фаъол | `%USERPROFILE%\.gemini\config\mcp_config.json` |
| Рӯйхати файлҳо ва hash | `%USERPROFILE%\.gemini\config\mansur-setup\.installation.json` |
| GSD / runtime scripts | `%USERPROFILE%\.gemini\antigravity\gsd-core`, `%USERPROFILE%\.gemini\scripts` |
| Extensions | `%USERPROFILE%\.antigravity-ide\extensions` |
| Font | `%LOCALAPPDATA%\Microsoft\Windows\Fonts` ва HKCU-и user |
| Backup-и шахсӣ | `%USERPROFILE%\.gemini\backups` |

Номи Windows дастӣ иваз намешавад. Аккаунт, model selection, auth, token, cookie ва проектҳо ба GitHub фиристода намешаванд. Existing MCP entries ва credentials нигоҳ дошта мешаванд; metadata-и нодурусти `$typeName` бардошта мешавад ва templates-и намерасида илова мешаванд. Chrome/Docker-и шахсии ту аз рӯйхати repo ҳисоб намешаванд.

<a id="troubleshooting"></a>

## 4. Update conflict диҳад

`Setup conflict`: файл дастӣ тағйир дода шудааст ё нусхаи пешинаи маълум буданаш тасдиқ нашуд. Installer пеш аз overwrite меистад ва роҳашро нишон медиҳад. Копияашро нигоҳ дор, фарқашро муқоиса кун ва баъд версияи лозимро интихоб кун.

`Preserved edited old file`: файли кӯҳнаи тағйирдода нигоҳ дошта шуд. Папкаи шахсӣ ё extension-и бегона аз рӯйи тахмин тоза намешавад. Lock-и process-и дигар ҳифз мешавад; lock-и process-и хомӯшшударо installer худаш мебардорад. Lock-и вайронро дастӣ санҷидан лозим аст.

## 5. Барои папкаи скачатькардашуда

Дар папкае, ки `package.json` дорад:

```powershell
# Танҳо нақша; файли глобалӣ тағйир намеёбад.
node bin/mansur-setup.js install --skip-permissions --name "Мансур" --dry-run
# Install/update аз ҲАМИН папка. Барои версияи охирин командаи қисми 1-ро истифода кун.
node bin/mansur-setup.js install --skip-permissions --name "Мансур"
# Санҷиши файлҳо/settings; live MCP ё ҷавоби AI-ро тасдиқ намекунад.
node bin/mansur-setup.js doctor
```

Фақат unified rules/guides лозим бошад: `node bin/mansur-setup.js install --rules-only`. Ин режим ҳамаи 78 skills ва helper-ро update намекунад.

<a id="restore"></a>
<a id="full-backup"></a>

## 6. Backup ва restore

Дар папкаи repo:

```powershell
node bin/mansur-setup.js restore --dry-run
node bin/mansur-setup.js restore
node bin/mansur-setup.js unified-restore
```

Full restore settings ва файлҳои backup-ро бармегардонад. Prerequisites, font, browser runtime ва gallery extensions-ро uninstall намекунад. `unified-restore` фақат амали охирини unified rules/guides-ро бармегардонад. Backup метавонад credentials дошта бошад: онро нашр накун. [Тафсилот](docs/UPDATE-1.1.0.md).

## 7. Санҷиш барои developer

```powershell
npm.cmd test
npm.cmd run test:powershell
npm.cmd run build:stability
```

Dependency-и npm барои installer ва сохтани helper лозим нест. [Натиҷаҳои версияи 1.1.0](docs/VALIDATION-1.1.0.md).

[Skills](docs/SKILLS.md) · [Extensions](docs/EXTENSIONS.md) · [MCP](docs/MCP_SETUP.md) · [Rules](docs/UNIFIED-RULES.md) · [Манбаъ ва license](docs/THIRD_PARTY.md) · [Справочники пешина](docs/PROFILE-REFERENCE.md)
