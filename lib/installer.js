'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { getEnvironmentPaths } = require('./paths');
const { parseJsonc, deepMerge } = require('./jsonc');
const { createBackup } = require('./backup');
const { installExtension, installCustomGithubPanel, installStabilityHelper, getInstalledExtensions } = require('./extensions');
const unified = require('./unified');
const payload = require('./owned-files');

function writeIfChanged(filePath, content) {
  const bytes = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8');
  if (fs.existsSync(filePath) && fs.readFileSync(filePath).equals(bytes)) return;
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tempPath = `${filePath}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;
  try { fs.writeFileSync(tempPath, bytes); fs.renameSync(tempPath, filePath); }
  finally { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); }
}

function safeWriteJson(filePath, data) {
  writeIfChanged(filePath, JSON.stringify(data, null, 2));
}

function runInstallerCore(options = {}) {
  const {
    displayName = 'Мансур',
    dryRun = false,
    skipExtensions = false,
    skipAgentBrowser = false,
    skipFont = false,
    skipPermissions = false,
    rulesOnly = false,
    home,
    customRoots = {},
    repoRoot = path.resolve(__dirname, '..'),
    log = console.log,
  } = options;

  const unifiedOptions = { home: home || customRoots.userProfile, sourceRoot: repoRoot, displayName, dryRun };
  const onUnifiedProgress = ({ completed, total, relative }) => log(`  Rules [${completed}/${total}] ${Math.round(100 * completed / total)}%: ${path.basename(relative)}`);
  if (rulesOnly) {
    log(`\n⚡ Mansur rules & guides — ${dryRun ? 'PREVIEW: no writes' : 'install/update'}`);
    const result = unified.install({ ...unifiedOptions, onProgress: onUnifiedProgress });
    log(dryRun ? `  Preview: ${result.changed.length} files would change.` : `  ✓ ${result.changed.length ? 'Rules applied' : 'Already up to date'}; changed: ${result.changed.length}.`);
    if (result.backup) log(`  Private backup: ${result.backup}`);
    return result;
  }

  log('\n=== Mansur Antigravity Setup Installer ===');
  log(`  User Display Name : ${displayName}`);
  log(`  Dry Run Mode      : ${dryRun ? 'YES (No changes will be written)' : 'NO'}`);
  log(`  Skip Extensions   : ${skipExtensions ? 'YES' : 'NO'}`);
  log(`  Source Repository : ${repoRoot}\n`);

  const envPaths = getEnvironmentPaths(customRoots);
  if (Number(process.versions.node.split('.')[0]) < 24) throw new Error('Full setup requires Node.js >=24 (GSD Core and agent-browser runtime)');
  if (typeof displayName !== 'string' || !displayName.trim() || /[\r\n]/.test(displayName) || displayName.length > 80) throw new Error('Name must be one nonempty line, at most 80 characters');
  const isolated = !!customRoots.userProfile;
  if (process.platform !== 'win32' && !isolated && !dryRun) throw new Error('Full IDE setup requires Windows; use install --rules-only on this platform');
  const failures = [];
  const payloadPlan = payload.planPayload(envPaths, repoRoot, displayName);
  for (const target of [envPaths.settingsJson, envPaths.keybindingsJson, envPaths.argvJson, path.join(envPaths.geminiDir, 'GEMINI.md'), path.join(envPaths.geminiConfigDir, 'mcp_config.json'), path.join(envPaths.geminiDir, 'antigravity/mcp_config.json')]) {
    payload.guard(path.dirname(target), path.basename(target));
  }
  for (const target of [path.join(envPaths.geminiConfigDir, 'mcp_config.json'), path.join(envPaths.geminiDir, 'antigravity/mcp_config.json')]) {
    if (fs.existsSync(target)) {
      const config = JSON.parse(fs.readFileSync(target, 'utf8').replace(/^\uFEFF/, ''));
      if (!config || typeof config !== 'object' || Array.isArray(config) || (config.mcpServers !== undefined && (!config.mcpServers || typeof config.mcpServers !== 'object' || Array.isArray(config.mcpServers)))) throw new Error('Invalid MCP config shape; no changes made');
    }
  }
  // Check ownership/conflicts before legacy setup writes any user files.
  unified.install({ ...unifiedOptions, home: envPaths.userProfile, dryRun: true });
  // Validate every destination JSON before making any change.
  for (const target of [envPaths.settingsJson, envPaths.keybindingsJson, envPaths.argvJson]) {
    if (fs.existsSync(target)) {
      const text = fs.readFileSync(target, 'utf8');
      if (text.trim()) {
        const parsed = parseJsonc(text);
        if (target === envPaths.keybindingsJson ? !Array.isArray(parsed) : (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))) throw new Error('Invalid settings/keybindings JSON shape; no changes made');
      }
    }
  }
  const geminiFile = path.join(envPaths.geminiDir, 'GEMINI.md');
  if (fs.existsSync(geminiFile)) {
    const old = fs.readFileSync(geminiFile, 'utf8');
    const start = old.indexOf('<!-- mansur-setup:begin -->'), end = old.indexOf('<!-- mansur-setup:end -->');
    if ((start < 0) !== (end < 0) || (start >= 0 && end < start)
      || (start >= 0 && old.indexOf('<!-- mansur-setup:begin -->', start + 1) >= 0)
      || (end >= 0 && old.indexOf('<!-- mansur-setup:end -->', end + 1) >= 0)) throw new Error('Invalid setup markers; no changes made');
  }

  // 1. Pre-checks
  if (process.platform !== 'win32' && !customRoots.userProfile) {
    log('  [WARNING] Non-Windows OS detected. Antigravity IDE paths are optimized for Windows.');
  }

  // 2. Backup
  let backupInfo = null;
  if (!dryRun) {
    log('[1/10] 🛡️ Creating pre-install backup...');
    try {
      backupInfo = createBackup(envPaths, 'pre-install');
      log(`  Backup created at: ${backupInfo.backupDir}`);
    } catch (err) {
      throw new Error('Backup failed; installation stopped before changes: ' + err.message);
    }
  } else {
    log('[1/10] [DRY-RUN] Skipping pre-install backup.');
  }

  log('\n[2/10] 🎨 Installing/verifying JetBrains Mono...');
  let font = null;
  if (skipFont || isolated) {
    font = { installed: false, skipped: true, reason: isolated ? 'Isolated test profile: no system font changes' : '--skip-font' };
    log('  Font skipped: ' + font.reason);
  } else {
    try {
      font = require('./font').ensureJetBrainsMono({ dryRun, log, repoRoot });
      if (font.skipped) { log('  ' + font.reason); failures.push(font.reason); }
    } catch (error) { font = { installed: false, error: error.message }; failures.push('Font: ' + error.message); log('  ✗ ' + error.message); }
  }

  // 3. User Settings (settings.json)
  log('\n[3/10] Configuring Editor Settings (settings.json)...');
  const sourceSettingsPath = path.join(repoRoot, 'config', 'settings.json');
  if (!fs.existsSync(sourceSettingsPath)) {
    throw new Error(`config/settings.json not found in ${repoRoot}`);
  }
  const setupSettings = JSON.parse(fs.readFileSync(sourceSettingsPath, 'utf8'));
  if (skipPermissions) {
    for (const key of Object.keys(setupSettings)) {
      if (/^(security\.|chat\.tools\.)/.test(key) || /permission|autoApprove/i.test(key)) delete setupSettings[key];
    }
  }

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
  log('\n[4/10] Configuring Keybindings (keybindings.json)...');
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
  log('\n[5/10] Configuring IDE Locale (argv.json)...');
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

  log('\n[6/10] 🧠 Updating managed global instructions...');
  const geminiTemplate = path.join(repoRoot, 'rules/GEMINI.template.md');
  const globalFile = path.join(envPaths.geminiDir, 'GEMINI.md');
  const startMarker = '<!-- mansur-setup:begin -->', endMarker = '<!-- mansur-setup:end -->';
  const oldGlobal = fs.existsSync(globalFile) ? fs.readFileSync(globalFile, 'utf8') : '';
  const first = oldGlobal.indexOf(startMarker), last = oldGlobal.indexOf(endMarker);
  const managed = startMarker + '\n' + fs.readFileSync(geminiTemplate, 'utf8').replaceAll('Мансур', displayName) + '\n' + endMarker;
  const oldCatalogFile = path.join(repoRoot, 'config/migrations/legacy-payload.json');
  const oldTemplates = fs.existsSync(oldCatalogFile) ? JSON.parse(fs.readFileSync(oldCatalogFile, 'utf8')).globalTemplates || [] : [];
  const normalizedOld = oldGlobal.replace(/\r\n/g, '\n').trim();
  const knownOld = [...oldTemplates, fs.readFileSync(geminiTemplate, 'utf8')].some(template => template.replaceAll('Мансур', displayName).replace(/\r\n/g, '\n').trim() === normalizedOld);
  const mergedGlobal = first >= 0 ? oldGlobal.slice(0, first) + managed + oldGlobal.slice(last + endMarker.length) : managed + (knownOld ? '\n' : '\n' + oldGlobal);
  if (!dryRun) writeIfChanged(globalFile, mergedGlobal);
  const unifiedResult = unified.install({ ...unifiedOptions, home: envPaths.userProfile, onProgress: onUnifiedProgress });
  log('  Unified contract: ' + (dryRun ? 'preview' : 'installed') + '; files changed: ' + unifiedResult.changed.length);

  log('\n[7/10] 🧩 Updating skills, rules, agents and runtime files...');
  const payloadResult = payload.applyPayload(envPaths, payloadPlan, { dryRun });
  const skillsSourceDir = path.join(repoRoot, 'skills');
  const skillNames = fs.readdirSync(skillsSourceDir).filter(name => fs.existsSync(path.join(skillsSourceDir, name, 'SKILL.md'))).sort();
  for (const [index, name] of skillNames.entries()) log('  Skill [' + (index + 1) + '/' + skillNames.length + '] ' + Math.round(100 * (index + 1) / skillNames.length) + '%: ' + name);
  log('  Payload files changed: ' + payloadResult.changed.length + '; obsolete removed: ' + payloadResult.removed.length + '; edited obsolete preserved: ' + payloadResult.preserved.length);
  if (payloadResult.backup) log('  Private payload backup: ' + payloadResult.backup);
  for (const kept of payloadResult.preserved) log('  Preserved edited old file: ' + kept);
  if (!dryRun) {
    const installedSkills = fs.readdirSync(envPaths.geminiSkillsDir).filter(name => /^[a-z0-9][a-z0-9-]*$/.test(name) && fs.existsSync(path.join(envPaths.geminiSkillsDir, name, 'SKILL.md'))).sort();
    safeWriteJson(path.join(envPaths.geminiConfigDir, 'skill-inventory.json'), { skills: installedSkills });
  }

  // Existing credentials and server definitions always take precedence over templates.
  const mcpTemplates = ['github-remote.template.json', 'mcp_antigravity.template.json'].map(name => JSON.parse(fs.readFileSync(path.join(repoRoot, 'config/mcp', name), 'utf8')));
  const targetMcpConfig = path.join(envPaths.geminiConfigDir, 'mcp_config.json');
  const config = fs.existsSync(targetMcpConfig) ? JSON.parse(fs.readFileSync(targetMcpConfig, 'utf8').replace(/^\uFEFF/, '')) : { mcpServers: {} };
  config.mcpServers ||= {};
  for (const template of mcpTemplates) {
    for (const [name, server] of Object.entries(template.mcpServers)) {
      if (!Object.hasOwn(config.mcpServers, name)) config.mcpServers[name] = structuredClone(server);
    }
  }
  for (const server of Object.values(config.mcpServers)) {
    if (server && typeof server === 'object') delete server.$typeName;
  }
  if (!dryRun) safeWriteJson(targetMcpConfig, config);
  const secondaryTarget = path.join(envPaths.geminiDir, 'antigravity/mcp_config.json');
  if (!dryRun && !fs.existsSync(secondaryTarget)) safeWriteJson(secondaryTarget, mcpTemplates[1]);

  // 8. Extensions
  log('\n[8/10] 🛠️ Installing Extensions (live CLI output)...');
  const panelSourceDir = path.join(repoRoot, 'extensions', 'mansur-github-panel');
  if (!skipExtensions && fs.existsSync(panelSourceDir)) {
    try {
      const panel = installCustomGithubPanel(envPaths.cliPath, envPaths.extensionsDir, panelSourceDir, { dryRun, log, isolated });
      if (!panel.success) failures.push('Mansur GitHub Panel not registered');
    } catch (err) {
      failures.push('Custom extension: ' + err.message);
    }
  }

  if (!skipExtensions && !isolated && envPaths.cliPath && fs.existsSync(envPaths.cliPath)) {
    const extListFile = path.join(repoRoot, 'config', 'extensions.json');
    if (fs.existsSync(extListFile)) {
      const extList = JSON.parse(fs.readFileSync(extListFile, 'utf8'));
      const currentlyInstalled = getInstalledExtensions(envPaths.cliPath);

      const gallery = extList.filter(ext => ext.source === 'gallery');
      for (const [index, ext] of gallery.entries()) {
          log(`  Extension [${index + 1}/${gallery.length}]: ${ext.id}`);
          const already = currentlyInstalled.some(i => i.id === ext.id.toLowerCase());
          if (already) {
            log(`  Extension ${ext.id} already installed.`);
          } else {
            const result = installExtension(envPaths.cliPath, ext.id, { dryRun, log });
            if (!result.success) failures.push('Extension failed: ' + ext.id);
          }
      }
    }
  } else if (skipExtensions) {
    log('  Skipping all extension installation as requested.');
  } else if (isolated) {
    log('  Isolated profile: gallery CLI skipped; local helpers copied only to the fixture.');
  } else {
    log('  Antigravity CLI not found. Extensions can be installed later via Extension Manager.');
    failures.push('Antigravity CLI missing: extensions not installed');
  }

  const helperSourceDir = path.join(repoRoot, 'extensions/mansur-antigravity-stability');
  if (!skipExtensions && fs.existsSync(helperSourceDir)) {
    try {
      const helper = installStabilityHelper(envPaths.cliPath, envPaths.extensionsDir, helperSourceDir, { dryRun, log, isolated });
      if (!helper.success) failures.push('Stability helper not registered');
    } catch (error) { failures.push('Stability helper: ' + error.message); }
  }

  // 8. Agent Browser & Browser Runtime
  log('\n[9/10] 🌐 Browser CLI and runtime (live download output)...');
  if (!skipAgentBrowser && !isolated) {
    try {
      ensureAgentBrowser({ dryRun, log, version: JSON.parse(fs.readFileSync(path.join(repoRoot, 'skills', 'agent-browser', 'metadata.json'), 'utf8')).version });
    } catch (error) { failures.push('Browser: ' + error.message); log('  ✗ ' + error.message); }
  }

  log('\n[10/10] 🔌 MCP permissions and final report');
  let mcpPermissions = null;
  if (skipPermissions) {
    mcpPermissions = { applied: false, skipped: true, reason: '--skip-permissions: existing approvals preserved; safe to run inside the IDE' };
    log('  ' + mcpPermissions.reason);
  } else if (!isolated) {
    try {
      mcpPermissions = require('./mcp-permissions').applyMcpPermissions(envPaths, { repoRoot, dryRun });
      if (mcpPermissions.applied) log('  MCP: global mcp(*) Allow saved; accounts/tokens unchanged.');
      else if (!dryRun) { failures.push('MCP permissions deferred: ' + mcpPermissions.reason); log('  ' + mcpPermissions.reason); }
    } catch (error) { failures.push('MCP permissions: ' + error.message); }
  }
  log('====================================================');
  log(failures.length ? 'Setup incomplete: ' + failures.join('; ') : dryRun ? '✓ Preview complete; no setup files changed.' : '✓ Setup files applied; runtime chat/auth require separate verification.');
  if (backupInfo) {
    log(`✓ Pre-install backup saved at: ${backupInfo.backupDir}`);
  }
  log('★ IMPORTANT NEXT STEPS:');
  log('  1. In Antigravity IDE, press Ctrl+Shift+P -> "Developer: Reload Window".');
  log('  2. Existing MCP credentials were preserved; new GitHub template needs your own authorization.');
  log('  3. Native MCP Refresh may fail in IDE 2.5.5; setup does not fix that vendor lifecycle defect.');
  log(font && font.installed ? '  4. Font: JetBrains Mono installed/verified; editor and terminal select it through settings.json.' : '  4. Font: ' + (font?.reason || font?.error || 'not installed'));
  log('====================================================\n');

  return { success: failures.length === 0, failures, backupInfo, payload: payloadResult, dryRun, mcpPermissions, font };
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
          stdio: 'inherit',
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
      execSync('agent-browser install', { stdio: 'inherit' });
      log('  Browser runtime installer completed.');
    } catch (err) {
      throw new Error(`Failed to install browser runtime via 'agent-browser install': ${err.message}. Please ensure internet connectivity or run 'agent-browser install' manually.`);
    }
  }
}


function runInstaller(options = {}) {
  if (options.dryRun || options.rulesOnly) return runInstallerCore(options);
  const env = getEnvironmentPaths(options.customRoots || {});
  const lock = payload.guard(env.geminiConfigDir, 'mansur-setup/install.lock');
  fs.mkdirSync(path.dirname(lock), { recursive: true });
  let descriptor;
  try { descriptor = fs.openSync(lock, 'wx', 0o600); }
  catch (error) {
    if (error.code !== 'EEXIST') throw error;
    const oldBytes = fs.readFileSync(lock, 'utf8');
    let old;
    try { old = JSON.parse(oldBytes); } catch { throw new Error('Invalid interrupted setup lock; inspect ' + lock); }
    if (!Number.isSafeInteger(old.pid) || old.pid < 1) throw new Error('Invalid setup lock PID');
    try { process.kill(old.pid, 0); throw new Error('Another setup is running: ' + lock); }
    catch (aliveError) { if (aliveError.code !== 'ESRCH') throw aliveError; }
    if (fs.readFileSync(lock, 'utf8') !== oldBytes) throw new Error('Setup lock changed; retry later');
    fs.unlinkSync(lock);
    descriptor = fs.openSync(lock, 'wx', 0o600);
  }
  const token = JSON.stringify({ pid: process.pid, started: new Date().toISOString() });
  try { fs.writeFileSync(descriptor, token); fs.closeSync(descriptor); descriptor = null; return runInstallerCore(options); }
  finally {
    if (descriptor !== null) fs.closeSync(descriptor);
    if (fs.existsSync(lock) && fs.readFileSync(lock, 'utf8') === token) fs.unlinkSync(lock);
  }
}

module.exports = { runInstaller, ensureAgentBrowser };
