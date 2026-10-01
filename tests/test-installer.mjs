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
const { install: installMentor, restore: restoreMentor } = require('../scripts/install-mentor-skill.cjs');

test('Invalid destination JSON stops before any settings or rules write', (t) => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'setup-invalid-'));
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  const customRoots = { userProfile: home, appData: path.join(home, 'Roaming'), localAppData: path.join(home, 'Local') };
  const env = getEnvironmentPaths(customRoots);
  fs.mkdirSync(path.dirname(env.settingsJson), { recursive: true });
  fs.writeFileSync(env.settingsJson, '{"keep":true}');
  fs.writeFileSync(env.keybindingsJson, '{broken');
  assert.throws(() => runInstaller({ customRoots, skipExtensions: true, repoRoot, log: () => {} }), /JSONC parse error/);
  assert.equal(fs.readFileSync(env.settingsJson, 'utf8'), '{"keep":true}');
  assert.equal(fs.existsSync(path.join(env.geminiDir, 'GEMINI.md')), false);
});

test('New skill, rule and script are discovered without installer code edits; foreign global text survives', (t) => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'setup-future-'));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  const source = path.join(base, 'source');
  for (const name of ['config', 'rules', 'skills', 'scripts', 'agents', 'resources', 'extensions']) fs.cpSync(path.join(repoRoot, name), path.join(source, name), { recursive: true });
  fs.mkdirSync(path.join(source, 'skills', 'future-demo'));
  fs.writeFileSync(path.join(source, 'skills', 'future-demo', 'SKILL.md'), '---\nname: future-demo\ndescription: Future task skill\n---\nRead actual files.\n');
  fs.writeFileSync(path.join(source, 'scripts', 'future-demo.mjs'), 'export const future = true;\n');
  fs.writeFileSync(path.join(source, 'rules', 'future-demo.template.md'), '---\ntrigger: always_on\n---\nPreserve future rule.\n');
  const home = path.join(base, 'User Profile');
  const customRoots = { userProfile: home, appData: path.join(home, 'Roaming'), localAppData: path.join(home, 'Local') };
  const env = getEnvironmentPaths(customRoots);
  const globalFile = path.join(env.geminiDir, 'GEMINI.md');
  fs.mkdirSync(path.dirname(globalFile), { recursive: true });
  fs.writeFileSync(globalFile, 'Keep my foreign instruction.\n');
  const options = { customRoots, repoRoot: source, skipExtensions: true, log: () => {} };
  assert.equal(runInstaller(options).success, true);
  assert.ok(fs.existsSync(path.join(env.geminiSkillsDir, 'future-demo', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(env.geminiScriptsDir, 'future-demo.mjs')));
  assert.ok(fs.existsSync(path.join(env.geminiRulesDir, 'future-demo.md')));
  assert.ok(JSON.parse(fs.readFileSync(path.join(env.geminiConfigDir, 'skill-inventory.json'), 'utf8')).skills.includes('future-demo'));
  const first = fs.readFileSync(globalFile, 'utf8');
  assert.ok(first.includes('Keep my foreign instruction.'));
  assert.equal(runInstaller(options).success, true);
  assert.equal(fs.readFileSync(globalFile, 'utf8'), first);
  const primary = JSON.parse(fs.readFileSync(path.join(env.geminiConfigDir, 'mcp_config.json'), 'utf8'));
  assert.equal(primary.mcpServers['github-mcp-server'].disabled, true);
  assert.ok(fs.existsSync(path.join(env.geminiDir, 'antigravity', 'mcp_config.json')));
});

