'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { getEnvironmentPaths } = require('./paths');
const { parseJsonc, deepMerge } = require('./jsonc');
const { createBackup } = require('./backup');
const { installExtension, installCustomGithubPanel, getInstalledExtensions } = require('./extensions');

function safeWriteJson(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tempPath = `${filePath}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tempPath, filePath);
}

function runInstaller(options = {}) {
  const {
    displayName = 'Мансур',
    dryRun = false,
    skipExtensions = false,
    skipAgentBrowser = false,
    customRoots = {},
    repoRoot = path.resolve(__dirname, '..'),
    log = console.log,
  } = options;

  log('\n=== Mansur Antigravity Setup Installer ===');
  log(`  User Display Name : ${displayName}`);
  log(`  Dry Run Mode      : ${dryRun ? 'YES (No changes will be written)' : 'NO'}`);
  log(`  Skip Extensions   : ${skipExtensions ? 'YES' : 'NO'}`);
  log(`  Source Repository : ${repoRoot}\n`);

  const envPaths = getEnvironmentPaths(customRoots);
  if (Number(process.versions.node.split('.')[0]) < 24) throw new Error('Full setup requires Node.js >=24 (GSD Core and agent-browser runtime)');
  if (typeof displayName !== 'string' || !displayName.trim() || /[\r\n]/.test(displayName) || displayName.length > 80) throw new Error('Name must be one nonempty line, at most 80 characters');
  const isolated = !!customRoots.userProfile;
  const failures = [];
  // Validate every destination JSON before making any change.
  for (const target of [envPaths.settingsJson, envPaths.keybindingsJson, envPaths.argvJson]) {
    if (fs.existsSync(target)) {
      const text = fs.readFileSync(target, 'utf8');
      if (text.trim()) parseJsonc(text);
    }
  }
  const geminiFile = path.join(envPaths.geminiDir, 'GEMINI.md');
  if (fs.existsSync(geminiFile)) {
    const old = fs.readFileSync(geminiFile, 'utf8');
    const start = old.indexOf('<!-- mansur-setup:begin -->'), end = old.indexOf('<!-- mansur-setup:end -->');
    if ((start < 0) !== (end < 0) || (start >= 0 && end < start)) throw new Error('Invalid setup markers; no changes made');
  }

  // 1. Pre-checks
  if (process.platform !== 'win32' && !customRoots.userProfile) {
    log('  [WARNING] Non-Windows OS detected. Antigravity IDE paths are optimized for Windows.');
  }

  // 2. Backup
  let backupInfo = null;
  if (!dryRun) {
    log('[1/8] Creating pre-install backup...');
    try {
      backupInfo = createBackup(envPaths, 'pre-install');
      log(`  Backup created at: ${backupInfo.backupDir}`);
    } catch (err) {
      throw new Error('Backup failed; installation stopped before changes: ' + err.message);
    }
  } else {
    log('[1/8] [DRY-RUN] Skipping pre-install backup.');
  }

  // 3. User Settings (settings.json)
  log('\n[2/8] Configuring Editor Settings (settings.json)...');
  const sourceSettingsPath = path.join(repoRoot, 'config', 'settings.json');
  if (!fs.existsSync(sourceSettingsPath)) {
    throw new Error(`config/settings.json not found in ${repoRoot}`);
  }
  const setupSettings = JSON.parse(fs.readFileSync(sourceSettingsPath, 'utf8'));

  let existingSettings = {};
  if (fs.existsSync(envPaths.settingsJson)) {
    const raw = fs.readFileSync(envPaths.settingsJson, 'utf8');
    if (raw.trim()) {
      try {
        existingSettings = parseJsonc(raw);
      } catch (err) {
        throw new Error(`Failed to parse existing ${envPaths.settingsJson}: ${err.message}. Aborting to prevent overwriting user configuration.`);
      }
    }
  }

  // Deep merge to preserve user's non-conflicting settings
  const mergedSettings = deepMerge(existingSettings, setupSettings);

  if (dryRun) {
    log(`  [DRY-RUN] Would merge ${Object.keys(setupSettings).length} settings into ${envPaths.settingsJson}`);
  } else {
    safeWriteJson(envPaths.settingsJson, mergedSettings);
    log(`  Settings merged successfully into ${envPaths.settingsJson}`);
  }

  // 4. Keybindings (keybindings.json)
  log('\n[3/8] Configuring Keybindings (keybindings.json)...');
  const sourceKeybindingsPath = path.join(repoRoot, 'config', 'keybindings.json');
  if (fs.existsSync(sourceKeybindingsPath)) {
    const setupBindings = JSON.parse(fs.readFileSync(sourceKeybindingsPath, 'utf8'));
    let existingBindings = [];
    if (fs.existsSync(envPaths.keybindingsJson)) {
      const raw = fs.readFileSync(envPaths.keybindingsJson, 'utf8');
      if (raw.trim()) {
        try {
          existingBindings = parseJsonc(raw, []);
        } catch (err) {
          throw new Error(`Failed to parse existing ${envPaths.keybindingsJson}: ${err.message}. Aborting to prevent overwriting user configuration.`);
        }
      }
    }

    // Merge keybindings avoiding duplicate entries
    const mergedBindings = [...existingBindings];
    for (const item of setupBindings) {
      const exists = mergedBindings.some(
        b => b.key === item.key && b.command === item.command
      );
      if (!exists) {
        mergedBindings.push(item);
      }
    }

    if (dryRun) {
      log(`  [DRY-RUN] Would write ${mergedBindings.length} keybindings to ${envPaths.keybindingsJson}`);
    } else {
      safeWriteJson(envPaths.keybindingsJson, mergedBindings);
      log(`  Keybindings written successfully.`);
    }
  }

  // 5. argv.json (Locale & crash reporter)
  log('\n[4/8] Configuring IDE Locale (argv.json)...');
  const sourceArgvPath = path.join(repoRoot, 'config', 'argv.json');
  if (fs.existsSync(sourceArgvPath)) {
    const setupArgv = JSON.parse(fs.readFileSync(sourceArgvPath, 'utf8'));
    let existingArgv = {};
    if (fs.existsSync(envPaths.argvJson)) {
      const raw = fs.readFileSync(envPaths.argvJson, 'utf8');
      if (raw.trim()) {
        try {
          existingArgv = parseJsonc(raw);
        } catch (err) {
          throw new Error(`Failed to parse existing ${envPaths.argvJson}: ${err.message}. Aborting to prevent overwriting user configuration.`);
        }
      }
    }
    const mergedArgv = { ...existingArgv, ...setupArgv };

    if (dryRun) {
      log(`  [DRY-RUN] Would update ${envPaths.argvJson}`);
    } else {
      safeWriteJson(envPaths.argvJson, mergedArgv);
      log(`  IDE argv.json updated successfully.`);
    }
  }

  // 6. Global Rules & GEMINI.md
  log('\n[5/8] Installing AI Global Rules and GEMINI.md...');
  const rulesSourceDir = path.join(repoRoot, 'rules');
  if (fs.existsSync(rulesSourceDir)) {
    if (!dryRun) {
      if (!fs.existsSync(envPaths.geminiRulesDir)) {
        fs.mkdirSync(envPaths.geminiRulesDir, { recursive: true });
      }

      // Copy mansur-01.template.md replacing {{DISPLAY_NAME}}
      const rule01TemplatePath = path.join(rulesSourceDir, 'mansur-01.template.md');
      if (fs.existsSync(rule01TemplatePath)) {
        let content01 = fs.readFileSync(rule01TemplatePath, 'utf8');
        content01 = content01.replace(/\{\{DISPLAY_NAME\}\}/g, displayName);
        fs.writeFileSync(path.join(envPaths.geminiRulesDir, 'mansur-01.md'), content01, 'utf8');
      }

      // Copy mansur-02, mansur-03, mansur.md
      const simpleRules = [
        { src: 'mansur-mentor-auto.template.md', dest: 'mansur-mentor-auto.md' },
        { src: 'mansur-02.template.md', dest: 'mansur-02.md' },
        { src: 'mansur-03.template.md', dest: 'mansur-03.md' },
        { src: 'mansur.template.md', dest: 'mansur.md' },
      ];
      for (const name of fs.readdirSync(rulesSourceDir)) {
        if (name.endsWith('.template.md') && name !== 'GEMINI.template.md' && !simpleRules.some(rule => rule.src === name) && name !== 'mansur-01.template.md') {
          simpleRules.push({ src: name, dest: name.replace('.template.md', '.md') });
        }
      }
      for (const r of simpleRules) {
        const sp = path.join(rulesSourceDir, r.src);
        if (fs.existsSync(sp)) {
          fs.copyFileSync(sp, path.join(envPaths.geminiRulesDir, r.dest));
        }
      }

      // Copy GEMINI.template.md to ~/.gemini/GEMINI.md
      fs.writeFileSync(path.join(envPaths.geminiRulesDir, 'user-name.md'), '---\ntrigger: always_on\n---\nPreferred user name: ' + displayName + '. Use this name instead of historical personal names in mentor references. The current user request has priority.\n');
      const geminiTemplate = path.join(rulesSourceDir, 'GEMINI.template.md');
      if (fs.existsSync(geminiTemplate)) {
        const target = path.join(envPaths.geminiDir, 'GEMINI.md');
        const start = '<!-- mansur-setup:begin -->';
        const end = '<!-- mansur-setup:end -->';
        let old = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
        const first = old.indexOf(start), last = old.indexOf(end);
        if ((first < 0) !== (last < 0) || (first >= 0 && last < first)) throw new Error('Invalid setup markers; restore backup and repair GEMINI.md');
        if (first >= 0) old = old.slice(0, first) + old.slice(last + end.length);
        else if (old.includes('# Mansur Global Rules')) old = '';
        const content = fs.readFileSync(geminiTemplate, 'utf8').replaceAll('Мансур', displayName);
        fs.writeFileSync(target, start + '\n' + content + '\n' + end + '\n' + old.trimStart());
      }
      log(`  Global rules deployed to ${envPaths.geminiRulesDir} with displayName="${displayName}"`);
    } else {
      log(`  [DRY-RUN] Would deploy rules to ${envPaths.geminiRulesDir}`);
    }
  }

  // 7. Skills & Scripts
  log('\n[6/8] Deploying AI Skills and Practice Engine...');
  const skillsSourceDir = path.join(repoRoot, 'skills');
  if (fs.existsSync(skillsSourceDir)) {
    if (!dryRun) {
      if (!fs.existsSync(envPaths.geminiSkillsDir)) {
        fs.mkdirSync(envPaths.geminiSkillsDir, { recursive: true });
      }

      // Helper recursive copy
      function copyDir(src, dest) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
          const srcPath = path.join(src, entry.name);
          const destPath = path.join(dest, entry.name);
          if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
          } else {
            fs.copyFileSync(srcPath, destPath);
          }
        }
      }

      // Deploy mansur-practice and vercel-react-best-practices
      for (const name of fs.readdirSync(skillsSourceDir)) {
        const from = path.join(skillsSourceDir, name);
        if (fs.existsSync(path.join(from, 'SKILL.md'))) copyDir(from, path.join(envPaths.geminiSkillsDir, name));
      }
      log(`  Skills deployed successfully.`);
    } else {
      log(`  [DRY-RUN] Would deploy skills to ${envPaths.geminiSkillsDir}`);
    }
  }

  if (!dryRun) {
    const names = fs.readdirSync(skillsSourceDir).filter(name => fs.existsSync(path.join(skillsSourceDir, name, 'SKILL.md')));
    safeWriteJson(path.join(envPaths.geminiConfigDir, 'skill-inventory.json'), { skills: names });
  }

  // GSD skills depend on these workflow files and agent definitions.
  for (const [source, target] of [
    [path.join(repoRoot, 'resources', 'gsd-core'), path.join(envPaths.geminiDir, 'antigravity', 'gsd-core')],
    [path.join(repoRoot, 'agents'), path.join(envPaths.geminiConfigDir, 'agents')],
  ]) {
    if (fs.existsSync(source) && !dryRun) fs.cpSync(source, target, { recursive: true });
  }

  // Deploy practice-engine.mjs
  const scriptsSource = path.join(repoRoot, 'scripts');
  const runtimeScripts = fs.readdirSync(scriptsSource).filter(name => /\.(mjs|cjs|js|ps1)$/.test(name) && !name.startsWith('install-'));
  for (const name of runtimeScripts) {
    const practiceEngineSrc = path.join(scriptsSource, name);
    if (!dryRun) {
      if (!fs.existsSync(envPaths.geminiScriptsDir)) {
        fs.mkdirSync(envPaths.geminiScriptsDir, { recursive: true });
      }
      fs.copyFileSync(practiceEngineSrc, path.join(envPaths.geminiScriptsDir, name));
      log(`  Practice engine script installed to ${envPaths.geminiScriptsDir}`);
    } else {
      log(`  [DRY-RUN] Would deploy practice engine script.`);
    }
  }

  // Deploy Jelly Cursor state & repair template
  const jellySourceDir = path.join(repoRoot, 'config', 'jelly-cursor');
  if (fs.existsSync(jellySourceDir)) {
    if (!dryRun) {
      const jellyTargetDir = path.join(envPaths.antigravityStateDir, 'jelly-cursor');
      if (!fs.existsSync(jellyTargetDir)) fs.mkdirSync(jellyTargetDir, { recursive: true });
      for (const f of fs.readdirSync(jellySourceDir)) {
        fs.copyFileSync(path.join(jellySourceDir, f), path.join(jellyTargetDir, f));
      }
      log(`  Jelly cursor configuration deployed to ${jellyTargetDir}`);
    } else {
      log(`  [DRY-RUN] Would deploy jelly cursor configuration.`);
    }
  }

  // Deploy MCP template safely (never overwriting existing mcp_config.json if token already set)
  const mcpTemplateSrc = path.join(repoRoot, 'config', 'mcp', 'github-remote.template.json');
  const targetMcpConfig = path.join(envPaths.geminiConfigDir, 'mcp_config.json');
  if (fs.existsSync(mcpTemplateSrc)) {
    if (!dryRun) {
      if (!fs.existsSync(envPaths.geminiConfigDir)) fs.mkdirSync(envPaths.geminiConfigDir, { recursive: true });
      if (!fs.existsSync(targetMcpConfig)) {
        fs.copyFileSync(mcpTemplateSrc, targetMcpConfig);
        log(`  Safe MCP template installed at ${targetMcpConfig}`);
      } else {
        log(`  Existing MCP config preserved at ${targetMcpConfig} (not overwritten)`);
      }
    } else {
      log(`  [DRY-RUN] Would check/deploy safe MCP template.`);
    }
  }
  const secondaryTemplate = path.join(repoRoot, 'config', 'mcp', 'mcp_antigravity.template.json');
  const secondaryTarget = path.join(envPaths.geminiDir, 'antigravity', 'mcp_config.json');
  if (!dryRun && fs.existsSync(secondaryTemplate) && !fs.existsSync(secondaryTarget)) {
    fs.mkdirSync(path.dirname(secondaryTarget), { recursive: true });
    fs.copyFileSync(secondaryTemplate, secondaryTarget);
  }

  // 8. Extensions
  log('\n[7/8] Installing Extensions...');
  const panelSourceDir = path.join(repoRoot, 'extensions', 'mansur-github-panel');
  if (fs.existsSync(panelSourceDir)) {
    try {
      const panel = installCustomGithubPanel(envPaths.cliPath, envPaths.extensionsDir, panelSourceDir, { dryRun, log, isolated });
      if (!panel.success) failures.push('Mansur GitHub Panel not registered');
    } catch (err) {
      failures.push('Custom extension: ' + err.message);
    }
  }

  if (!skipExtensions && envPaths.cliPath && fs.existsSync(envPaths.cliPath)) {
    const extListFile = path.join(repoRoot, 'config', 'extensions.json');
    if (fs.existsSync(extListFile)) {
      const extList = JSON.parse(fs.readFileSync(extListFile, 'utf8'));
      const currentlyInstalled = getInstalledExtensions(envPaths.cliPath);

      for (const ext of extList) {
        if (ext.source === 'gallery') {
          const already = currentlyInstalled.some(i => i.id === ext.id.toLowerCase());
          if (already) {
            log(`  Extension ${ext.id} already installed.`);
          } else {
            const result = installExtension(envPaths.cliPath, ext.id, { dryRun, log });
            if (!result.success) failures.push('Extension failed: ' + ext.id);
          }
        }
      }
    }
  } else if (skipExtensions) {
    log('  Skipping marketplace extension installation as requested.');
  } else {
    log('  Antigravity CLI not found. Extensions can be installed later via Extension Manager.');
    failures.push('Antigravity CLI missing: extensions not installed');
  }

  // 8. Agent Browser & Browser Runtime
  if (!skipAgentBrowser && !isolated) {
    ensureAgentBrowser({ dryRun, log, version: JSON.parse(fs.readFileSync(path.join(repoRoot, 'skills', 'agent-browser', 'metadata.json'), 'utf8')).version });
  }

  log('\n[8/8] Installation Finalized!');
  log('====================================================');
  log(failures.length ? 'Setup incomplete: ' + failures.join('; ') : '✓ Setup files applied; runtime chat/auth require separate verification.');
  if (backupInfo) {
    log(`✓ Pre-install backup saved at: ${backupInfo.backupDir}`);
  }
  log('★ IMPORTANT NEXT STEPS:');
  log('  1. In Antigravity IDE, press Ctrl+Shift+P -> "Developer: Reload Window".');
  log('  2. For GitHub MCP: Add your GitHub Personal Access Token to ~/.gemini/config/mcp_config.json');
  log('  3. Font: JetBrains Mono is recommended for the full look (install via `winget install JetBrains.JetBrainsMono`).');
  log('====================================================\n');

  return { success: failures.length === 0, failures, backupInfo, dryRun };
}

function ensureAgentBrowser(options = {}) {
  const { dryRun = false, log = console.log, version = '0.38.1' } = options;
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Invalid agent-browser version');
  log('\nVerifying agent-browser CLI and browser runtime...');

  // 1. Check agent-browser CLI
  let cliInstalled = false;
  let abVersion = '';
  try {
    abVersion = execSync('agent-browser --version', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    cliInstalled = abVersion === 'agent-browser ' + version;
    log(`  agent-browser CLI is already installed (${abVersion}).`);
  } catch (_) {
    cliInstalled = false;
  }

  if (!cliInstalled) {
    if (dryRun) {
      log('  [DRY-RUN] Would install agent-browser globally via: npm install -g agent-browser');
    } else {
      log('  agent-browser CLI not found. Installing globally via npm...');
      try {
        execSync('npm install -g agent-browser@' + version, {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
        });
        const verified = execSync('agent-browser --version', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
        if (verified !== 'agent-browser ' + version) throw new Error('CLI version mismatch after installation');
        log('  agent-browser CLI installed and version verified.');
      } catch (err) {
        throw new Error(`Failed to install agent-browser CLI: ${err.message}. Please install manually using: npm install -g agent-browser`);
      }
    }
  }

  // 2. Check / Ensure Chrome for Testing runtime
  if (dryRun) {
    log('  [DRY-RUN] Would verify Chrome browser runtime via: agent-browser install');
  } else {
    try {
      log('  Ensuring browser runtime via: agent-browser install...');
      const installOut = execSync('agent-browser install', {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }).trim();
      const firstLine = installOut.split('\n')[0] || 'Browser runtime ready';
      log(`  Browser runtime status: ${firstLine}`);
    } catch (err) {
      throw new Error(`Failed to install browser runtime via 'agent-browser install': ${err.message}. Please ensure internet connectivity or run 'agent-browser install' manually.`);
    }
  }
}

module.exports = { runInstaller, ensureAgentBrowser };
