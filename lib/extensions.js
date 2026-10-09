'use strict';

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

function getInstalledExtensions(cliPath) {
  if (!cliPath || !fs.existsSync(cliPath)) {
    return [];
  }
  try {
    const out = execSync(`"${cliPath}" --list-extensions --show-versions`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      windowsHide: true,
    });
    return out
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('[') && line.includes('@'))
      .map(line => {
        const at = line.lastIndexOf('@');
        return {
          id: line.slice(0, at).toLowerCase(),
          version: line.slice(at + 1),
          raw: line,
        };
      });
  } catch (_) {
    return [];
  }
}

function installExtension(cliPath, extensionId, options = {}) {
  const { dryRun = false, log = console.log } = options;
  if (dryRun) {
    log(`  [DRY-RUN] Would install extension: ${extensionId}`);
    return { success: true, dryRun: true };
  }
  if (!cliPath || !fs.existsSync(cliPath)) {
    throw new Error(`Antigravity IDE CLI not found for installing: ${extensionId}`);
  }

  log(`  Installing extension: ${extensionId}...`);
  if (!/^[a-z0-9][a-z0-9-]*\.[a-z0-9][a-z0-9-]*$/i.test(extensionId)) throw new Error('Invalid extension identifier');
  const isCmd = process.platform === 'win32' && /\.cmd$/i.test(cliPath);
  let res;
  if (isCmd) {
    try {
      execSync(`"${cliPath}" --install-extension ${extensionId} --force`, { windowsHide: true, stdio: 'inherit' });
      res = { status: 0 };
    } catch (error) { res = { status: error.status, stdout: String(error.stdout || ''), stderr: String(error.stderr || '') }; }
  } else res = spawnSync(cliPath, ['--install-extension', extensionId, '--force'], {
    stdio: 'inherit',
    windowsHide: true,
  });

  if (res.status === 0 && getInstalledExtensions(cliPath).some(item => item.id === extensionId.toLowerCase())) {
    return { success: true };
  }

  return {
    success: false,
    code: res.status,
    stdout: res.stdout,
    stderr: res.stderr,
  };
}

function installCustomGithubPanel(cliPath, extensionsDir, panelSourceDir, options = {}) {
  const { dryRun = false, log = console.log } = options;
  const manifestPath = path.join(panelSourceDir, 'package.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`mansur-github-panel package.json not found in ${panelSourceDir}`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const fullName = `${manifest.publisher}.${manifest.name}-${manifest.version}`;
  const targetDir = path.join(extensionsDir, fullName);

  if (dryRun) {
    log(`  [DRY-RUN] Would package and install custom extension ${fullName} to ${targetDir}`);
    return { success: true, dryRun: true };
  }

  log(`  Installing custom extension: ${fullName}...`);

  // Preferred route: If install-github-panel.ps1 exists and PowerShell is available, run it
  const psScript = path.join(panelSourceDir, 'install-github-panel.ps1');
  if (!options.isolated && fs.existsSync(psScript) && process.platform === 'win32') {
    try {
      const psRes = spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', psScript], {
        stdio: 'inherit',
        windowsHide: true,
        env: { ...process.env, PSModulePath: path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'Modules') },
      });
      if (psRes.status === 0 && getInstalledExtensions(cliPath).some(item => item.id === `${manifest.publisher}.${manifest.name}`.toLowerCase())) {
        log(`  Custom extension ${fullName} installed and verified via VSIX.`);
        return { success: true, method: 'vsix' };
      }
    } catch (_) {}
  }

  if (!options.isolated) return { success: false, method: 'unregistered' };

  // Fallback direct copy to extensions directory
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  fs.copyFileSync(path.join(panelSourceDir, 'package.json'), path.join(targetDir, 'package.json'));
  fs.copyFileSync(path.join(panelSourceDir, 'extension.js'), path.join(targetDir, 'extension.js'));

  log(`  Custom extension copied directly to ${targetDir}`);
  return { success: true, method: 'isolated-copy' };
}

