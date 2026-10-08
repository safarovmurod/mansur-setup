'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { getEnvironmentPaths } = require('./paths');
const { parseJsonc } = require('./jsonc');
const { getInstalledExtensions } = require('./extensions');

function runDoctor(options = {}) {
  const envPaths = getEnvironmentPaths(options.customRoots);
  const log = options.log || console.log;

  const checks = [];
  function addCheck(category, name, status, detail = '') {
    checks.push({ category, name, status, detail });
    const icon = status === 'pass' ? '✓' : status === 'warn' ? '⚠' : '✗';
    log(`  [${icon}] ${category} -> ${name}${detail ? ` (${detail})` : ''}`);
  }

  log('\n=== Antigravity Setup Doctor ===\n');

  // 1. Environment & Prerequisites
  if (process.platform === 'win32') {
    addCheck('System', 'Windows OS', 'pass', process.platform);
  } else {
    addCheck('System', 'Windows OS', 'warn', `Non-Windows platform (${process.platform})`);
  }

  const nodeVersion = process.version;
  const major = parseInt(nodeVersion.slice(1).split('.')[0], 10);
  if (major >= 24) {
    addCheck('Node.js', 'Node Version', 'pass', nodeVersion);
  } else {
    addCheck('Node.js', 'Node Version', 'fail', `${nodeVersion} (requires Node >= 24)`);
  }

  try {
    const npmVersion = execSync(process.platform === 'win32' ? 'npm.cmd --version' : 'npm --version',
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    addCheck('npm', 'npm Version', /^\d+\./.test(npmVersion) && Number(npmVersion.split('.')[0]) >= 10 ? 'pass' : 'fail',
      npmVersion + ' (requires npm >= 10)');
  } catch (_) { addCheck('npm', 'npm Version', 'fail', 'npm not found in PATH'); }

  // Git check
  try {
    const gitVer = execSync('git --version', { encoding: 'utf8' }).trim();
    addCheck('Git', 'Git CLI', 'pass', gitVer);
  } catch (_) {
    addCheck('Git', 'Git CLI', 'fail', 'Git not found in PATH');
  }

  // Git Bash path
  if (fs.existsSync(envPaths.gitBashPath)) {
    addCheck('Git', 'Git Bash Path', 'pass', envPaths.gitBashPath);
  } else {
    addCheck('Git', 'Git Bash Path', 'warn', `Not found at ${envPaths.gitBashPath}`);
  }

  // 2. Antigravity IDE
  if (envPaths.cliPath && fs.existsSync(envPaths.cliPath)) {
    addCheck('Antigravity', 'IDE CLI', 'pass', envPaths.cliPath);
  } else {
    addCheck('Antigravity', 'IDE CLI', 'warn', 'CLI not found. Check installation in LocalAppData');
  }

  // 3. Configuration & User Settings
  if (fs.existsSync(envPaths.settingsJson)) {
    try {
      const content = fs.readFileSync(envPaths.settingsJson, 'utf8');
      const settings = parseJsonc(content);

      const hasPrettier = settings['editor.defaultFormatter'] === 'esbenp.prettier-vscode';
      const hasCursor = settings['editor.cursorSmoothCaretAnimation'] === 'on';
      const hasRippleDisabled = settings['jellyCursor.rippleEnabled'] === false;
      const hasFormatOnSave = settings['editor.formatOnSave'] === true;

      addCheck('Settings', 'settings.json exists', 'pass', envPaths.settingsJson);
      addCheck('Settings', 'Prettier Formatter Default', hasPrettier ? 'pass' : 'warn');
      addCheck('Settings', 'Native Smooth Cursor', hasCursor ? 'pass' : 'warn');
      addCheck('Settings', 'Jelly Ripple Disabled', hasRippleDisabled ? 'pass' : 'warn');
      addCheck('Settings', 'Format On Save', hasFormatOnSave ? 'pass' : 'warn');
      const expectedSettings = require('../config/settings.json');
      function matchesExpected(actual, expected) {
        if (Array.isArray(expected)) return JSON.stringify(actual) === JSON.stringify(expected);
        if (expected && typeof expected === 'object') {
          return actual && typeof actual === 'object' && Object.entries(expected).every(([key, value]) => matchesExpected(actual[key], value));
        }
        return actual === expected;
      }
      const changedSettings = Object.keys(expectedSettings).filter(key => !matchesExpected(settings[key], expectedSettings[key]));
      addCheck('Settings', 'Managed editor settings', changedSettings.length ? 'warn' : 'pass',
        `${Object.keys(expectedSettings).length} expected; ${changedSettings.length} missing/different`
        + (changedSettings.length ? ': ' + changedSettings.slice(0, 8).join(', ') : ''));
      addCheck('Font', 'JetBrains Mono selected for editor and terminal',
        String(settings['editor.fontFamily'] || '').includes('JetBrains Mono') && String(settings['terminal.integrated.fontFamily'] || '').includes('JetBrains Mono') ? 'pass' : 'warn');
      if (process.platform === 'win32' && !options.customRoots?.userProfile) {
        const manifest = require('../config/font.json');
        const crypto = require('node:crypto');
        const fontDir = path.join(envPaths.localAppData, 'Microsoft', 'Windows', 'Fonts');
        const valid = manifest.files.every(file => {
          const target = path.join(fontDir, file.name);
          return fs.existsSync(target) && crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex') === file.sha256;
        });
        addCheck('Font', 'Pinned user TTF files verified', valid ? 'pass' : 'warn', valid ? '16 checksums match; registration is verified during install' : 'Run full install again to install/verify the font; --skip-font preserves an existing font setup');
      } else addCheck('Font', 'Windows font registration', 'warn', 'Not checked on this platform / isolated profile');
    } catch (e) {
      addCheck('Settings', 'settings.json parsed', 'fail', e.message);
    }
  } else {
    addCheck('Settings', 'settings.json exists', 'warn', 'Not created yet');
  }

  // Keybindings
  if (fs.existsSync(envPaths.keybindingsJson)) {
    try {
      const kb = parseJsonc(fs.readFileSync(envPaths.keybindingsJson, 'utf8'), []);
      if (!Array.isArray(kb)) throw new Error('keybindings.json must contain an array');
      const count = kb.length;
      addCheck('Settings', 'keybindings.json valid', 'pass', `${count} entries`);
    } catch (e) {
      addCheck('Settings', 'keybindings.json valid', 'fail', e.message);
    }
  } else {
    addCheck('Settings', 'keybindings.json valid', 'warn', 'Not created yet');
  }

  // 4. Global Rules and Gemini Config
  const geminiMd = path.join(envPaths.geminiDir, 'GEMINI.md');
  if (fs.existsSync(geminiMd)) {
    addCheck('Rules', 'Global GEMINI.md', 'pass', geminiMd);
  } else {
    addCheck('Rules', 'Global GEMINI.md', 'warn', 'Not found in ~/.gemini/GEMINI.md');
  }

  const rule01 = path.join(envPaths.geminiRulesDir, 'mansur-01.md');
  const rule02 = path.join(envPaths.geminiRulesDir, 'mansur-02.md');
  const rule03 = path.join(envPaths.geminiRulesDir, 'mansur-03.md');
  const allRulesExist = fs.existsSync(rule01) && fs.existsSync(rule02) && fs.existsSync(rule03);
  addCheck('Rules', 'Rules (01, 02, 03)', allRulesExist ? 'pass' : 'warn');

  const unified = require('./unified');
  const corePath = path.join(envPaths.geminiRulesDir, 'mansur-unified-core.md');
  const core = fs.existsSync(corePath) ? fs.readFileSync(corePath, 'utf8') : '';
  const globalText = fs.existsSync(geminiMd) ? fs.readFileSync(geminiMd, 'utf8') : '';
  addCheck('Unified', 'Core always_on and inline global contract',
    core.startsWith('---\ntrigger: always_on\n') && globalText.includes('mansur-unified-v1') ? 'pass' : 'warn');
  addCheck('Unified', 'Rules, guides and source maps present',
    unified.FILES.every(relative => fs.existsSync(path.join(envPaths.userProfile, relative))) ? 'pass' : 'warn');

  if (fs.existsSync(rule02)) {
    try {
      const r02Content = fs.readFileSync(rule02, 'utf8');
      const hasCycle = r02Content.includes('Design and browser verification') && r02Content.includes('dev server');
      addCheck('Rules', 'Design verification cycle rule', hasCycle ? 'pass' : 'warn');
    } catch (_) {
      addCheck('Rules', 'Design verification cycle rule', 'warn', 'Failed reading mansur-02.md');
    }
  }

  // 5. Skills
  const mentorSkill = path.join(envPaths.geminiSkillsDir, 'mansur-frontend-mentor', 'SKILL.md');
  const agentBrowserSkill = path.join(envPaths.geminiSkillsDir, 'agent-browser', 'SKILL.md');
  const practiceSkill = path.join(envPaths.geminiSkillsDir, 'mansur-practice', 'SKILL.md');
  const vercelSkill = path.join(envPaths.geminiSkillsDir, 'vercel-react-best-practices', 'SKILL.md');
  addCheck('Skills', 'mansur-frontend-mentor skill', fs.existsSync(mentorSkill) ? 'pass' : 'warn');
  addCheck('Skills', 'agent-browser skill', fs.existsSync(agentBrowserSkill) ? 'pass' : 'warn');
  addCheck('Skills', 'mansur-practice skill', fs.existsSync(practiceSkill) ? 'pass' : 'warn');
  addCheck('Skills', 'vercel-react-best-practices skill', fs.existsSync(vercelSkill) ? 'pass' : 'warn');

  // 6. Scripts & Practice Engine
  const engineScript = path.join(envPaths.geminiScriptsDir, 'practice-engine.mjs');
  addCheck('Scripts', 'practice-engine.mjs', fs.existsSync(engineScript) ? 'pass' : 'warn');

  // 7. Extensions
  const installed = getInstalledExtensions(envPaths.cliPath);
  addCheck('Extensions', 'Total registered extensions', installed.length > 0 ? 'pass' : 'warn', `${installed.length} found`);

  const criticalExts = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config', 'extensions.json'), 'utf8')).map(item => item.id);
  for (const ext of criticalExts) {
    const isInst = installed.some(i => i.id === ext.toLowerCase());
    addCheck('Extensions', ext, isInst ? 'pass' : 'warn');
  }

  // MCP credentials are never printed. Docker is only needed for a docker entry.
  for (const file of [path.join(envPaths.geminiConfigDir, 'mcp_config.json'), path.join(envPaths.geminiDir, 'antigravity', 'mcp_config.json')]) {
    if (!fs.existsSync(file)) { addCheck('MCP', path.basename(path.dirname(file)), 'warn', 'Config absent'); continue; }
    try {
      const servers = JSON.parse(fs.readFileSync(file, 'utf8')).mcpServers || {};
      for (const [name, server] of Object.entries(servers)) {
        const placeholder = /YOUR_[A-Z_]+/.test(JSON.stringify(server));
        addCheck('MCP', name + ' configuration', server.disabled || placeholder ? 'warn' : 'pass', server.disabled || placeholder ? 'Needs local credentials/enablement' : 'Configured; live tools not proven');
        if (server.command === 'docker' && !server.disabled) {
          try { execSync('docker --version', { stdio: 'ignore' }); addCheck('MCP', 'Docker launcher', 'pass'); }
          catch (_) { addCheck('MCP', 'Docker launcher', 'warn', 'Required by this entry; hosted alternative in docs/MCP_SETUP.md'); }
        }
      }
    } catch (_) { addCheck('MCP', 'Config JSON', 'fail', 'Invalid JSON; not showing contents'); }
  }
  const inventoryPath = path.join(envPaths.geminiConfigDir, 'skill-inventory.json');
  if (fs.existsSync(inventoryPath)) {
    try {
      const names = JSON.parse(fs.readFileSync(inventoryPath, 'utf8')).skills;
      if (!Array.isArray(names) || !names.length || names.some(name => typeof name !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(name))) {
        throw new Error('Invalid skill inventory');
      }
      const missing = names.filter(name => !fs.existsSync(path.join(envPaths.geminiSkillsDir, name, 'SKILL.md')));
      addCheck('Skills', 'Complete catalog', missing.length ? 'fail' : 'pass', names.length + ' expected, ' + missing.length + ' missing');
    } catch (_) { addCheck('Skills', 'Complete catalog', 'fail', 'Invalid skill inventory; rerun install to rebuild it'); }
  } else addCheck('Skills', 'Complete catalog', 'warn', 'Run installer');
  for (const name of ['mansur-mentor-auto.md', 'mansur-skills-auto.md']) {
    const file = path.join(envPaths.geminiRulesDir, name);
    const valid = fs.existsSync(file) && /^---\r?\ntrigger: always_on\r?\n---/.test(fs.readFileSync(file, 'utf8'));
    addCheck('Rules', name, valid ? 'pass' : 'warn');
  }
  const gsd = path.join(envPaths.geminiDir, 'antigravity', 'gsd-core', 'workflows', 'fast.md');
  addCheck('Skills', 'GSD workflow dependency', fs.existsSync(gsd) ? 'pass' : 'warn');

  // 9. Browser Automation & Runtime
  try {
    const abVer = execSync('agent-browser --version', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    addCheck('Browser Automation', 'agent-browser CLI', 'pass', abVer);
  } catch (_) {
    addCheck('Browser Automation', 'agent-browser CLI', 'warn', 'Not found in PATH (install via npm i -g agent-browser)');
  }

  const browsersDir = path.join(envPaths.userProfile, '.agent-browser', 'browsers');
  let hasBrowserRuntime = false;
  let browserDetail = 'Not found';
  if (fs.existsSync(browsersDir)) {
    try {
      const installedBrowsers = fs.readdirSync(browsersDir).filter(f => fs.existsSync(path.join(browsersDir, f, 'chrome-win64', 'chrome.exe')) || fs.existsSync(path.join(browsersDir, f, 'chrome.exe')));
      if (installedBrowsers.length > 0) {
        hasBrowserRuntime = true;
        browserDetail = installedBrowsers.join(', ');
      }
    } catch (_) {}
  }
  addCheck('Browser Automation', 'Chrome for Testing Runtime', hasBrowserRuntime ? 'pass' : 'warn', browserDetail);

  const permissionDb = path.join(envPaths.userSettingsDir, 'globalStorage', 'state.vscdb');
  if (fs.existsSync(permissionDb)) {
    let db;
    try {
      const { DatabaseSync } = require('node:sqlite');
      db = new DatabaseSync(permissionDb, { readOnly: true });
      const { TOPIC_KEY, readMcpPolicy } = require('./mcp-permissions');
      const policy = readMcpPolicy(db.prepare('SELECT value FROM ItemTable WHERE key=?').get(TOPIC_KEY)?.value || '');
      addCheck('MCP', 'Global auto-allow policy', policy.allowed && !policy.conflicts ? 'pass' : 'warn', policy.allowed && !policy.conflicts ? 'Stored mcp(*) Allow; runtime tool call not proven' : 'Run permissions with Antigravity closed');
    } catch (_) { addCheck('MCP', 'Global auto-allow policy', 'warn', 'Unverified storage; no changes made'); }
    finally { db?.close(); }
  } else addCheck('MCP', 'Global auto-allow policy', 'warn', 'Open/close Antigravity once, then run permissions');

  const failures = checks.filter(c => c.status === 'fail');
  const warnings = checks.filter(c => c.status === 'warn');

  log(`\nDoctor Summary: ${checks.length - failures.length - warnings.length} Passed, ${warnings.length} Warnings, ${failures.length} Failures.\n`);

  return {
    ok: failures.length === 0,
    checks,
    failures,
    warnings,
  };
}

module.exports = { runDoctor };
