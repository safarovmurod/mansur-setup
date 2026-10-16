# Native agent automation — Setup 2.1.12

The three terminal options in Antigravity IDE 2.5.5 are **Request Review**, **Proceed in Sandbox**, and **Always Proceed**. They are native agent preferences, separate from VS Code's `chat.tools.terminal.autoApprove` command list. Artifact/plan review is another preference: **Always Ask** or **Always Proceed** in the audited build.

The old `safarov` snapshot and its embedded prompt contain seven allowed terminal commands; the current profile retains them and adds `npx tsc --noEmit`. Neither old installer implements these native global terminal/artifact policies. The exported old layout contains 36 UI keys, not the source account's native agent preferences. Consequently the old files alone cannot prove why a particular previous chat had no prompts.

## What installation does

The README bootstrap now invokes `install --auto-approve`. This explicitly requests:

| Native preference | Stored value | Behavior selected in the official UI |
|---|---|---|
| `terminalAutoExecutionPolicySentinelKey` | `Primitive.int32_value = 3` (`EAGER`) | Terminal: Always Proceed |
| `artifactReviewPolicySentinelKey` | `Primitive.int32_value = 2` (`TURBO`) | Artifact review: Always Proceed |
| `permission_grants_global` | Allow `mcp(*)` | General MCP allow; replaces previous MCP Ask/Deny entries |

These records live inside `antigravityUnifiedStateSync.agentPreferences` in `%APPDATA%\Antigravity IDE\User\globalStorage\state.vscdb` (the product's discovered user-data name is used). Topic entries contain a Row whose `value` is another Base64 protobuf. Writing ordinary JSON numbers to `settings.json` would not implement this behavior.

The operation checks the installed IDE version and the SHA-256 of its actual `resources/app/out/main.js`. Only the audited Windows 2.5.5 bundle is accepted. It preserves unrelated preferences, model/account data, non-MCP command/file grants, Secure Mode and sandbox preferences. Project, enterprise and Secure Mode overrides can still require review. Login and account authorization are not supplied by this operation. Selecting Always Proceed means ordinary agent actions can execute without another confirmation; use it only for workflows where that behavior is intended.

The IDE must be closed before writing native preferences. If it is open, installation copies a small runtime outside its temporary checkout and launches a hidden detached Node worker. It waits for a normal shutdown, refuses active WAL/SHM files, then backs up and applies the change. No IDE process is closed or killed. Waiting expires after 24 hours, is not an OS startup task, and does not survive an OS reboot; rerun `automation` if it times out or the machine reboots first. Restart the IDE after the worker records `applied`; use a new chat to pick up the policies.

Queued does **not** mean applied. The JSON status at `%USERPROFILE%\.gemini\config\mansur-setup\automation\status.json` records `waiting`, `applied`, `failed` or `cancelled`. A successful result includes `runtimeVerified: false`: SQLite readback is verified, a live chat is not. `doctor` reports the stored native modes separately.

## Commands and rollback

```powershell
# Apply now, or queue until the IDE closes normally:
node bin/mansur-setup.js automation

# Preview without writing or launching a worker:
node bin/mansur-setup.js automation --dry-run

# Install files while preserving all native approval preferences:
node bin/mansur-setup.js install --skip-permissions

# With IDE closed: use the exact backup directory returned by automation:
node bin/mansur-setup.js automation-restore "C:\Users\YOUR_USER\.gemini\backups\agent-automation-UUID"
```

`--auto-approve` and `--skip-permissions` are mutually exclusive. Bare `install` retains its earlier MCP-only behavior; the README bootstrap opts into native automation explicitly. `permissions` / `permissions-restore` remain MCP-only commands.

Each actual native change creates a private `agent-automation-*` backup containing the previous database, topic and a manifest. Restore changes only the owned terminal/artifact records and MCP grants, preserving later unrelated preferences. Restore also cancels a queued request. Protect these backups: a complete profile database may contain account data; it is never included in the repository or package.

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
- Audited native modules: `agentPreferences/terminalAutoExecutionPolicy.js`, `agentPreferences/artifactReviewPolicy.js`, `agentPreferencesDefaults.js`, `topicUtils.js`, `UssSettingsProvider.js`, `agentPreferencesLifecycle.js`.
- Native enums: `CascadeCommandsAutoExecution.EAGER = 3`, `ArtifactReviewMode.TURBO = 2`.
- Native embedded file descriptor: `exa/unified_state_sync_pb/unified_state_sync.proto`. `Topic.data` → `Row.value` → `Primitive.int32_value` (field 2).

The installer was extracted for static inspection; it was not executed on this Linux host. No vendor bundle or extraction utility is added to the setup package. The unofficial [jkfujinami schemas](https://github.com/jkfujinami/antigravity-grpc-schemas) helped locate the protocol; final keys, enum numbers and encoding were checked against the official bundle itself.

## Executed validation and reproduction

Results recorded on 16 October 2026 in the cloud Linux workspace:

| Check | Result |
|---|---|
| Complete `npm test` | 136 passed, 0 failed, 0 skipped |
| Official-schema / SQLite / detached-worker suite | 4 passed, 0 failed, 0 skipped |
| Portable font staging | 5 scenarios passed |
| Portable bootstrap networking and stale-version rejection | 20 scenarios passed |
| JavaScript syntax and diff whitespace | Passed for changed implementation |

The native suite is separate from the 136-test count. Windows PowerShell 5.1 bootstrap execution and a live authenticated Antigravity chat were not run here.

The README launcher passes `-MinimumVersion 2.1.12`. A stale package is rejected before its installer runs. The bootstrap resolves current `main` once and downloads/extracts that immutable commit; install and Doctor use the same source. The opt-in `test:bootstrap:live` additionally checks the expected version/commit, compares the raw bootstrap with its commit ZIP, installs a disposable full profile twice, and verifies every installed payload hash, including MD, skills, agents and hooks.

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
