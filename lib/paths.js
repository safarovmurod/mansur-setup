'use strict';

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

function getEnvironmentPaths(customRoots = {}) {
  const isWindows = process.platform === 'win32';
  const userProfile = customRoots.userProfile || process.env.USERPROFILE || 'C:\\Users\\Default';
  const appData = customRoots.appData || process.env.APPDATA || path.join(userProfile, 'AppData', 'Roaming');
  const localAppData = customRoots.localAppData || process.env.LOCALAPPDATA || path.join(userProfile, 'AppData', 'Local');
  const programFiles = process.env.ProgramFiles || 'C:\\Program Files';

  // 1. Antigravity IDE CLI detection
  let cliPath = null;
  if (customRoots.cliPath && fs.existsSync(customRoots.cliPath)) {
    cliPath = customRoots.cliPath;
  } else {
    // Check PATH via where.exe
    if (isWindows) {
      try {
        const out = execSync('where.exe antigravity-ide.cmd 2>nul', { encoding: 'utf8' }).trim().split(/\r?\n/)[0];
        if (out && fs.existsSync(out)) cliPath = out;
      } catch (_) {}
    }

    if (!cliPath) {
      const candidates = [
        path.join(localAppData, 'Programs', 'Antigravity IDE', 'bin', 'antigravity-ide.cmd'),
        path.join(localAppData, 'Programs', 'Antigravity', 'bin', 'antigravity.cmd'),
        path.join(programFiles, 'Antigravity IDE', 'bin', 'antigravity-ide.cmd'),
        path.join(localAppData, 'Programs', 'Antigravity IDE', 'Antigravity IDE.exe'),
      ];
      for (const cand of candidates) {
        if (fs.existsSync(cand)) {
          cliPath = cand;
          break;
        }
      }
    }
  }

  // 2. User directories
  const userSettingsDir = path.join(appData, 'Antigravity IDE', 'User');
  const extensionsDir = path.join(userProfile, '.antigravity-ide', 'extensions');
  const geminiDir = path.join(userProfile, '.gemini');
  const geminiConfigDir = path.join(geminiDir, 'config');
  const geminiRulesDir = path.join(geminiConfigDir, 'rules');
  const geminiSkillsDir = path.join(geminiConfigDir, 'skills');
  const geminiScriptsDir = path.join(geminiDir, 'scripts');
  const antigravityToolsDir = path.join(userProfile, '.antigravity-tools');
  const antigravityStateDir = path.join(userProfile, '.antigravity');
  const backupsDir = path.join(geminiDir, 'backups');

  // 3. Git Bash path
  const gitBashPath = path.join(programFiles, 'Git', 'bin', 'bash.exe');

  return {
    isWindows,
    userProfile,
    appData,
    localAppData,
    programFiles,
    cliPath,
    userSettingsDir,
    settingsJson: path.join(userSettingsDir, 'settings.json'),
    keybindingsJson: path.join(userSettingsDir, 'keybindings.json'),
    argvJson: path.join(userProfile, '.antigravity-ide', 'argv.json'),
    extensionsDir,
    geminiDir,
    geminiConfigDir,
    geminiRulesDir,
    geminiSkillsDir,
    geminiScriptsDir,
    antigravityToolsDir,
    antigravityStateDir,
    backupsDir,
    gitBashPath,
  };
}

module.exports = { getEnvironmentPaths };
