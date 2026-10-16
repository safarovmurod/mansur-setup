import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(import.meta.dirname, '..');
const { runInstaller } = require('../lib/installer.js');
const { getEnvironmentPaths } = require('../lib/paths.js');
const { collectPayload } = require('../lib/owned-files.js');
const { installBundledTsMancho } = require('../lib/extensions.js');
const { buildTsMancho } = require('../scripts/package-ts-mancho.cjs');

function fixture(t, gitBashPath) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'mansur-profile-conflicts-'));
  t.after(() => {
    const resolved = path.resolve(base);
    assert.ok(resolved.startsWith(path.resolve(os.tmpdir()) + path.sep));
    assert.ok(path.basename(resolved).startsWith('mansur-profile-conflicts-'));
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  const customRoots = { userProfile: path.join(base, 'User Profile With Spaces'), ...(gitBashPath ? { gitBashPath } : {}) };
  return { customRoots, env: getEnvironmentPaths(customRoots) };
}

function installProfile(customRoots) {
  const result = runInstaller({ customRoots, repoRoot, skipExtensions: true, skipAgentBrowser: true, skipFont: true, skipPermissions: true, log() {} });
  assert.equal(result.success, true, result.failures.join('; '));
}

test('Installed GSD workflow agent references and permissions resolve to the deployed catalog', t => {
  const { customRoots, env } = fixture(t);
  installProfile(customRoots);
  let resolvedReferences = 0;
  for (const item of collectPayload(repoRoot, 'Шеф').filter(item => item.key.startsWith('gsd-core/') && item.key.endsWith('.md'))) {
    const installed = path.join(env.geminiDir, 'antigravity', item.key);
    const text = fs.readFileSync(installed, 'utf8');
    assert.doesNotMatch(text, /~\/\.gemini\/antigravity\/agents\//, item.key);
    for (const reference of text.matchAll(/~\/\.gemini\/config\/agents\/gsd-[\w-]+\.md\b/g)) {
      const target = path.join(env.userProfile, reference[0].slice(2));
      assert.ok(fs.existsSync(target), item.key + ' references missing ' + reference[0]);
      resolvedReferences++;
    }
  }
  assert.ok(resolvedReferences >= 10, 'The affected workflows must actually be checked');
  const permissions = JSON.parse(fs.readFileSync(path.join(env.geminiDir, 'antigravity/settings.json'), 'utf8')).permissions.allow;
  assert.ok(permissions.includes('read_file(~/.gemini/config/agents/gsd-*)'));
  assert.ok(permissions.includes('read_file(~/.gemini/config/skills/gsd-*)'));
  const runtime = spawnSync(process.execPath, [path.join(env.geminiDir, 'antigravity/gsd-core/bin/gsd-tools.cjs'), 'runtime-identity', '--raw'], { encoding: 'utf8', timeout: 15000 });
  assert.equal(runtime.status, 0, runtime.stderr);
  assert.equal(JSON.parse(runtime.stdout).packageName, '@opengsd/gsd-core');
});

test('Rendered hooks execute from a profile with spaces and use its resolved shell and state directory', t => {
  const gitBashPath = process.platform === 'win32' ? getEnvironmentPaths().gitBashPath : '/bin/bash';
  assert.ok(gitBashPath && fs.existsSync(gitBashPath), 'A shell is required to exercise the shell hook');
  const { customRoots, env } = fixture(t, gitBashPath);
  installProfile(customRoots);
  const hooksRoot = path.join(env.geminiDir, 'antigravity/hooks');
  // Session startup is stubbed only in this disposable profile to avoid an update
  // download and to verify the launch contract independently of session contents.
  fs.writeFileSync(path.join(hooksRoot, 'gsd-check-update.js'), "process.stdin.resume(); process.stdin.on('end', () => process.stdout.write('{}'));\n");
  fs.writeFileSync(path.join(hooksRoot, 'gsd-session-state.sh'), "IFS= read -r payload || true\nprintf '%s' '{}'\n");
  const hooks = JSON.parse(fs.readFileSync(path.join(env.geminiConfigDir, 'hooks.json'), 'utf8'))['gsd-antigravity'];
  const input = JSON.stringify({ conversationId: 'profile-space-test', workspacePaths: [repoRoot], toolCall: { name: 'view_file', args: { AbsolutePath: path.join(repoRoot, 'README.md') } } });
  for (const event of ['PreToolUse', 'PostToolUse', 'PreInvocation']) {
    const command = event === 'PreInvocation' ? hooks[event][0].command : hooks[event][0].hooks[0].command;
    assert.ok(command.startsWith('"' + env.nodeExe.replace(/\\/g, '/') + '" '));
    assert.ok(command.endsWith('"' + env.gitBashPath.replace(/\\/g, '/') + '"'));
    const result = spawnSync(command, { shell: process.platform === 'win32' ? true : '/bin/bash', input, encoding: 'utf8', timeout: 15000, windowsHide: true, cwd: repoRoot });
    assert.equal(result.status, 0, event + ': ' + (result.error?.message || result.stderr));
    assert.equal(result.stderr, '', event + ': hooks must execute, not silently fall back on an error');
    const output = JSON.parse(result.stdout);
    if (event === 'PreToolUse') assert.equal(output.decision, 'ask');
  }
  const state = JSON.parse(fs.readFileSync(path.join(env.geminiDir, 'antigravity-ide/hook-state/profile-space-test.json'), 'utf8'));
  assert.equal(state.started, true);
});

function loadTsMancho(t) {
  const { env } = fixture(t);
  const result = installBundledTsMancho(null, env.extensionsDir, path.join(repoRoot, 'extensions/ts-mancho'), { isolated: true, log() {} });
  assert.equal(result.success, true);
  return require(path.join(env.extensionsDir, 'mancho.ts-mancho-3.1.2-universal/dist/extension.cjs')).createExtension;
}

function mockEditor(settings, state = new Map()) {
  const disposable = () => ({ dispose() {} });
  const config = {
    inspect: key => ({ globalValue: settings[key] }),
    async update(key, value) {
      if (value === undefined) delete settings[key];
      else settings[key] = value;
    },
  };
  const vscode = {
    extensions: { getExtension: () => ({}) },
    ConfigurationTarget: { Global: 1 },
    DecorationRangeBehavior: { ClosedClosed: 1 },
    StatusBarAlignment: { Right: 1 },
    window: {
      createTextEditorDecorationType: disposable,
      createStatusBarItem: () => ({ show() {}, hide() {}, dispose() {} }),
      onDidChangeActiveTextEditor: disposable,
    },
    workspace: {
      getConfiguration: section => section === 'tsMancho'
        ? { get: (key, fallback) => Object.hasOwn(settings, 'tsMancho.' + key) ? settings['tsMancho.' + key] : fallback }
        : config,
      onDidChangeTextDocument: disposable,
      onDidCloseTextDocument: disposable,
      onDidChangeConfiguration: disposable,
    },
    commands: { registerCommand: disposable },
  };
  return { vscode, context: { subscriptions: [], globalState: {
    get: key => state.get(key),
    async update(key, value) {
      if (value === undefined) state.delete(key);
      else state.set(key, value);
    },
  } } };
}

test('Bundled TS MANCHO reproduces its reviewed source and pinned checksums', () => {
  const built = buildTsMancho(repoRoot);
  assert.deepEqual(fs.readFileSync(built.file), built.bytes);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(repoRoot, 'extensions/ts-mancho/manifest.json'), 'utf8')), built.pin);
});

