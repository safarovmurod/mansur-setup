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
  if (major >= 18) {
    addCheck('Node.js', 'Node Version', 'pass', nodeVersion);
  } else {
    addCheck('Node.js', 'Node Version', 'fail', `${nodeVersion} (requires Node >= 18)`);
  }

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
      const count = Array.isArray(kb) ? kb.length : 0;
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

  // 5. Skills
  const practiceSkill = path.join(envPaths.geminiSkillsDir, 'mansur-practice', 'SKILL.md');
  const vercelSkill = path.join(envPaths.geminiSkillsDir, 'vercel-react-best-practices', 'SKILL.md');
  addCheck('Skills', 'mansur-practice skill', fs.existsSync(practiceSkill) ? 'pass' : 'warn');
  addCheck('Skills', 'vercel-react-best-practices skill', fs.existsSync(vercelSkill) ? 'pass' : 'warn');

  // 6. Scripts & Practice Engine
  const engineScript = path.join(envPaths.geminiScriptsDir, 'practice-engine.mjs');
  addCheck('Scripts', 'practice-engine.mjs', fs.existsSync(engineScript) ? 'pass' : 'warn');

  // 7. Extensions
  const installed = getInstalledExtensions(envPaths.cliPath);
  addCheck('Extensions', 'Total registered extensions', installed.length > 0 ? 'pass' : 'warn', `${installed.length} found`);

  const criticalExts = [
    'esbenp.prettier-vscode',
    'bradlc.vscode-tailwindcss',
    'pkief.material-icon-theme',
    'mansur.mansur-github-panel',
  ];
  for (const ext of criticalExts) {
    const isInst = installed.some(i => i.id === ext.toLowerCase());
    addCheck('Extensions', ext, isInst ? 'pass' : 'warn');
  }

  // 8. Docker & MCP
  try {
    execSync('docker --version', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    addCheck('MCP / Docker', 'Docker CLI', 'pass');
  } catch (_) {
    addCheck('MCP / Docker', 'Docker CLI', 'warn', 'Docker not found in PATH (needed for GitHub MCP container)');
  }

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
