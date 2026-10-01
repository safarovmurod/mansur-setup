'use strict';

const fs = require('fs');
const path = require('path');

function createBackup(envPaths, label = 'installer') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(envPaths.backupsDir, `setup-backup-${label}-${timestamp}`);

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backedUp = [];

  const targets = [
    { src: envPaths.settingsJson, dest: 'settings.json' },
    { src: envPaths.keybindingsJson, dest: 'keybindings.json' },
    { src: envPaths.argvJson, dest: 'argv.json' },
    { src: path.join(envPaths.geminiDir, 'GEMINI.md'), dest: 'GEMINI.md' },
    { src: path.join(envPaths.geminiConfigDir, 'mcp_config.json'), dest: 'mcp_config.json' },
    { src: path.join(envPaths.geminiConfigDir, 'skill-inventory.json'), dest: 'skill-inventory.json' },
  ];
  targets.push({ src: path.join(envPaths.geminiDir, 'antigravity', 'mcp_config.json'), dest: 'mcp-antigravity.json' });

  for (const t of targets) {
    if (fs.existsSync(t.src)) {
      const destPath = path.join(backupDir, t.dest);
      fs.copyFileSync(t.src, destPath);
      backedUp.push(t.dest);
    }
  }

  // Backup rules if directory exists
  if (fs.existsSync(envPaths.geminiRulesDir)) {
    const rulesBackup = path.join(backupDir, 'rules');
    fs.mkdirSync(rulesBackup, { recursive: true });
    for (const file of fs.readdirSync(envPaths.geminiRulesDir)) {
      const srcFile = path.join(envPaths.geminiRulesDir, file);
      if (fs.statSync(srcFile).isFile()) {
        fs.copyFileSync(srcFile, path.join(rulesBackup, file));
      }
    }
    backedUp.push('rules/');
  }

  // Save manifest
  for (const [source, name] of [
    [envPaths.geminiSkillsDir, 'skills'],
    [envPaths.geminiScriptsDir, 'scripts'],
    [path.join(envPaths.geminiConfigDir, 'agents'), 'agents'],
    [path.join(envPaths.geminiDir, 'antigravity', 'gsd-core'), 'gsd-core'],
    [path.join(envPaths.antigravityStateDir, 'jelly-cursor'), 'jelly-cursor'],
  ]) {
    if (fs.existsSync(source)) {
      fs.cpSync(source, path.join(backupDir, name), { recursive: true });
      backedUp.push(name + '/');
    }
  }
  const manifest = {
    date: new Date().toISOString(),
    label,
    backedUp,
    envPaths: {
      settingsJson: envPaths.settingsJson,
      keybindingsJson: envPaths.keybindingsJson,
      argvJson: envPaths.argvJson,
      geminiDir: envPaths.geminiDir,
    }
  };
  fs.writeFileSync(path.join(backupDir, 'backup-manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

  return { backupDir, backedUp };
}

function restoreBackup(backupDir, envPaths) {
  if (!fs.existsSync(backupDir)) {
    throw new Error(`Backup directory not found: ${backupDir}`);
  }

  const restored = [];
  for (const [name, target] of [
    ['skills', envPaths.geminiSkillsDir], ['scripts', envPaths.geminiScriptsDir],
    ['agents', path.join(envPaths.geminiConfigDir, 'agents')],
    ['gsd-core', path.join(envPaths.geminiDir, 'antigravity', 'gsd-core')],
    ['jelly-cursor', path.join(envPaths.antigravityStateDir, 'jelly-cursor')],
  ]) {
    const source = path.join(backupDir, name);
    if (fs.existsSync(source)) { fs.cpSync(source, target, { recursive: true }); restored.push(name + '/'); }
  }

  const targets = [
    { src: path.join(backupDir, 'settings.json'), dest: envPaths.settingsJson },
    { src: path.join(backupDir, 'keybindings.json'), dest: envPaths.keybindingsJson },
    { src: path.join(backupDir, 'argv.json'), dest: envPaths.argvJson },
    { src: path.join(backupDir, 'GEMINI.md'), dest: path.join(envPaths.geminiDir, 'GEMINI.md') },
    { src: path.join(backupDir, 'mcp_config.json'), dest: path.join(envPaths.geminiConfigDir, 'mcp_config.json') },
    { src: path.join(backupDir, 'skill-inventory.json'), dest: path.join(envPaths.geminiConfigDir, 'skill-inventory.json') },
  ];
  targets.push({ src: path.join(backupDir, 'mcp-antigravity.json'), dest: path.join(envPaths.geminiDir, 'antigravity', 'mcp_config.json') });

  for (const t of targets) {
    if (fs.existsSync(t.src)) {
      const destDir = path.dirname(t.dest);
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(t.src, t.dest);
      restored.push(path.basename(t.dest));
    }
  }

  const rulesBackup = path.join(backupDir, 'rules');
  if (fs.existsSync(rulesBackup)) {
    if (!fs.existsSync(envPaths.geminiRulesDir)) {
      fs.mkdirSync(envPaths.geminiRulesDir, { recursive: true });
    }
    for (const file of fs.readdirSync(rulesBackup)) {
      fs.copyFileSync(path.join(rulesBackup, file), path.join(envPaths.geminiRulesDir, file));
    }
    restored.push('rules/');
  }

  return { restored };
}

function listBackups(envPaths) {
  if (!fs.existsSync(envPaths.backupsDir)) return [];
  const entries = fs.readdirSync(envPaths.backupsDir, { withFileTypes: true });
  return entries
    .filter(e => e.isDirectory() && e.name.startsWith('setup-backup-'))
    .map(e => {
      const dirPath = path.join(envPaths.backupsDir, e.name);
      let manifest = null;
      try {
        manifest = JSON.parse(fs.readFileSync(path.join(dirPath, 'backup-manifest.json'), 'utf8'));
      } catch (_) {}
      return {
        name: e.name,
        path: dirPath,
        date: manifest ? manifest.date : fs.statSync(dirPath).mtime.toISOString(),
        manifest,
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

module.exports = { createBackup, restoreBackup, listBackups };
