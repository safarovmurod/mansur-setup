'use strict';

const fs = require('fs');
const path = require('path');
const owned = require('./owned-files');
const { languageCacheFile } = require('./profile-settings');

function managedFiles(env) {
  return [
    [languageCacheFile(env), 'languagepacks.json'],
    [path.join(env.geminiConfigDir, 'mansur-setup/editor-profile.json'), 'editor-profile.json'],
    [env.settingsJson, 'settings.json'], [env.keybindingsJson, 'keybindings.json'], [env.argvJson, 'argv.json'],
    [path.join(env.geminiDir, 'GEMINI.md'), 'GEMINI.md'],
    [path.join(env.geminiDir, 'antigravity/settings.json'), 'antigravity-settings.json'],
    [path.join(env.geminiConfigDir, 'hooks.json'), 'hooks.json'],
    [path.join(env.geminiConfigDir, 'config.json'), 'gemini-config.json'],
    [path.join(env.geminiConfigDir, 'mcp_config.json'), 'mcp_config.json'],
    [path.join(env.geminiConfigDir, 'skill-inventory.json'), 'skill-inventory.json'],
    [path.join(env.geminiDir, 'antigravity/mcp_config.json'), 'mcp-antigravity.json'],
    [owned.statePath(env), 'setup-installation.json'],
    ...['.gsd-profile', 'gsd-install-state.json', 'gsd-file-manifest.json'].map(name => [path.join(env.geminiDir, 'antigravity', name), 'antigravity-runtime/' + name]),
    ...['package.json', 'package-lock.json'].map(name => [path.join(env.geminiConfigDir, 'mcp-runtime', name), 'mcp-runtime/' + name]),
  ].map(([src, dest]) => ({ src, dest }));
}

function checkTree(directory) {
  owned.guard(path.dirname(directory), path.basename(directory));
  if (!fs.existsSync(directory)) return;
  if (!fs.statSync(directory).isDirectory()) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = owned.guard(directory, entry.name);
    if (entry.isDirectory()) checkTree(file);
  }
}

