import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { ensureJetBrainsMono } = require('../lib/font');
const { runInstaller } = require('../lib/installer');
const { installExtension } = require('../lib/extensions');
const root = path.resolve(import.meta.dirname, '..');

test('Font preview and unsupported platform never start download or change system files', () => {
  const never = () => { throw new Error('Unexpected process launch'); };
  const messages = [];
  const preview = ensureJetBrainsMono({ platform: 'win32', dryRun: true, run: never, log: line => messages.push(line) });
  assert.equal(preview.dryRun, true);
  assert.equal(preview.installed, false);
  assert.match(messages.join('\n'), /16 verified TTFs/);
  const unsupported = ensureJetBrainsMono({ platform: 'linux', run: never });
  assert.equal(unsupported.skipped, true);
  assert.equal(unsupported.installed, false);
});

test('Font Windows process contract streams output and rejects failed verification/launch', () => {
  let calls = 0;
  const result = ensureJetBrainsMono({ platform: 'win32', log: () => {}, run: (file, args, options) => {
    calls++;
    assert.equal(file, 'powershell.exe');
    assert.equal(options.stdio, 'inherit');
    assert.ok(args.includes('-NonInteractive'));
    assert.equal(args.at(-1), path.join(root, 'config/font.json'));
    assert.ok(args.includes(path.join(root, 'scripts/install-font.ps1')));
    return { status: 0 };
  } });
  assert.equal(calls, 1);
  assert.equal(result.installed, true); // Simulated process success, not a Windows runtime test.
  assert.throws(() => ensureJetBrainsMono({ platform: 'win32', log: () => {}, run: () => ({ status: 1 }) }), /verification failed/);
  assert.throws(() => ensureJetBrainsMono({ platform: 'win32', log: () => {}, run: () => ({ error: new Error('Missing PowerShell'), status: null }) }), /Missing PowerShell/);
});

test('Invalid font pin is rejected before a subprocess can launch', t => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'mansur-font-manifest-'));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  fs.mkdirSync(path.join(base, 'config'));
  const pin = require('../config/font.json');
  fs.writeFileSync(path.join(base, 'config/font.json'), JSON.stringify({ ...pin, url: 'https://example.com/unverified.zip' }));
  assert.throws(() => ensureJetBrainsMono({ repoRoot: base, platform: 'win32', run: () => { throw new Error('Must not run'); } }), /Invalid pinned/);
});

test('Full installer reports real skill completion, preserves IDE approvals in scoped opt-out and selects both fonts', t => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'mansur-progress-'));
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  const db = path.join(home, 'AppData/Roaming/Antigravity IDE/User/globalStorage/state.vscdb');
  fs.mkdirSync(path.dirname(db), { recursive: true });
  fs.writeFileSync(db, 'FOREIGN DB: do not touch');
  const messages = [];
  const result = runInstaller({ customRoots: { userProfile: home }, skipExtensions: true, skipAgentBrowser: true,
    skipPermissions: true, log: line => messages.push(line) });
  assert.equal(result.success, true);
  assert.equal(result.font.skipped, true, 'Isolated profile must not install real fonts');
  assert.equal(result.mcpPermissions.skipped, true);
  assert.equal(fs.readFileSync(db, 'utf8'), 'FOREIGN DB: do not touch');
  const settings = JSON.parse(fs.readFileSync(path.join(home, 'AppData/Roaming/Antigravity IDE/User/settings.json')));
  for (const key of ['editor.fontFamily', 'terminal.integrated.fontFamily']) assert.match(settings[key], /JetBrains Mono/);
  const skillMessages = messages.filter(line => /^  Skill \[/.test(line));
  assert.equal(skillMessages.length, 77);
  assert.match(skillMessages.at(-1), /\[77\/77\] 100%/);
  assert.ok(skillMessages.some(line => line.includes('mansur-frontend-mentor')));
  assert.ok(skillMessages.some(line => line.includes('mansur-practice')));
  const backups = path.join(home, '.gemini/backups');
  const before = fs.readdirSync(backups);
  const preview = execFileSync(process.execPath, [path.join(root, 'bin/mansur-setup.js'), 'backup', '--dry-run'],
    { encoding: 'utf8', env: { ...process.env, USERPROFILE: home, APPDATA: path.join(home, 'AppData/Roaming'), LOCALAPPDATA: path.join(home, 'AppData/Local') } });
  assert.match(preview, /DRY-RUN/);
  assert.deepEqual(fs.readdirSync(backups), before, 'Manual backup preview must not write a backup');
});

test('Extension success requires actual CLI registration; a success message alone cannot pass', t => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'mansur-extension-progress-'));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  const cli = path.join(base, process.platform === 'win32' ? 'test-ide.cmd' : 'test-ide');
  const script = process.platform === 'win32' ? path.join(base, 'test-ide.js') : cli;
  const registered = path.join(base, 'registered');
  fs.writeFileSync(script, `#!${process.execPath}\nconst fs = require('node:fs');\nif (process.argv.includes('--list-extensions') && fs.existsSync(${JSON.stringify(registered)})) console.log('test.demo@1.0.0');\nelse if (process.argv.includes('--install-extension')) console.log('successfully installed');\n`);
  if (process.platform === 'win32') fs.writeFileSync(cli, `@"${process.execPath}" "${script}" %*\r\n`);
  else fs.chmodSync(cli, 0o755);
  assert.equal(installExtension(cli, 'test.demo', { log: () => {} }).success, false);
  fs.writeFileSync(registered, 'registered');
  assert.equal(installExtension(cli, 'test.demo', { log: () => {} }).success, true);
});
