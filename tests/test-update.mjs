import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { planPayload, applyPayload, digest, statePath } = require('../lib/owned-files');
const { getEnvironmentPaths } = require('../lib/paths');
const { runInstaller } = require('../lib/installer');
const { createBackup, restoreBackup } = require('../lib/backup');
const repoRoot = path.resolve(import.meta.dirname, '..');
function fixture(t) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'mansur-update-'));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  const source = path.join(base, 'source'), home = path.join(base, 'User With Spaces');
  for (const name of ['rules', 'skills', 'scripts', 'config/migrations']) fs.mkdirSync(path.join(source, name), { recursive: true });
  const env = getEnvironmentPaths({ userProfile: home });
  return { base, source, home, env };
}
function put(file, text) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text); }
function apply(data) { return applyPayload(data.env, planPayload(data.env, data.source, 'Мансур')); }

test('Update removes unchanged owned obsolete files, preserves edited old and unrelated files, and repeats without writes', t => {
  const data = fixture(t);
  put(path.join(data.source, 'scripts/old.mjs'), 'export const old = true;');
  put(path.join(data.source, 'scripts/edited.mjs'), 'export const edited = false;');
  apply(data);
  const old = path.join(data.env.geminiScriptsDir, 'old.mjs'), edited = path.join(data.env.geminiScriptsDir, 'edited.mjs');
  fs.writeFileSync(edited, 'my personal change');
  const foreign = path.join(data.env.geminiScriptsDir, 'foreign.txt'); put(foreign, 'my file');
  fs.unlinkSync(path.join(data.source, 'scripts/old.mjs')); fs.unlinkSync(path.join(data.source, 'scripts/edited.mjs'));
  const result = apply(data);
  assert.deepEqual(result.removed, [old]); assert.deepEqual(result.preserved, [edited]);
  assert.equal(fs.existsSync(old), false); assert.equal(fs.readFileSync(edited, 'utf8'), 'my personal change');
  assert.equal(fs.readFileSync(foreign, 'utf8'), 'my file');
  const records = JSON.parse(fs.readFileSync(path.join(result.backup, 'manifest.json'))).records;
  const original = records.find(record => record.target === old);
  assert.equal(fs.readFileSync(path.join(result.backup, original.file), 'utf8'), 'export const old = true;');
  assert.deepEqual(apply(data).changed, []);
});

test('Legacy exact-byte migration adopts old files and removes only recognized old bootstrap', t => {
  const data = fixture(t), old = 'export const value = 1;', current = 'export const value = 2;';
  put(path.join(data.source, 'scripts/demo.mjs'), current);
  put(path.join(data.env.geminiScriptsDir, 'demo.mjs'), old);
  put(path.join(data.env.geminiScriptsDir, 'bootstrap.ps1'), 'known old download script');
  put(path.join(data.source, 'config/migrations/legacy-payload.json'), JSON.stringify({ schema: 1, files: { 'scripts/demo.mjs': [digest(old)], 'scripts/bootstrap.ps1': [digest('known old download script')] }, templates: {} }));
  const result = apply(data);
  assert.equal(fs.readFileSync(path.join(data.env.geminiScriptsDir, 'demo.mjs'), 'utf8'), current);
  assert.equal(result.removed.length, 1); assert.equal(fs.existsSync(path.join(data.env.geminiScriptsDir, 'bootstrap.ps1')), false);
});

test('Edited active file and unsafe ownership metadata block update before any mutation', t => {
  const data = fixture(t); put(path.join(data.source, 'scripts/demo.mjs'), 'original'); apply(data);
  const target = path.join(data.env.geminiScriptsDir, 'demo.mjs'); fs.writeFileSync(target, 'personal');
  put(path.join(data.source, 'scripts/new.mjs'), 'new');
  assert.throws(() => planPayload(data.env, data.source, 'Мансур'), /Setup conflict/);
  assert.equal(fs.existsSync(path.join(data.env.geminiScriptsDir, 'new.mjs')), false);
  const registry = JSON.parse(fs.readFileSync(statePath(data.env))); registry.files.push({ key: 'scripts/../../foreign.txt', hash: digest('foreign') });
  fs.writeFileSync(statePath(data.env), JSON.stringify(registry));
  assert.throws(() => planPayload(data.env, data.source, 'Мансур'), /relative path/);
  assert.equal(fs.readFileSync(target, 'utf8'), 'personal');
});