function createBackup(envPaths, label = 'installer') {
  checkTree(languageCacheFile(envPaths));
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(envPaths.backupsDir, `setup-backup-${label}-${timestamp}-${require('node:crypto').randomUUID()}`);
  owned.guard(envPaths.backupsDir, path.basename(backupDir));
  const targets = managedFiles(envPaths);
  for (const target of targets) checkTree(target.src);
  for (const source of [path.join(envPaths.geminiConfigDir, 'mansur-setup/editor-profile.json'), envPaths.settingsJson, envPaths.keybindingsJson, envPaths.argvJson, path.join(envPaths.geminiDir, 'GEMINI.md'), envPaths.geminiRulesDir, envPaths.geminiSkillsDir, envPaths.geminiScriptsDir,
    path.join(envPaths.geminiConfigDir, 'agents'), path.join(envPaths.geminiDir, 'antigravity/gsd-core'), path.join(envPaths.geminiDir, 'antigravity/hooks'), path.join(envPaths.antigravityStateDir, 'jelly-cursor'), path.join(envPaths.geminiConfigDir, 'mansur-unified'),
    path.join(envPaths.geminiDir, 'antigravity/settings.json'), path.join(envPaths.geminiConfigDir, 'hooks.json'), path.join(envPaths.geminiConfigDir, 'config.json'),
    path.join(envPaths.geminiDir, 'skills'), path.join(envPaths.geminiDir, 'antigravity/scripts'), path.join(envPaths.geminiDir, 'antigravity/skills'),
    ...['.gsd-profile', 'gsd-install-state.json', 'gsd-file-manifest.json'].map(name => path.join(envPaths.geminiDir, 'antigravity', name)),
    ...['package.json', 'package-lock.json'].map(name => path.join(envPaths.geminiConfigDir, 'mcp-runtime', name)),
    path.join(envPaths.geminiConfigDir, 'mcp_config.json'), path.join(envPaths.geminiDir, 'antigravity/mcp_config.json'), owned.statePath(envPaths)]) checkTree(source);

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true, mode: 0o700 });
  }

  const backedUp = [];

  for (const t of targets) {
    if (fs.existsSync(t.src)) {
      const destPath = path.join(backupDir, t.dest);
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(t.src, destPath);
      backedUp.push(t.dest);
    }
  }

  // Backup rules if directory exists
  if (fs.existsSync(envPaths.geminiRulesDir)) {
    const rulesBackup = path.join(backupDir, 'rules');
    fs.cpSync(envPaths.geminiRulesDir, rulesBackup, { recursive: true });
    backedUp.push('rules/');
  }

  // Save manifest
  for (const [source, name] of [
    [envPaths.geminiSkillsDir, 'skills'],
    [envPaths.geminiScriptsDir, 'scripts'],
    [path.join(envPaths.geminiConfigDir, 'agents'), 'agents'],
    [path.join(envPaths.geminiDir, 'antigravity', 'gsd-core'), 'gsd-core'],
    [path.join(envPaths.geminiDir, 'antigravity', 'hooks'), 'hooks'],
    [path.join(envPaths.antigravityStateDir, 'jelly-cursor'), 'jelly-cursor'],
    [path.join(envPaths.geminiConfigDir, 'mansur-unified'), 'mansur-unified'],
    [path.join(envPaths.geminiDir, 'skills'), 'global-skills'],
    [path.join(envPaths.geminiDir, 'antigravity', 'skills'), 'antigravity-runtime/skills'],
    [path.join(envPaths.geminiDir, 'antigravity', 'scripts'), 'antigravity-runtime/scripts'],
  ]) {
    if (fs.existsSync(source)) {
      fs.cpSync(source, path.join(backupDir, name), { recursive: true });
      backedUp.push(name + '/');
    }
  }
  const manifest = {
    schemaVersion: 2,
    absent: targets.filter(target => !fs.existsSync(target.src)).map(target => target.dest),
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

function restoreBackup(backupDir, envPaths, options = {}) {
  if (!fs.existsSync(backupDir)) {
    throw new Error(`Backup directory not found: ${backupDir}`);
  }

  const restored = [];
  checkTree(languageCacheFile(envPaths));
  checkTree(backupDir);
  const fileTargets = managedFiles(envPaths);
  for (const target of fileTargets) checkTree(target.src);
  const manifestPath = path.join(backupDir, 'backup-manifest.json');
  const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};
  const absent = manifest.schemaVersion === 2 ? manifest.absent : [];
  if (!Array.isArray(absent) || new Set(absent).size !== absent.length
    || absent.some(name => !fileTargets.some(target => target.dest === name) || fs.existsSync(path.join(backupDir, name)))) {
    throw new Error('Invalid absent-file backup manifest; nothing restored');
  }
  const removeAbsent = fileTargets.filter(target => absent.includes(target.dest) && fs.existsSync(target.src));
  for (const target of removeAbsent) if (!fs.statSync(target.src).isFile()) throw new Error('Expected a configuration file: ' + target.src);
  // Validate all destinations before restoring any bytes.
  for (const directory of [path.join(envPaths.geminiConfigDir, 'mansur-setup/editor-profile.json'), envPaths.settingsJson, envPaths.keybindingsJson, envPaths.geminiRulesDir, envPaths.geminiSkillsDir, envPaths.geminiScriptsDir, path.join(envPaths.geminiConfigDir, 'agents'), path.join(envPaths.geminiDir, 'antigravity/gsd-core'), path.join(envPaths.geminiDir, 'antigravity/hooks'), path.join(envPaths.antigravityStateDir, 'jelly-cursor'), path.join(envPaths.geminiConfigDir, 'mansur-unified')]) checkTree(directory);
  for (const file of [envPaths.argvJson, path.join(envPaths.geminiDir, 'GEMINI.md'), path.join(envPaths.geminiDir, 'antigravity/settings.json'), path.join(envPaths.geminiConfigDir, 'hooks.json'), path.join(envPaths.geminiConfigDir, 'config.json'), path.join(envPaths.geminiConfigDir, 'mcp_config.json'), path.join(envPaths.geminiDir, 'antigravity/mcp_config.json'), owned.statePath(envPaths)]) checkTree(file);
  for (const relative of ['skills', 'antigravity/skills', 'antigravity/scripts', 'antigravity/.gsd-profile', 'antigravity/gsd-install-state.json', 'antigravity/gsd-file-manifest.json']) checkTree(path.join(envPaths.geminiDir, relative));
  for (const name of ['package.json', 'package-lock.json']) checkTree(path.join(envPaths.geminiConfigDir, 'mcp-runtime', name));
  const extras = owned.restorePayloadExtras(envPaths, backupDir, { dryRun: true });
  if (!options.dryRun) owned.restorePayloadExtras(envPaths, backupDir);
  for (const [name, target] of [
    ['skills', envPaths.geminiSkillsDir], ['scripts', envPaths.geminiScriptsDir],
    ['agents', path.join(envPaths.geminiConfigDir, 'agents')],
    ['gsd-core', path.join(envPaths.geminiDir, 'antigravity', 'gsd-core')],
    ['hooks', path.join(envPaths.geminiDir, 'antigravity', 'hooks')],
    ['jelly-cursor', path.join(envPaths.antigravityStateDir, 'jelly-cursor')],
    ['mansur-unified', path.join(envPaths.geminiConfigDir, 'mansur-unified')],
    ['global-skills', path.join(envPaths.geminiDir, 'skills')],
    ['antigravity-runtime/skills', path.join(envPaths.geminiDir, 'antigravity', 'skills')],
    ['antigravity-runtime/scripts', path.join(envPaths.geminiDir, 'antigravity', 'scripts')],
  ]) {
    const source = path.join(backupDir, name);
    if (fs.existsSync(source)) {
      if (!options.dryRun) fs.cpSync(source, target, { recursive: true });
      restored.push(name + '/');
    }
  }

  const targets = fileTargets.map(target => ({ src: path.join(backupDir, target.dest), dest: target.src }));

  for (const t of targets) {
    if (fs.existsSync(t.src)) {
      const destDir = path.dirname(t.dest);
      if (!options.dryRun) {
        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
        fs.copyFileSync(t.src, t.dest);
      }
      restored.push(path.basename(t.dest));
    }
  }

  const rulesBackup = path.join(backupDir, 'rules');
  if (fs.existsSync(rulesBackup)) {
    if (!options.dryRun && !fs.existsSync(envPaths.geminiRulesDir)) {
      fs.mkdirSync(envPaths.geminiRulesDir, { recursive: true });
    }
    if (!options.dryRun) fs.cpSync(rulesBackup, envPaths.geminiRulesDir, { recursive: true });
    restored.push('rules/');
  }

  if (!options.dryRun) {
    for (const target of removeAbsent) if (fs.existsSync(target.src)) fs.unlinkSync(target.src);
    const profileFile = path.join(envPaths.geminiConfigDir, 'mansur-setup/editor-profile.json');
    if (!fs.existsSync(path.join(backupDir, 'editor-profile.json')) && fs.existsSync(profileFile)) fs.unlinkSync(profileFile);
    if (!fs.existsSync(path.join(backupDir, 'setup-installation.json')) && fs.existsSync(owned.statePath(envPaths))) fs.unlinkSync(owned.statePath(envPaths));
  }
  return { restored, removed: [...new Set([...extras.removed, ...removeAbsent.map(target => target.src)])], preserved: extras.preserved, dryRun: !!options.dryRun };
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
