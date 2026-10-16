Мансур, ин helper settings-и setup-ро дар profile-и фаъол татбиқ/санҷида мекунад ва ду ислоҳи audit-ро баъди reinstall-и версияҳои маълум нигоҳ медорад.

Дар startup ва баъди тағйироти рӯйхати extensions, check-и кӯтоҳ иҷро мешавад. Коди аллакай ислоҳшуда дигар навишта намешавад. Барои версия ё hash-и ношинос notice мебарояд; коди vendor иваз ё extension хомӯш карда намешавад. Backup пеш аз repair нигоҳ дошта мешавад; syntax ва hash-и натиҷа санҷида мешаванд.

Command Palette:

- **Mansur: Check Antigravity Stability** — танҳо status-ро мехонад.
- **Mansur: Restore Known Extension Fixes** — танҳо ду source-и версия ва hash-и маълумро барқарор мекунад.
- **Mansur: Reconnect MCP (Reload Window)** — аввал panel-и тозаи Manage MCPs-ро мебандад, сипас command-и native-и Antigravity-ро бо интихоби дастии Мансур иҷро мекунад. Window ва language server аз нав кушода мешаванд. Баъди тайёр шудани startup, Manage MCPs-ро аз нав кушо. Хатои дохилии native Refresh бо ин ислоҳ намешавад.

Helper account, model ва credential-ро тағйир намедиҳад. Аз 1.1.0 settings-и идорашавандаи setup-ро дар profile-и фаъоли editor татбиқ ва месанҷад; project settings-ро намеҷунбонад. Check дар process-и ҷудогона бо timeout-и 6 секунд ва як request-и фаъол дар ҳар extension host иҷро мешавад. Window худкор reload намешавад; барои коди нав action-и **Reload Window** танҳо баъди интихоби Мансур кор мекунад.

`onStartupFinished` аз API-и editor истифода мешавад: https://code.visualstudio.com/api/references/activation-events#onStartupFinished

Ҳолатҳои нави vendor бояд алоҳида audit шаванд. Helper барои ҳамаи версияҳои оянда ё ҳамаи ошибкаҳои IDE кафолат намедиҳад.

- **Mansur: Apply and Check Editor Settings** — plan-и setup-ро ба profile-и фаъол татбиқ карда, theme/icons, formatter, Auto Save, caret ва settings-и extension-ҳои дастрасро месанҷад. Global settings-и пешина дар global state-и helper backup мешаванд.

AI ghost text хомӯш мешавад; native IntelliSense ва auto-import фаъол мемонанд. Switch-ҳои махсуси vendor аз configuration schema-и extension-и насбшуда ёфта мешаванд. Unknown setting ҳамчун unavailable сабт мешавад. Ҳар request як бор татбиқ мешавад; rerun-и installer request-и нав месозад. Runtime-и English баъди интихоби ru full restart мехоҳад. Барои забон ҳамаи window-ҳои IDE-ро пурра пӯш ва аз нав кушо; танҳо Reload Window кофӣ нест.
