# Antigravity stability — санҷиш ва маҳдудият

Helper `mansur.antigravity-stability-helper` 1.0.1 дар startup ва баъди тағйири рӯйхати extensions ду catalog entry-ро месанҷад:

| Extension | Версия | Сабаби ислоҳи маҳаллӣ |
|---|---|---|
| HTML End Tag Labels | 1.0.0 | JSX-и ҳангоми навиштан нопурра ба parser error мерасид; SyntaxError нигоҳ дошта мешавад, closed document ва timer ҳифз мешаванд |
| Auto Rename Tag | 0.1.10 | Event-и ҳудуди кӯҳнаи line аз ҳудуди document мебаромад; cache бо document-и ҷорӣ ҳамоҳанг мешавад |

Original ва patched SHA-256 дар `extensions/mansur-antigravity-stability/maintenance.cjs` ҳастанд. Пеш аз repair backup, баъд syntax ва hash санҷида мешаванд. Коди ношинос, update race, symlink/junction, роҳи берун аз extension ва backup conflict repair-ро бозмедоранд. Status command файлро иваз намекунад. Check дар process-и ҷудогона, timeout 6 секунд ва lock барои як repair иҷро мешавад.

Ду ислоҳи vendor бо 32 санҷиши regression дар audit-и маҳаллии 8–9 октябр санҷида шуданд. Дар repo source-и пурраи vendor нашр нашудааст; CI 18 ҳолати filesystem-ро бо fixture-и хурд ва 12 ҳолати helper-ро бо API mock месанҷад. Ин санҷишҳо худ аз худ ҳамаи error-и editor ё ҳамаи версияҳои ояндаро тасдиқ намекунанд.

## MCP Refresh

Дар IDE 2.5.5, stop/restart-и native баъзан GitHub/Docker-ро бо exit 1 қатъ мекунад ва баъзе ё ҳамаи tools нест мешаванд. Counter-и tools ҳам метавонад аз ҳолати воқеӣ қафо монад. Helper ин қисми дохилии app-ро patch намекунад.

**Reconnect MCP** panel-и тозаи `Manage MCPs`-ро пеш аз command-и native-и reload мебандад. Dirty tab ва project tab нигоҳ дошта мешаванд. Action танҳо баъди интихоби user иҷро мешавад. Баъди startup рӯйхати серверҳо ва tools-ро нав санҷ; counter-и кӯҳна кофӣ нест. Refresh-ро пайдарпай ҳамчун «кафолати repair» истифода набар.

Дар audit-и маҳаллӣ охирин санҷиш 5 сервер / 88 tools нишон дод: Chrome 30, Docker 8, GitHub 46, GSD 3, Sequential 1. Ин ҳолати як компютер/аккаунт аст; setup барои ҳар кас 5 server, 88 tool ё MCP authorization ваъда намедиҳад.

[Расмии MCP](https://antigravity.google/docs/mcp) · [Расмии Rules](https://antigravity.google/docs/rules) · [API activation](https://code.visualstudio.com/api/references/activation-events#onStartupFinished).
