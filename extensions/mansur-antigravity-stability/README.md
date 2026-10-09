Мансур, ин helper ду ислоҳи audit-ро баъди reinstall-и версияҳои маълум нигоҳ медорад.

Дар startup ва баъди тағйироти рӯйхати extensions, check-и кӯтоҳ иҷро мешавад. Коди аллакай ислоҳшуда дигар навишта намешавад. Барои версия ё hash-и ношинос notice мебарояд; коди vendor иваз ё extension хомӯш карда намешавад. Backup пеш аз repair нигоҳ дошта мешавад; syntax ва hash-и натиҷа санҷида мешаванд.

Command Palette:

- **Mansur: Check Antigravity Stability** — танҳо status-ро мехонад.
- **Mansur: Restore Known Extension Fixes** — танҳо ду source-и версия ва hash-и маълумро барқарор мекунад.
- **Mansur: Reconnect MCP (Reload Window)** — аввал panel-и тозаи Manage MCPs-ро мебандад, сипас command-и native-и Antigravity-ро бо интихоби дастии Мансур иҷро мекунад. Window ва language server аз нав кушода мешаванд. Баъди тайёр шудани startup, Manage MCPs-ро аз нав кушо. Хатои дохилии native Refresh бо ин ислоҳ намешавад.

Helper project, account, model, credential ва settings-ро намехонад ё тағйир намедиҳад. Check дар process-и ҷудогона бо timeout-и 6 секунд ва як request-и фаъол дар ҳар extension host иҷро мешавад. Window худкор reload намешавад; барои коди нав action-и **Reload Window** танҳо баъди интихоби Мансур кор мекунад.

`onStartupFinished` аз API-и editor истифода мешавад: https://code.visualstudio.com/api/references/activation-events#onStartupFinished

Ҳолатҳои нави vendor бояд алоҳида audit шаванд. Helper барои ҳамаи версияҳои оянда ё ҳамаи ошибкаҳои IDE кафолат намедиҳад.
