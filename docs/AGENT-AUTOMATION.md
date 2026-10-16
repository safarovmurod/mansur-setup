# Native agent automation and quiet AI completion — Setup 2.1.13

The three terminal options in Antigravity IDE 2.5.5 are **Request Review**, **Proceed in Sandbox**, and **Always Proceed**. They are native agent preferences, separate from VS Code's `chat.tools.terminal.autoApprove` command list. Artifact/plan review is another preference: **Always Ask** or **Always Proceed** in the audited build.

The old `safarov` snapshot and its embedded prompt contain seven allowed terminal commands; the current profile retains them and adds `npx tsc --noEmit`. Neither old installer implements these native global terminal/artifact policies. The exported old layout contains 36 UI keys, not the source account's native agent preferences. Consequently the old files alone cannot prove why a particular previous chat had no prompts.

## What installation does

The README bootstrap invokes `install --auto-approve`. It selects the chat policies below and disables automatic AI completion and next-edit previews:

| Native preference | Stored value | Behavior selected in the official UI |
|---|---|---|
| `terminalAutoExecutionPolicySentinelKey` | `Primitive.int32_value = 3` (`EAGER`) | Terminal: Always Proceed |
| `artifactReviewPolicySentinelKey` | `Primitive.int32_value = 2` (`TURBO`) | Artifact review: Always Proceed |
| `permission_grants_global` | Allow `mcp(*)` | General MCP allow; replaces previous MCP Ask/Deny entries |
| `tabEnabled` | `Primitive.int32_value = 1` (`OFF`) | Native AI Tab completion off |
| `tabToJump` | `Primitive.int32_value = 2` (`DISABLED`) | Native Tab-to-jump off |

