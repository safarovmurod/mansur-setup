import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const unified = require('../lib/unified');
const { runInstaller } = require('../lib/installer');
const { getEnvironmentPaths } = require('../lib/paths');
const { createBackup, restoreBackup } = require('../lib/backup');
const root = path.resolve(import.meta.dirname, '..');

function fixture(t) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'mansur unified '));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  const home = path.join(base, 'Профили Мансур бо пробел');
  fs.mkdirSync(home);
  return { home, base, options: { home, sourceRoot: root } };
}
function put(home, relative, content) {
  const target = path.join(home, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
  return target;
}
function snapshot(home) {
  return [...unified.FILES, unified.STATE, '.gemini/GEMINI.md'].map(relative => {
    const p = path.join(home, relative);
    return fs.existsSync(p) ? [relative, fs.readFileSync(p), fs.statSync(p).mtimeMs] : [relative, null];
  });
}

test('CLI preview/install/repeat: inline contract, UTF-8 paths, every guide/map, no settings or credentials changes', t => {
  const { home } = fixture(t);
  const foreign = ['.gemini/config/rules/foreign.md', '.gemini/config/mcp_config.json', '.gemini/antigravity/mcp_config.json',
    '.gemini/config/skills/foreign/SKILL.md', '.antigravity-ide/argv.json', 'AppData/Roaming/Antigravity IDE/User/settings.json',
    'AppData/Roaming/Antigravity IDE/User/globalStorage/state.vscdb'];
  for (const file of foreign) put(home, file, 'KEEP EXACT UTF-8 — шахсӣ');
  const global = put(home, '.gemini/GEMINI.md', '# Foreign instructions\nDo not change this.\n');
  const cli = (...args) => JSON.parse(execFileSync(process.execPath, [path.join(root, 'bin/mansur-setup.js'), ...args, '--home', home], { encoding: 'utf8' }));
  const preview = cli('install', '--rules-only', '--dry-run', '--name', 'Алишер');
  assert.equal(preview.changed.length, unified.FILES.length + 2);
  assert.equal(fs.existsSync(path.join(home, unified.STATE)), false);
  assert.equal(fs.readFileSync(global, 'utf8'), '# Foreign instructions\nDo not change this.\n');
  const installed = cli('install', '--rules-only', '--name', 'Алишер');
  assert.ok(installed.backup);
  const first = snapshot(home);
  const text = fs.readFileSync(global, 'utf8');
  assert.ok(text.startsWith(unified.BEGIN));
  assert.ok(text.includes('mansur-unified-v1') && text.includes('Алишер'));
  assert.ok(text.includes('React + JSX + Vite + MUI + React Router + Axios'));
  assert.ok(text.endsWith('# Foreign instructions\nDo not change this.\n'));
  for (const file of unified.FILES) assert.ok(fs.statSync(path.join(home, file)).size > 0, file);
  for (const name of ['full-stack', 'design', 'sources']) assert.match(fs.readFileSync(path.join(home, '.gemini/config/rules/mansur-unified-' + name + '.md'), 'utf8'), /^---\ntrigger: model_decision\ndescription:/);
  const repeated = cli('install', '--rules-only', '--name', 'Алишер');
  assert.deepEqual(repeated.changed, []);
  assert.equal(repeated.backup, null);
  assert.deepEqual(snapshot(home), first);
  assert.equal((text.match(/mansur-unified:begin/g) || []).length, 1);
  for (const file of foreign) assert.equal(fs.readFileSync(path.join(home, file), 'utf8'), 'KEEP EXACT UTF-8 — шахсӣ');
});

test('Update and targeted restore preserve personal configuration and recover the previous guide version', t => {
  const { home, base, options } = fixture(t);
  unified.install(options);
  const sourceRoot = path.join(base, 'source');
  fs.cpSync(path.join(root, 'rules'), path.join(sourceRoot, 'rules'), { recursive: true });
  fs.cpSync(path.join(root, 'config/mansur-unified'), path.join(sourceRoot, 'config/mansur-unified'), { recursive: true });
  const guide = '.gemini/config/mansur-unified/guides/design.md';
  const previous = fs.readFileSync(path.join(home, guide));
  fs.appendFileSync(path.join(sourceRoot, 'config/mansur-unified/guides/design.md'), '\nFixture update.\n');
  put(home, '.gemini/config/rules/personal.md', 'PRESERVE');
  const result = unified.install({ ...options, sourceRoot });
  assert.equal(result.changed.length, 2); // Guide + ownership hashes.
  assert.match(fs.readFileSync(path.join(home, guide), 'utf8'), /Fixture update/);
  unified.restore(result.backup, { home });
  assert.deepEqual(fs.readFileSync(path.join(home, guide)), previous);
  assert.equal(fs.readFileSync(path.join(home, '.gemini/config/rules/personal.md'), 'utf8'), 'PRESERVE');
  assert.deepEqual(unified.install(options).changed, []);
});

test('Uninstall removes only owned additions, preserves later foreign global text, and can be undone', t => {
  const { home, options } = fixture(t);
  const foreign = '# Personal global text\n';
  const global = put(home, '.gemini/GEMINI.md', foreign);
  unified.install(options);
  fs.appendFileSync(global, 'Later personal addition\n');
  const retained = put(home, '.gemini/config/mansur-unified/guides/personal.md', 'Personal guide');
  const preview = unified.uninstall({ home, dryRun: true });
  assert.ok(preview.changed.length > 0);
  assert.ok(fs.existsSync(path.join(home, unified.STATE)));
  const removed = unified.uninstall({ home });
  for (const relative of [...unified.FILES, unified.STATE]) assert.equal(fs.existsSync(path.join(home, relative)), false, relative);
  assert.equal(fs.readFileSync(global, 'utf8'), foreign + 'Later personal addition\n');
  assert.equal(fs.readFileSync(retained, 'utf8'), 'Personal guide');
  assert.deepEqual(unified.uninstall({ home }).changed, []);
  unified.restore(removed.backup, { home });
  assert.deepEqual(unified.install(options).changed, []);
  assert.ok(fs.readFileSync(global, 'utf8').endsWith(foreign + 'Later personal addition\n'));
});

test('Locally edited managed content blocks update, removal and broad installer before any setup writes', t => {
  const { home, options } = fixture(t);
  unified.install(options);
  fs.appendFileSync(path.join(home, unified.FILES[0]), '\nMy change\n');
  const before = snapshot(home);
  assert.throws(() => unified.install(options), /conflict/);
  assert.throws(() => unified.uninstall({ home }), /conflict/);
  assert.throws(() => runInstaller({ customRoots: { userProfile: home }, repoRoot: root, skipExtensions: true, log: () => {} }), /conflict/);
  assert.deepEqual(snapshot(home), before);
  assert.equal(fs.existsSync(path.join(home, 'AppData/Roaming/Antigravity IDE/User/settings.json')), false);
});

test('Unmanaged files, duplicate markers, symlinks and invalid registry stop before writes', t => {
  const { home, options } = fixture(t);
  const file = put(home, unified.FILES[0], 'Existing Windows core');
  assert.throws(() => unified.install(options), /Unmanaged/);
  assert.equal(fs.readFileSync(file, 'utf8'), 'Existing Windows core');
  fs.unlinkSync(file);
  const global = put(home, '.gemini/GEMINI.md', unified.BEGIN + unified.BEGIN + unified.END);
  assert.throws(() => unified.install(options), /markers/);
  fs.unlinkSync(global);
  fs.writeFileSync(global, Buffer.from([0xff, 0xfe, 0x41]));
  assert.throws(() => unified.install(options), /UTF-8/);
  assert.deepEqual(fs.readFileSync(global), Buffer.from([0xff, 0xfe, 0x41]));
  fs.unlinkSync(global);
  fs.symlinkSync(path.join(home, 'missing-target'), file);
  assert.throws(() => unified.install(options), /Linked target/);
  fs.unlinkSync(file);
  put(home, unified.STATE, JSON.stringify({ schema: 1, contract: 'mansur-unified-v1', files: [] }));
  assert.throws(() => unified.uninstall({ home }), /Invalid/);
  assert.equal(fs.existsSync(path.join(home, unified.FILES[1])), false);
});

test('Failed atomic write rolls back previous writes and reports its recoverable backup', t => {
  const { home, options } = fixture(t);
  const global = put(home, '.gemini/GEMINI.md', 'FOREIGN\n');
  const rename = fs.renameSync;
  let failed = false;
  t.mock.method(fs, 'renameSync', (from, to) => {
    if (!failed && to.endsWith('mansur-unified-design.md')) { failed = true; throw new Error('Injected copy failure'); }
    return rename(from, to);
  });
  assert.throws(() => unified.install(options), /rolled back.*Backup:/);
  assert.equal(failed, true);
  for (const file of unified.FILES) assert.equal(fs.existsSync(path.join(home, file)), false);
  assert.equal(fs.readFileSync(global, 'utf8'), 'FOREIGN\n');
  assert.equal(fs.existsSync(path.join(home, unified.STATE)), false);
});

test('Restore checks integrity and later edits before changing any file', t => {
  const { home, options } = fixture(t);
  put(home, '.gemini/GEMINI.md', 'FOREIGN');
  const installed = unified.install(options);
  const manifest = JSON.parse(fs.readFileSync(path.join(installed.backup, 'manifest.json')));
  const previous = manifest.records.find(record => record.existed);
  fs.appendFileSync(path.join(installed.backup, previous.file), 'TAMPER');
  const before = snapshot(home);
  assert.throws(() => unified.restore(installed.backup, { home }), /integrity/);
  assert.deepEqual(snapshot(home), before);
  fs.appendFileSync(path.join(home, unified.FILES[0]), '\nPersonal edit');
  assert.throws(() => unified.restore(installed.backup, { home }), /conflict/);
});

test('Broad backup includes unified data; restoring pre-install snapshot removes only new managed additions', t => {
  const { home, options } = fixture(t);
  const env = getEnvironmentPaths({ userProfile: home });
  put(home, '.gemini/GEMINI.md', 'BEFORE\n');
  put(home, '.gemini/config/rules/personal.md', 'KEEP');
  const before = createBackup(env, 'before');
  unified.install(options);
  const after = createBackup(env, 'after');
  assert.ok(fs.existsSync(path.join(after.backupDir, 'mansur-unified', '.installation.json')));
  restoreBackup(before.backupDir, env);
  assert.equal(fs.existsSync(path.join(home, unified.STATE)), false);
  assert.equal(fs.readFileSync(path.join(home, '.gemini/GEMINI.md'), 'utf8'), 'BEFORE\n');
  assert.equal(fs.readFileSync(path.join(home, '.gemini/config/rules/personal.md'), 'utf8'), 'KEEP');
  restoreBackup(after.backupDir, env);
  assert.deepEqual(unified.install(options).changed, []);
});
