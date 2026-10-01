'use strict';

const fs = require('fs');
const path = require('path');
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
      log(`  Backup warning: ${err.message}`);
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
        { src: 'mansur-02.template.md', dest: 'mansur-02.md' },
        { src: 'mansur-03.template.md', dest: 'mansur-03.md' },
        { src: 'mansur.template.md', dest: 'mansur.md' },
      ];
      for (const r of simpleRules) {
        const sp = path.join(rulesSourceDir, r.src);
        if (fs.existsSync(sp)) {
          fs.copyFileSync(sp, path.join(envPaths.geminiRulesDir, r.dest));
        }
      }

      // Copy GEMINI.template.md to ~/.gemini/GEMINI.md
      const geminiTemplate = path.join(rulesSourceDir, 'GEMINI.template.md');
      if (fs.existsSync(geminiTemplate)) {
        fs.copyFileSync(geminiTemplate, path.join(envPaths.geminiDir, 'GEMINI.md'));
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
      const practiceSrc = path.join(skillsSourceDir, 'mansur-practice');
      if (fs.existsSync(practiceSrc)) {
        copyDir(practiceSrc, path.join(envPaths.geminiSkillsDir, 'mansur-practice'));
      }

      const mentorSrc = path.join(skillsSourceDir, 'mansur-frontend-mentor');
      if (fs.existsSync(mentorSrc)) {
        copyDir(mentorSrc, path.join(envPaths.geminiSkillsDir, 'mansur-frontend-mentor'));
      }

      const vercelSrc = path.join(skillsSourceDir, 'vercel-react-best-practices');
      if (fs.existsSync(vercelSrc)) {
        copyDir(vercelSrc, path.join(envPaths.geminiSkillsDir, 'vercel-react-best-practices'));
      }
      log(`  Skills deployed successfully.`);
    } else {
      log(`  [DRY-RUN] Would deploy skills to ${envPaths.geminiSkillsDir}`);
    }
  }

  // Deploy practice-engine.mjs
  const practiceEngineSrc = path.join(repoRoot, 'scripts', 'practice-engine.mjs');
  if (fs.existsSync(practiceEngineSrc)) {
    if (!dryRun) {
      if (!fs.existsSync(envPaths.geminiScriptsDir)) {
        fs.mkdirSync(envPaths.geminiScriptsDir, { recursive: true });
      }
      fs.copyFileSync(practiceEngineSrc, path.join(envPaths.geminiScriptsDir, 'practice-engine.mjs'));
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
  const mcpTemplateSrc = path.join(repoRoot, 'config', 'mcp', 'mcp_config.template.json');
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

  // 8. Extensions
  log('\n[7/8] Installing Extensions...');
  const panelSourceDir = path.join(repoRoot, 'extensions', 'mansur-github-panel');
  if (fs.existsSync(panelSourceDir)) {
    try {
      installCustomGithubPanel(envPaths.cliPath, envPaths.extensionsDir, panelSourceDir, { dryRun, log });
    } catch (err) {
      log(`  Custom extension warning: ${err.message}`);
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
            installExtension(envPaths.cliPath, ext.id, { dryRun, log });
          }
        }
      }
    }
  } else if (skipExtensions) {
    log('  Skipping marketplace extension installation as requested.');
  } else {
    log('  Antigravity CLI not found. Extensions can be installed later via Extension Manager.');
  }

  log('\n[8/8] Installation Finalized!');
  log('====================================================');
  log('✓ Setup successfully applied.');
  if (backupInfo) {
    log(`✓ Pre-install backup saved at: ${backupInfo.backupDir}`);
  }
  log('★ IMPORTANT NEXT STEPS:');
  log('  1. In Antigravity IDE, press Ctrl+Shift+P -> "Developer: Reload Window".');
  log('  2. For GitHub MCP: Add your GitHub Personal Access Token to ~/.gemini/config/mcp_config.json');
  log('  3. Font: JetBrains Mono is recommended for the full look (install via `winget install JetBrains.JetBrainsMono`).');
  log('====================================================\n');

  return { success: true, backupInfo, dryRun };
}

module.exports = { runInstaller };
