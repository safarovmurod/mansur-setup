import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const { runInstaller } = require('../lib/installer.js');
const { runDoctor } = require('../lib/doctor.js');
const { restoreBackup, listBackups } = require('../lib/backup.js');
const { getEnvironmentPaths } = require('../lib/paths.js');

test('Installer end-to-end in isolated environment with spaces in path', (t) => {
  const tempBase = path.join(os.tmpdir(), `mansur-test-suite-${Date.now()}`);
  const userProfile = path.join(tempBase, 'User Profile With Spaces');
  const appData = path.join(userProfile, 'AppData', 'Roaming');
  const localAppData = path.join(userProfile, 'AppData', 'Local');

  fs.mkdirSync(appData, { recursive: true });
  fs.mkdirSync(localAppData, { recursive: true });

  const customRoots = { userProfile, appData, localAppData };
  const envPaths = getEnvironmentPaths(customRoots);

  t.after(() => {
    try {
      fs.rmSync(tempBase, { recursive: true, force: true });
    } catch (_) {}
  });

  // 1. Dry Run test
  const dryLogs = [];
  const dryResult = runInstaller({
    displayName: 'TestUser',
    dryRun: true,
    skipExtensions: true,
    customRoots,
    repoRoot,
    log: (msg) => dryLogs.push(msg),
  });

  assert.equal(dryResult.success, true);
  assert.equal(fs.existsSync(envPaths.settingsJson), false, 'Dry run should not create settings.json');

  // 2. Pre-create foreign user setting to test preservation
  const userSettingsDir = path.dirname(envPaths.settingsJson);
  fs.mkdirSync(userSettingsDir, { recursive: true });
  fs.writeFileSync(
    envPaths.settingsJson,
    JSON.stringify({ 'user.customSetting': 'MUST_BE_PRESERVED', 'editor.fontSize': 12 }, null, 2),
    'utf8'
  );

  // 3. Clean Installation test
  const installLogs = [];
  const installResult = runInstaller({
    displayName: 'Алишер',
    dryRun: false,
    skipExtensions: true,
    customRoots,
    repoRoot,
    log: (msg) => installLogs.push(msg),
  });

  assert.equal(installResult.success, true);
  assert.equal(fs.existsSync(envPaths.settingsJson), true, 'settings.json should exist');
  assert.equal(fs.existsSync(envPaths.keybindingsJson), true, 'keybindings.json should exist');
  assert.equal(fs.existsSync(envPaths.argvJson), true, 'argv.json should exist');

  // Verify preserved user setting
  const appliedSettings = JSON.parse(fs.readFileSync(envPaths.settingsJson, 'utf8'));
  assert.equal(appliedSettings['user.customSetting'], 'MUST_BE_PRESERVED', 'Foreign setting preserved');
  assert.equal(appliedSettings['editor.formatOnSave'], true, 'formatOnSave applied');
  assert.equal(appliedSettings['jellyCursor.rippleEnabled'], false, 'jelly ripple disabled');
  assert.equal(appliedSettings['editor.cursorSmoothCaretAnimation'], 'on', 'smooth cursor enabled');

  // Verify displayName replacement in rules
  const rule01Path = path.join(envPaths.geminiRulesDir, 'mansur-01.md');
  assert.equal(fs.existsSync(rule01Path), true, 'mansur-01.md should be created');
  const rule01Content = fs.readFileSync(rule01Path, 'utf8');
  assert.ok(rule01Content.includes('Алишер'), 'Rule 01 should contain the custom displayName');
  assert.equal(rule01Content.includes('{{DISPLAY_NAME}}'), false, 'Placeholder should be replaced');

  // Verify skills deployment
  assert.equal(fs.existsSync(path.join(envPaths.geminiSkillsDir, 'mansur-practice', 'SKILL.md')), true);
  assert.equal(fs.existsSync(path.join(envPaths.geminiSkillsDir, 'vercel-react-best-practices', 'SKILL.md')), true);

  // Verify scripts deployment
  assert.equal(fs.existsSync(path.join(envPaths.geminiScriptsDir, 'practice-engine.mjs')), true);

  // 4. Repeated Install (Idempotency) test
  const repeatResult = runInstaller({
    displayName: 'Алишер',
    dryRun: false,
    skipExtensions: true,
    customRoots,
    repoRoot,
    log: () => {},
  });
  assert.equal(repeatResult.success, true);

  const keybindings = JSON.parse(fs.readFileSync(envPaths.keybindingsJson, 'utf8'));
  const formatBindings = keybindings.filter(k => k.command === 'editor.action.formatDocument');
  assert.equal(formatBindings.length, 1, 'Keybindings should not contain duplicates on repeat install');

  // 5. Backup & Restore test
  const backups = listBackups(envPaths);
  assert.ok(backups.length >= 1, 'At least one backup must be created');

  // Mutate settings and restore
  appliedSettings['editor.formatOnSave'] = false;
  fs.writeFileSync(envPaths.settingsJson, JSON.stringify(appliedSettings, null, 2), 'utf8');
  assert.equal(JSON.parse(fs.readFileSync(envPaths.settingsJson, 'utf8'))['editor.formatOnSave'], false);

  const restoreRes = restoreBackup(backups[0].path, envPaths);
  assert.ok(restoreRes.restored.length > 0);
  const restoredSettings = JSON.parse(fs.readFileSync(envPaths.settingsJson, 'utf8'));
  assert.equal(restoredSettings['editor.formatOnSave'], true, 'formatOnSave restored to true');

  // 6. Doctor check
  const doctorLogs = [];
  const docRes = runDoctor({ customRoots, log: (m) => doctorLogs.push(m) });
  assert.ok(docRes.checks.length > 5, 'Doctor should run multiple checks');
});