function installStabilityHelper(cliPath, extensionsDir, sourceDir, options = {}) {
  const { dryRun = false, log = console.log, isolated = false } = options;
  const manifest = JSON.parse(fs.readFileSync(path.join(sourceDir, 'package.json'), 'utf8'));
  const id = manifest.publisher + '.' + manifest.name;
  if (id !== 'mansur.antigravity-stability-helper' || !/^\d+\.\d+\.\d+$/.test(manifest.version)) throw new Error('Unexpected stability helper identity');
  const files = ['package.json', 'extension.js', 'maintenance.cjs', 'README.md'];
  const target = path.join(extensionsDir, id + '-' + manifest.version);
  require('./owned-files').guard(extensionsDir, id + '-' + manifest.version + '/package.json');
  if (dryRun) { log('  [DRY-RUN] Would register stability helper ' + id + '@' + manifest.version); return { success: true, dryRun: true }; }
  if (isolated) {
    // Fixtures never invoke the real editor CLI or repair real extensions.
    fs.mkdirSync(target, { recursive: true });
    for (const name of files) fs.copyFileSync(path.join(sourceDir, name), path.join(target, name));
    return { success: true, method: 'isolated-copy' };
  }
  if (!cliPath || !fs.existsSync(cliPath)) return { success: false, reason: 'IDE CLI unavailable' };
  const artifact = path.join(sourceDir, 'mansur-antigravity-stability-' + manifest.version + '.vsix');
  if (!fs.existsSync(artifact)) throw new Error('Bundled stability VSIX missing');
  const expectedPackage = require(path.resolve(sourceDir, '../../scripts/package-stability.cjs')).buildVsix(path.resolve(sourceDir, '../..'));
  if (!fs.readFileSync(artifact).equals(expectedPackage.bytes)) throw new Error('Bundled helper package does not match its source');
  function sameInstalled() {
    const registered = getInstalledExtensions(cliPath).some(item => item.id === id && item.version === manifest.version);
    if (!registered || !fs.existsSync(path.join(target, 'package.json'))) return false;
    const actual = JSON.parse(fs.readFileSync(path.join(target, 'package.json'), 'utf8'));
    delete actual.__metadata;
    if (JSON.stringify(actual) !== JSON.stringify(manifest)) return false;
    return files.slice(1).every(name => fs.existsSync(path.join(target, name)) && fs.readFileSync(path.join(target, name)).equals(fs.readFileSync(path.join(sourceDir, name))));
  }
  if (!sameInstalled()) {
    // Backup the currently registered helper only, before replacing its package.
    const entriesFile = path.join(extensionsDir, 'extensions.json');
    const index = fs.existsSync(entriesFile) ? JSON.parse(fs.readFileSync(entriesFile, 'utf8')) : [];
    const backup = path.join(path.dirname(path.dirname(extensionsDir)), '.gemini/backups/stability-helper-' + Date.now());
    fs.mkdirSync(backup, { recursive: true });
    if (fs.existsSync(entriesFile)) fs.copyFileSync(entriesFile, path.join(backup, 'extensions-index.json'));
    for (const entry of index.filter(item => item.identifier?.id?.toLowerCase() === id)) {
      if (typeof entry.relativeLocation !== 'string' || !entry.relativeLocation.startsWith(id + '-') || /[/\\]/.test(entry.relativeLocation)) throw new Error('Unsafe registered helper location');
      const old = path.join(extensionsDir, entry.relativeLocation);
      if (fs.existsSync(old)) {
        if (fs.lstatSync(old).isSymbolicLink()) throw new Error('Linked helper directory unsupported');
        for (const name of files) {
          const oldFile = path.join(old, name);
          if (fs.existsSync(oldFile)) {
            if (fs.lstatSync(oldFile).isSymbolicLink()) throw new Error('Linked helper file unsupported');
            fs.copyFileSync(oldFile, path.join(backup, entry.relativeLocation + '-' + name));
          }
        }
      }
    }
    log('  Private helper backup: ' + backup);
    if (process.platform === 'win32' && /\.cmd$/i.test(cliPath)) {
      if (/["%\r\n]/.test(cliPath + artifact)) throw new Error('Unsupported CLI/package path characters');
      execSync('"' + cliPath + '" --install-extension "' + artifact + '" --force', { stdio: 'inherit', windowsHide: true, timeout: 120000 });
    } else {
      const result = spawnSync(cliPath, ['--install-extension', artifact, '--force'], { stdio: 'inherit', windowsHide: true, timeout: 120000 });
      if (result.error || result.status !== 0) throw new Error('Helper CLI installation failed');
    }
  }
  if (!sameInstalled()) return { success: false, reason: 'Helper registration/source verification failed' };
  // Repair immediately for an already-running IDE; activation also rechecks later.
  const maintenance = require(path.join(sourceDir, 'maintenance.cjs'));
  const repair = maintenance.runMaintenance({ extensionsDir, backupDir: path.join(path.dirname(path.dirname(extensionsDir)), '.gemini/backups/antigravity-extension-maintenance'), repair: true });
  log('  Stability helper registered; known fixes: ' + repair.targets.map(item => item.id + '=' + item.status).join(', '));
  if (repair.reviewRequired) log('  Unknown vendor versions/code preserved; review required.');
  return { success: true, method: 'vsix', maintenance: repair };
}

module.exports = {
  getInstalledExtensions,
  installExtension,
  installCustomGithubPanel,
  installStabilityHelper,
};