test('Payload failure restores changed bytes and removes newly added files', t => {
  const data = fixture(t); put(path.join(data.source, 'scripts/a.mjs'), 'old'); apply(data);
  put(path.join(data.source, 'scripts/a.mjs'), 'new'); put(path.join(data.source, 'scripts/b.mjs'), 'second');
  const plan = planPayload(data.env, data.source, 'Мансур'), rename = fs.renameSync;
  let failed = false;
  fs.renameSync = function(from, to) { if (!failed && to.endsWith('b.mjs')) { failed = true; throw new Error('simulated disk error'); } return rename(from, to); };
  try { assert.throws(() => applyPayload(data.env, plan), /rolled back/); } finally { fs.renameSync = rename; }
  assert.equal(fs.readFileSync(path.join(data.env.geminiScriptsDir, 'a.mjs'), 'utf8'), 'old');
  assert.equal(fs.existsSync(path.join(data.env.geminiScriptsDir, 'b.mjs')), false);
});

test('Directory junction/link blocks outside writes and unsafe backup traversal', t => {
  const data = fixture(t), outside = path.join(data.base, 'outside'); fs.mkdirSync(outside);
  fs.mkdirSync(path.dirname(data.env.geminiScriptsDir), { recursive: true });
  fs.symlinkSync(outside, data.env.geminiScriptsDir, process.platform === 'win32' ? 'junction' : 'dir');
  put(path.join(data.source, 'scripts/demo.mjs'), 'source');
  assert.throws(() => planPayload(data.env, data.source, 'Мансур'), /Linked/);
  assert.throws(() => createBackup(data.env), /Linked/);
  assert.deepEqual(fs.readdirSync(outside), []);
});

test('Full install preserves terminal security, MCP credentials and custom installed skill; restore removes new owned payload', t => {
  const data = fixture(t);
  put(data.env.settingsJson, JSON.stringify({ 'chat.tools.terminal.autoApprove': { rm: false }, 'security.workspace.trust.untrustedFiles': 'prompt', 'personal.text': 'a,}' }));
  put(path.join(data.env.geminiConfigDir, 'mcp_config.json'), JSON.stringify({ customTop: true, mcpServers: { github: { command: 'my-launcher', env: { TOKEN: 'KEEP_LOCAL_VALUE' }, $typeName: 'metadata' }, gsd: { command: 'custom-gsd', disabled: true } } }));
  put(path.join(data.env.geminiSkillsDir, 'personal-skill/SKILL.md'), 'my skill');
  const result = runInstaller({ customRoots: { userProfile: data.home }, repoRoot, skipAgentBrowser: true, skipPermissions: true, log() {} });
  assert.equal(result.success, true);
  assert.ok(fs.existsSync(path.join(data.env.extensionsDir, 'mansur.antigravity-stability-helper-1.0.1/maintenance.cjs')));
  const settings = JSON.parse(fs.readFileSync(data.env.settingsJson));
  assert.deepEqual(settings['chat.tools.terminal.autoApprove'], { rm: false }); assert.equal(settings['security.workspace.trust.untrustedFiles'], 'prompt'); assert.equal(settings['personal.text'], 'a,}');
  const mcp = JSON.parse(fs.readFileSync(path.join(data.env.geminiConfigDir, 'mcp_config.json')));
  assert.equal(mcp.customTop, true); assert.deepEqual(mcp.mcpServers.github, { command: 'my-launcher', env: { TOKEN: 'KEEP_LOCAL_VALUE' } }); assert.deepEqual(mcp.mcpServers.gsd, { command: 'custom-gsd', disabled: true });
  assert.ok(JSON.parse(fs.readFileSync(path.join(data.env.geminiConfigDir, 'skill-inventory.json'))).skills.includes('personal-skill'));
  const android = path.join(data.env.geminiSkillsDir, 'android-cli/SKILL.md'); assert.equal(fs.existsSync(android), true);
  const restore = restoreBackup(result.backupInfo.backupDir, data.env);
  assert.ok(restore.removed.includes(android)); assert.equal(fs.existsSync(android), false);
  assert.equal(fs.readFileSync(path.join(data.env.geminiSkillsDir, 'personal-skill/SKILL.md'), 'utf8'), 'my skill');
  assert.equal(fs.existsSync(statePath(data.env)), false);
});

test('Invalid MCP and a concurrent install lock stop before settings changes', t => {
  const data = fixture(t); put(data.env.settingsJson, '{"personal":1}'); put(path.join(data.env.geminiConfigDir, 'mcp_config.json'), '{broken');
  const options = { customRoots: { userProfile: data.home }, repoRoot, skipExtensions: true, log() {} };
  assert.throws(() => runInstaller(options), /JSON/); assert.equal(fs.readFileSync(data.env.settingsJson, 'utf8'), '{"personal":1}');
  put(path.join(data.env.geminiConfigDir, 'mansur-setup/install.lock'), JSON.stringify({ pid: process.pid }));
  assert.throws(() => runInstaller(options), /Another setup/); assert.equal(fs.readFileSync(data.env.settingsJson, 'utf8'), '{"personal":1}');
});