The chat records live in `antigravityUnifiedStateSync.agentPreferences`; the two Tab records live in `antigravityUnifiedStateSync.tabPreferences`. Both topics are in `%APPDATA%\Antigravity IDE\User\globalStorage\state.vscdb` (the product's discovered user-data name is used). Topic entries contain a Row whose `value` is another Base64 protobuf. These Tab modes are enum values encoded as `int32`, not Boolean editor settings. Writing ordinary JSON numbers to `settings.json` would not implement these native preferences.

`editor.inlineSuggest.enabled: false` is also applied globally, to all existing language override selectors and to the managed JS/TS selectors. It suppresses transparent inline/ghost text but does not control the separate native Tab preference. This is why checking only that JSON setting was insufficient. The `quiet-completion` command applies both layers without touching the agent-preferences topic: existing terminal, artifact and MCP approvals stay byte-for-byte unchanged. It replaces the active helper's desired plan with only the quiet-completion keys, preventing an old plan from reapplying chat settings. Variable names, JS/TS auto-imports and file/path IntelliSense remain enabled by the managed profile. The helper reports detected project overrides as `needs-attention`; it does not change the project. Detection covers managed selectors and JS/TS; a project-only override for another language can require manual inspection. Native Tab OFF is independent of that editor setting.

Red struck-out lines can belong to an automatic next-edit preview or to a diff produced by an explicit chat request. A screenshot alone does not establish which subsystem produced them. Quiet completion disables automatic AI suggestions; it does not hide review diffs or stop the chat agent from making requested changes.

The operation checks the installed IDE version and the SHA-256 of its actual `resources/app/out/main.js`. Only the audited Windows 2.5.5 bundle is accepted. It preserves unrelated preferences, model/account data, non-MCP command/file grants, Secure Mode and sandbox preferences. Project, enterprise and Secure Mode overrides can still require review. Login and account authorization are not supplied by this operation. Selecting Always Proceed means ordinary agent actions can execute without another confirmation; use it only for workflows where that behavior is intended.

The IDE must be closed before writing native preferences. If it is open, installation copies a small runtime outside its temporary checkout and launches a hidden detached Node worker. It waits for a normal shutdown, refuses active WAL/SHM files, then backs up and applies the change. No IDE process is closed or killed. Waiting expires after 24 hours, is not an OS startup task, and does not survive an OS reboot; rerun `quiet-completion` or `automation`, matching the intended scope, if it times out or the machine reboots first. Restart the IDE after the worker records `applied`; use a new chat to pick up changed chat policies.

Queued does **not** mean applied. Each request has its own protocol-2 JSON status at `%USERPROFILE%\.gemini\config\mansur-setup\automation-v2\status-<requestId>.json`, recording `waiting`, `applied`, `failed` or `cancelled`. Use the exact `statusFile` path printed by the command; there is no shared `status.json` for new requests. Separate status files prevent an older worker from overwriting a newer request's result. The separate `automation-v2` directory also prevents a previously loaded 2.1.12 worker from consuming the new request format. A successful result includes `runtimeVerified: false`: SQLite readback is verified, the user's live UI and chat are not. `doctor` reports the stored native modes separately.

## Commands and rollback

```powershell
# Disable native AI Tab/next-edit and transparent ghost text only:
node bin/mansur-setup.js quiet-completion

# Equivalent npm command:
npm.cmd run quiet-completion

# Preview completion-only changes without writing or launching a worker:
node bin/mansur-setup.js quiet-completion --dry-run

# Apply chat automation and quiet native completion, or queue until IDE closes:
node bin/mansur-setup.js automation

# Preview without writing or launching a worker:
node bin/mansur-setup.js automation --dry-run

# Install files while preserving all native approval preferences:
node bin/mansur-setup.js install --skip-permissions

# With IDE closed: use the exact backup directory returned by automation:
node bin/mansur-setup.js automation-restore "C:\Users\YOUR_USER\.gemini\backups\agent-automation-UUID"
```

`--auto-approve` and `--skip-permissions` are mutually exclusive. Bare `install` retains its earlier MCP-only behavior for chat approvals and now also disables native AI Tab; it does not select the global terminal/artifact policies. The README bootstrap opts into those chat policies explicitly with `--auto-approve`. `permissions` / `permissions-restore` remain MCP-only commands.

The README also contains a one-command fresh download with the bootstrap switch `-QuietCompletion`. It resolves and downloads the current commit, enforces `-MinimumVersion 2.1.13`, then runs the completion-only command instead of a full install. It does not reapply chat approvals, extensions, rules or the full editor profile. The normal README bootstrap without this switch still runs the full setup with `--auto-approve`.

Each actual native change creates a private `agent-automation-*` backup containing the previous database, original managed topic values and a format-2 manifest. Restore is scoped to the topics and fields owned by that operation. A completion-only backup restores only the two Tab records; an all-mode backup can restore those records plus the owned terminal/artifact records and MCP grants. Later unrelated preferences are preserved, including the distinction between an absent topic and an originally empty one. Old format-1 backups remain supported and restore only the old agent-preferences scope, leaving Tab preferences untouched. Restore also cancels a queued request. This native rollback does not restore the separate `settings.json` edit; user settings have their own backup. Protect these backups: a complete profile database may contain account data; it is never included in the repository or package.

## Compatible features retained from the old setup

- Managed editor settings override the same managed keys while unrelated personal keys remain.
- Personal watcher/search exclusions and explicit terminal command denials remain. The active-profile helper receives the preserved command list too.
- Managed keybindings replace conflicting managed slots while unrelated shortcuts remain. Doctor checks that managed bindings are present.
- The status bar is explicitly visible, supporting TS MANCHO's Format button.

The old inline suggestion extension, 5/15-second timers, Jelly effects, Runtime Monitor and AI Structure Reviewer are not reintroduced. They either contradict the current quiet completion profile or need a separate complete runtime audit. This change does not silently enable missing extensions or replace the current frontend stack.

## Source evidence

The official installer was retrieved via HTTPS from Google's download host:

`https://dl.google.com/edgedl/release2/j0qc3/antigravity/stable/2.5.5-4923483625488384/windows-x64/Antigravity%20IDE.exe`

- Installer SHA-256: `a8c25631fd5e43bf217a6cf510ca796441817f4ad9c50b1d892282c7366edc4a`, matching `safarov`'s pinned source manifest.
- Extracted native `out/main.js` SHA-256: `6f1a12099ac635d462bd7092357119ec1ec7516988cacb874b7e97691272b104`.
- Audited native modules include `agentPreferences/terminalAutoExecutionPolicy.js`, `agentPreferences/artifactReviewPolicy.js`, `agentPreferencesDefaults.js`, `tabPreferencesDefaults.js`, `topicUtils.js`, `UssSettingsProvider.js`, and the preference-topic lifecycles.
- Native enums: `CascadeCommandsAutoExecution.EAGER = 3`, `ArtifactReviewMode.TURBO = 2`; Tab disabled values are `tabEnabled = OFF (1)` and `tabToJump = DISABLED (2)`.
- Native embedded file descriptor: `exa/unified_state_sync_pb/unified_state_sync.proto`. `Topic.data` → `Row.value` → `Primitive.int32_value` (field 2).

The installer was extracted for static inspection; it was not executed on this Linux host. No vendor bundle or extraction utility is added to the setup package. The unofficial [jkfujinami schemas](https://github.com/jkfujinami/antigravity-grpc-schemas) helped locate the protocol; final keys, enum numbers and encoding were checked against the official bundle itself.

## Executed validation and reproduction

Setup 2.1.13 checks completed on 16 October 2026 in the cloud Linux workspace:

| Check | Result |
|---|---|
| Complete `npm test` | 147 passed, 0 failed, 0 skipped |
| Official-schema / SQLite / detached-worker suite | 11 passed, 0 failed, 0 skipped |
| Portable bootstrap networking and stale-version rejection | 22 scenarios passed |

The native suite is separate from the 147-test count. These tests use disposable profiles and fixtures on Linux, including the actual audited native protobuf descriptors. They are not a test of the user's live Windows UI or authenticated Antigravity chat. The final run includes the per-request status-file changes. Published-download verification is still pending; a local test pass does not prove that GitHub serves the new version. The release verification record will be `docs/QUIET-COMPLETION-VERIFICATION.json` once the published source has been tested.

The older [2.1.12 published-verification report](PUBLISHED-VERIFICATION.json) remains a historical baseline for its recorded commit, not evidence for 2.1.13.

The 2.1.13 README launcher passes `-MinimumVersion 2.1.13`. A stale package is rejected before its installer runs. The bootstrap resolves current `main` once and downloads/extracts that immutable commit; install and Doctor use the same source. The opt-in `test:bootstrap:live` additionally checks the expected version/commit, compares the raw bootstrap with its commit ZIP, installs a disposable full profile twice, and verifies every installed payload hash, including MD, skills, agents and hooks. The linked [published-verification report](PUBLISHED-VERIFICATION.json) records the release and commit it actually tested; it is not evidence for a later untested commit.

`npm test` covers native policy merging, malformed/duplicate row rejection, scoped restore, waiting/timeout behavior, preservation of settings/denials/shortcuts, and the existing installer/profile/extension suites.

The additional native integration suite requires the official audited `out/main.js` and an isolated protobuf decoder installation, not a mocked marker file:

```sh
npm install --prefix /tmp/antigravity-protobuf-qa --ignore-scripts --package-lock=false \
  --cache /workspace/.npm-cache @bufbuild/protobuf@2.9.0
MANSUR_ANTIGRAVITY_MAIN='/path/to/official/resources/app/out/main.js' \
MANSUR_PROTOBUF_RUNTIME=/tmp/antigravity-protobuf-qa/node_modules/@bufbuild/protobuf \
  npm run test:automation:native
```

This suite decodes generated preferences with the actual official embedded Topic/Primitive descriptors, writes/reads/restores disposable SQLite profiles, checks repeatability and private-row preservation, rejects a changed native bundle, and rolls back if the IDE restarts. On Linux it also starts a real detached worker with a simulated `tasklist.exe` and verifies the database remains unchanged while the simulated IDE is open, then changes after shutdown. This is not a native Windows process test or an authenticated Antigravity chat test.

The actual user's account, live chat prompts, enterprise/project overrides and Windows worker lifecycle remain unverified here. An updated checkout or saved code is not proof that the user's installed IDE has applied the change.
