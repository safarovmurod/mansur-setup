# Update 1.1.0 — чӣ тағйир ёфт

Муқоиса бо `main`-и пешина, commit `db7c8cc`. Ин ҳуҷҷат файли repo → ҷойи install → сабабро нишон медиҳад. Роҳи Windows аз user-и ҳозира гирифта мешавад.

| Файли repo | Баъди install | Тағйир |
|---|---|---|
| `rules/GEMINI.template.md` | `~/.gemini/GEMINI.md`, блоки setup | Browser барои санҷиши воқеии UI дастрас; priority равшан; project scan танҳо барои кори проект |
| `rules/mansur-02.template.md` | `~/.gemini/config/rules/mansur-02.md` | «Як қадам ва интизорӣ» танҳо барои омӯзиши қадамӣ; full task то натиҷа |
| `rules/mansur-03.template.md` | `~/.gemini/config/rules/mansur-03.md` | Тағйири хурди файли вобаста дар scope иҷозат дорад; `только`/`не трогай` ҳифз мешавад |
| `rules/mansur-01.template.md` | rule-и аввал | Description-и дурусти файли зинда ҳам дар repo нигоҳ дошта шуд |
| `rules/mansur-unified-*.template.md`, `config/mansur-unified/guides/` | 4 unified rules / 3 guides | Версияи нави глобалии ҳозира ба repo гузашт; нусхаи бе registry танҳо бо bytes/hash-и маълум қабул мешавад |
| `skills/mansur-frontend-mentor/SKILL.md` | skill-и глобалии Antigravity | Redux/Zustand/Jotai танҳо бо вазифаи ҳозира ё истифодаи мавҷуда |
| `skills/mansur-frontend-mentor/references/design-and-code.md` | reference-и ҳамон skill | Дархости TS худ аз худ Tailwind/className-ро намедарорад; MUI нигоҳ дошта мешавад |
| `skills/android-cli/` | `~/.gemini/config/skills/android-cli/` | Skill-и 78-ум; SDK/CLI ҳангоми install-и setup насб намешавад |
| `config/skill-inventory.json` | inventory-и дубора сохташуда | 78 bundle; installer skill-и шахсии аллакай насбшударо ҳам дар inventory нигоҳ медорад |
| `extensions/mansur-antigravity-stability/` | `~/.antigravity-ide/extensions/mansur.antigravity-stability-helper-1.0.1` | Helper-и глобалӣ, source ва VSIX-и бозсохташаванда |
| `lib/installer.js`, `lib/owned-files.js` | CLI-и install/update | Backup, ownership, conflict, obsolete cleanup, lock, rollback-и payload |
| `config/migrations/legacy-payload.json` | Танҳо ҳамчун маълумоти migration хонда мешавад | 996 роҳи payload-и пешина; bytes/hash аз 8 commit-и таърихи repo, LF/CRLF |
| `lib/jsonc.js` | Parser-и settings | Comma дар сатри `"a,}"` гум намешавад; object-и `null` merge-ро намешиканад |
| `lib/backup.js` | Backup/restore | Registry нигоҳ дошта мешавад; файли наве, ки дар backup набуд, танҳо бо hash-и owned тоза мешавад |
| `scripts/bootstrap.ps1` | Муҳити муваққатӣ, баъд тоза мешавад | Latest commit → ZIP-и ҳамон SHA → install ва Doctor аз як source; бе cache-и npx |
| `config/settings.json` | Editor settings | Auto Save-и ҳозираи Мансур: `afterDelay`, 1000 ms; status bar-и user маҷбуран иваз намешавад |
| `scripts/package-stability.cjs` | Дар repo мемонад | VSIX аз source бо Node сохта мешавад; ба `~/.gemini/scripts` копия намешавад |
| `extensions/mansur-github-panel/install-github-panel.ps1` | Installer-и panel | CLI дар PATH набошад, fallback ба папкаи Antigravity дигар дар StrictMode намеафтад |

## Барои насби кӯҳна чӣ мешавад?