test('Mentor global autoload preserves an existing project and supports preview, repeat and restore', (t) => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'mentor-global-'));
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  const oldProject = path.join(home, 'old project', 'src');
  fs.mkdirSync(oldProject, { recursive: true });
  const projectFile = path.join(oldProject, 'App.jsx');
  const projectCode = 'export default function App() { return null; }';
  fs.writeFileSync(projectFile, projectCode);
  const geminiPath = path.join(home, '.gemini', 'GEMINI.md');
  fs.mkdirSync(path.dirname(geminiPath), { recursive: true });
  const foreignRule = 'Preserve this user instruction.\n';
  fs.writeFileSync(geminiPath, foreignRule);
  const options = { home, sourceRoot: repoRoot, shared: true };
  const rulePath = path.join(home, '.gemini', 'config', 'rules', 'mansur-mentor-auto.md');
  const preview = installMentor({ ...options, dryRun: true });
  assert.ok(preview.changed.includes(rulePath));
  assert.equal(fs.existsSync(rulePath), false);
  assert.equal(fs.readFileSync(geminiPath, 'utf8'), foreignRule);
  const result = installMentor(options);
  assert.ok(result.backup);
  assert.match(fs.readFileSync(rulePath, 'utf8'), /^---\r?\ntrigger: always_on\r?\n---/);
  const installedGemini = fs.readFileSync(geminiPath, 'utf8');
  assert.ok(installedGemini.includes('без /skill'));
  assert.ok(installedGemini.endsWith(foreignRule));
  assert.equal(fs.readFileSync(projectFile, 'utf8'), projectCode);
  assert.equal(fs.readFileSync(path.join(home, '.agents', 'skills', 'mansur-frontend-mentor', 'SKILL.md'), 'utf8'), fs.readFileSync(path.join(repoRoot, 'skills', 'mansur-frontend-mentor', 'SKILL.md'), 'utf8'));
  assert.deepEqual(installMentor(options).changed, []);
  restoreMentor(result.backup);
  assert.equal(fs.readFileSync(geminiPath, 'utf8'), foreignRule);
  assert.equal(fs.existsSync(rulePath), false);
  assert.equal(fs.readFileSync(projectFile, 'utf8'), projectCode);
});

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
  const primaryMcp = path.join(envPaths.geminiConfigDir, 'mcp_config.json');
  const secondaryMcp = path.join(envPaths.geminiDir, 'antigravity', 'mcp_config.json');
  for (const file of [primaryMcp, secondaryMcp]) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, '{"mcpServers":{"foreign":{"disabled":true}}}');
  }
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
  for (const file of [primaryMcp, secondaryMcp]) assert.equal(fs.readFileSync(file, 'utf8'), '{"mcpServers":{"foreign":{"disabled":true}}}');
  const catalog = JSON.parse(fs.readFileSync(path.join(envPaths.geminiConfigDir, 'skill-inventory.json'), 'utf8'));
  assert.ok(catalog.skills.includes('gsd-fast'));
  assert.ok(catalog.skills.includes('project-coding-rules'));
  for (const name of catalog.skills) assert.ok(fs.existsSync(path.join(envPaths.geminiSkillsDir, name, 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(envPaths.geminiDir, 'antigravity', 'gsd-core', 'workflows', 'fast.md')));
  assert.ok(fs.existsSync(path.join(envPaths.geminiConfigDir, 'agents', 'gsd-executor.md')));
  assert.match(fs.readFileSync(path.join(envPaths.geminiRulesDir, 'mansur-skills-auto.md'), 'utf8'), /trigger: always_on/);
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
  const mentorRule = fs.readFileSync(path.join(envPaths.geminiRulesDir, 'mansur-mentor-auto.md'), 'utf8');
  assert.match(mentorRule, /^---\r?\ntrigger: always_on\r?\n---/);
  assert.equal(fs.existsSync(path.join(envPaths.geminiSkillsDir, 'mansur-frontend-mentor', 'SKILL.md')), true);
  const mentorGemini = fs.readFileSync(path.join(envPaths.geminiDir, 'GEMINI.md'), 'utf8');
  assert.ok(mentorGemini.includes('config/skills/mansur-frontend-mentor/SKILL.md'));
  assert.ok(mentorGemini.includes('без /skill'));
  assert.equal(fs.existsSync(path.join(envPaths.geminiSkillsDir, 'mansur-practice', 'SKILL.md')), true);
  assert.equal(fs.existsSync(path.join(envPaths.geminiSkillsDir, 'vercel-react-best-practices', 'SKILL.md')), true);
  assert.equal(fs.existsSync(path.join(envPaths.geminiSkillsDir, 'agent-browser', 'SKILL.md')), true);
  assert.equal(fs.existsSync(path.join(envPaths.geminiSkillsDir, 'agent-browser', 'metadata.json')), true);
  assert.equal(fs.existsSync(path.join(envPaths.geminiSkillsDir, 'agent-browser', 'LICENSE')), true);
  assert.ok(fs.readFileSync(path.join(envPaths.geminiRulesDir, 'mansur-02.md'), 'utf8').includes('Design and browser verification'));
  assert.ok(fs.readFileSync(path.join(envPaths.geminiDir, 'GEMINI.md'), 'utf8').includes('agent-browser — AUTO-ACTIVATE'));

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
