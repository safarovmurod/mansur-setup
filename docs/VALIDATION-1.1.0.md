# Validation 1.1.0

Санҷишҳои маҳаллӣ дар Windows, 9 октябри 2026, Node 24.18.0. Санҷиши fixture, CLI ва native IDE сатҳҳои ҷудоанд.

| Санҷиш | Натиҷаи мушоҳидашуда |
|---|---|
| Node suite | 53/53 passed: installer, update/restore, JSONC, Git guards, panel, secrets, rules, permissions, unified ва helper |
| Helper tests дар ду гурӯҳи suite | 12 API/lifecycle mock + 18 filesystem fixture checks; vendor bundles дар repo нестанд |
| Windows PowerShell 5.1 bootstrap | 4/4 scenario: success, install fail, Doctor fail, download fail; source-и як SHA ва cleanup санҷида шуданд |
| Font staging дар PowerShell | 16 SHA тасдиқ; 5 scenario: bundled install, repeat, personal conflict, corrupt bundle, missing font |
| VSIX | 7 ZIP entries бо source ва MIT license мувофиқ; аз Node source боз сохта мешавад |
| Preview-и профили воқеӣ | Existing globals-и бе registry бо source/hash-и маълум қабул шуданд; unknown edit ҳифз мешавад |
| Update-и воқеии профили Мансур | File/config update иҷро шуд; font, browser ва extensions-и аллакай мавҷуд аз нав насб нашуданд |
| Doctor баъди update-и воқеӣ | **65 passed, 0 warnings, 0 failures**; 78 skills, missing 0 |
| Preview-и такрорӣ | Unified changes 0, payload changes 0, obsolete removals 0 |
| Ҳифзи маълумоти ҳозира | Settings ва MCP аз рӯйи маъно пурра бо snapshot баробар; hooks hash бетағйир |
| Source checks | Node syntax ва git diff whitespace checks passed; local README/update/stability links resolve |

Full snapshot-и воқеӣ `setup-backup-pre-install-2026-10-09T04-26-21-582Z` дар private `~/.gemini/backups` монд. Private config, credentials ва raw original archives ба repo нарафтанд.

Bootstrap-и 4-сценария network ва prerequisites-ро mock мекунад; archive extraction ва Node calls воқеӣ мебошанд. Ин натиҷа насби prerequisites дар ҳар компютери дигарро тасдиқ намекунад. Full file/config update-и профили воқеӣ бо skip-и runtime installers иҷро шуд; font/browser/extensions пешакӣ мавҷуд буданд ва Doctor presence/config-и онҳоро хонд.

CI-и Windows/Linux барои ҳар commit дар [GitHub Actions](https://github.com/safarovmurod/mansur-setup/actions) натиҷаи ҷудо дорад. Pending run ҳамчун passed ҳисоб намешавад.

Хатои дохилии native MCP Refresh ислоҳшуда эълон намешавад. Ҳамаи skills, ҳамаи модели AI, account authorization ва live response-и ҳар provider бо presence-и файл тасдиқ намешаванд.