test('Visual quiet mode hides JS/TS underlines and unused hints without disabling validation', async t => {
  const createExtension = loadTsMancho(t);
  const settings = JSON.parse(fs.readFileSync(path.join(repoRoot, 'config/settings.json'), 'utf8'));
  assert.equal(settings['tsMancho.quietMode'], true);
  assert.equal(settings['tsMancho.smoothTyping'], true);
  const before = structuredClone(settings);
  const { vscode, context } = mockEditor(settings);
  await createExtension(vscode, context).ready();
  assert.equal(settings['typescript.validate.enable'], true);
  assert.equal(settings['javascript.validate.enable'], true);
  assert.equal(settings['errorLens.enabled'], true);
  assert.equal(settings['editor.cursorWidth'], before['editor.cursorWidth']);
  assert.equal(settings['problems.visibility'], false);
  for (const language of ['javascript', 'javascriptreact', 'typescript', 'typescriptreact']) {
    assert.equal(settings[`[${language}]`]['editor.showUnused'], false);
    assert.equal(settings[`[${language}]`]['editor.defaultFormatter'], before[`[${language}]`]['editor.defaultFormatter']);
    assert.ok(settings['errorLens.excludeLanguages'].includes(language));
  }
  // A repeat install refreshes the language settings but retains globalState.
  settings['[typescriptreact]'] = structuredClone(before['[typescriptreact]']);
  delete settings['errorLens.excludeLanguages'];
  delete settings['problems.visibility'];
  await createExtension(vscode, context).ready();
  assert.equal(settings['problems.visibility'], false);
  assert.ok(settings['errorLens.excludeLanguages'].includes('typescriptreact'));
});

test('Updating old quiet mode restores validation while retaining quiet visuals and unrelated exclusions', async t => {
  const createExtension = loadTsMancho(t);
  const settings = JSON.parse(fs.readFileSync(path.join(repoRoot, 'config/settings.json'), 'utf8'));
  settings['errorLens.excludeLanguages'] = ['python'];
  // State written by 3.1.0: language validation was turned off, with the
  // original user's values saved under the v31 ownership keys.
  const state = new Map([['tsMancho.v31.managed.quietFlags', {
    'typescript.validate.enable': { hasValue: true, value: true },
    'javascript.validate.enable': { hasValue: true, value: true },
    'typescript.suggestionActions.enabled': { hasValue: false },
    'javascript.suggestionActions.enabled': { hasValue: false },
  }]]);
  for (const name of Object.keys(state.get('tsMancho.v31.managed.quietFlags'))) settings[name] = false;
  const { vscode, context } = mockEditor(settings, state);
  await createExtension(vscode, context).ready();
  assert.equal(settings['typescript.validate.enable'], true);
  assert.equal(settings['javascript.validate.enable'], true);
  assert.equal(settings['problems.visibility'], false);
  assert.equal(settings['[typescriptreact]']['editor.showUnused'], false);
  assert.ok(settings['errorLens.excludeLanguages'].includes('typescript'));
  assert.ok(settings['errorLens.excludeLanguages'].includes('python'));
  assert.equal(state.has('tsMancho.v31.managed.quietFlags'), false);
});

test('Turning visual quiet mode off restores only its own decorations and Error Lens exclusions', async t => {
  const createExtension = loadTsMancho(t);
  const settings = JSON.parse(fs.readFileSync(path.join(repoRoot, 'config/settings.json'), 'utf8'));
  settings['errorLens.excludeLanguages'] = ['python'];
  const expected = structuredClone(settings);
  expected['tsMancho.quietMode'] = false;
  const { vscode, context } = mockEditor(settings);
  await createExtension(vscode, context).ready();
  settings['tsMancho.quietMode'] = false;
  await createExtension(vscode, context).ready();
  assert.deepEqual(settings, expected);
});