Ҳамин командаи [README](../README.md) версияи охиринро мегирад. Файлҳои package-и пешина бо catalog-и hash муқоиса мешаванд. Нусхаи аниқ маълум update мешавад; мисол, `~/.gemini/scripts/bootstrap.ps1`-и кӯҳна дигар runtime нест ва танҳо бо hash-и маълум тоза мешавад. Private backup пеш аз тозакунӣ ҳифз мешавад.

Аз 1.1.0 баъд registry ҳамаи роҳҳои payload ва hash-и онҳоро нигоҳ медорад. Дар update-и дигар, файле, ки аз package хориҷ шуд, танҳо агар bytes-и насбшуда дастӣ тағйир наёфта бошанд, тоза мешавад. Файлҳои шахсӣ дар ҳамон папкаҳо нигоҳ дошта мешаванд. Барои папкаи холӣ ҳам `recursive delete` иҷро намешавад.

Файли фаъол дастӣ тағйир дода шуда бошад, `Setup conflict` бо роҳаш мебарояд. Аввал онро нигоҳ дор ва муқоиса кун; installer аз рӯйи тахмин overwrite намекунад. Catalog файлҳои берун аз таърихи ҳамин repo-ро ҳамчун «моли setup» намешиносад.

## Settings, MCP ва permissions

Full install settings-и профилро merge мекунад: theme/font/formatter-и profile метавонанд settings-и ҳамномро иваз кунанд; калидҳои бегона нигоҳ дошта мешаванд. Бо `--skip-permissions` ҳамаи setup settings-и `security.*`, `chat.tools.*`, permission ва autoApprove аз merge хориҷ мешаванд. Bootstrap ҳамин option-ро медиҳад. Live permissions database тағйир намеёбад.

MCP-и фаъол: `~/.gemini/config/mcp_config.json`. Existing entries, env, headers ва auth нигоҳ дошта мешаванд. Templates-и намерасидаи GitHub/GSD/Sequential илова мешаванд; GitHub-и нав disabled ва бе token аст. `$typeName` аз server metadata бардошта мешавад. Config-и legacy дар `~/.gemini/antigravity` ҳифз мешавад; accounts ё tools-и ҷорӣ аз он тахмин карда намешаванд.

Hooks-и user, project code, account/model selection, Chrome/Docker settings ва extensions-и бегона иваз ё тоза намешаванд. Installer ҳамаи extensions-ро forced downgrade намекунад. Repair-и helper барои версия/hash-и ношинос иҷро намешавад.

## Backup ва restore

Full snapshot: `~/.gemini/backups/setup-backup-pre-install-*`. Он метавонад MCP credentials дошта бошад ва бояд шахсӣ монад. Payload backup: `setup-payload-*` — bytes-и пешинаи тағйирот ва cleanup. Helper backup: `stability-helper-*`; patch backup: `antigravity-extension-maintenance`.

`restore` snapshot-и full-ро мехонад. Settings ва файлҳои backup бармегарданд; файли нави registry, ки пеш аз install набуд, танҳо бо hash-и тасдиқшуда тоза мешавад. Файли наве, ки баъд дастӣ тағйир дода шуд, нигоҳ дошта мешавад. Prerequisites, Windows font registration, browser runtime ва installed extensions uninstall намешаванд. Restore-и code/config маънои барқарор шудани тамоми runtime-и Windows-ро надорад.

Rollback-и автоматӣ барои mutation-и payload санҷида шудааст. Install-и font/gallery/browser марҳилаҳои алоҳидаанд: агар онҳо fail шаванд, CLI exit 1 ва сабаб медиҳад; тамоми Windows transaction-и ягона эълон намешавад.

## Чӣ ба repo нарафт?

Token, auth, cookie, account config, raw MCP-и шахсӣ, private backup, chat transcript ва project-и корӣ. Source-и пурраи marketplace extensions аз нав package нашуд. Helper танҳо catalog-и hash ва patch-и хурди санҷидашударо дорад. [Манбаъҳо](THIRD_PARTY.md).
