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
  const res = spawnSync(cliPath, ['--install-extension', extensionId, '--force'], {
    encoding: 'utf8',
    windowsHide: true,
  });

  if (res.status === 0 || (res.stdout && res.stdout.includes('installed'))) {
    return { success: true };
  }

  // Some extensions output exit code 0 or warning
  const combined = (res.stdout || '') + ' ' + (res.stderr || '');
  if (combined.toLowerCase().includes('already installed') || combined.toLowerCase().includes('successfully installed')) {
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
  if (fs.existsSync(psScript) && process.platform === 'win32') {
    try {
      const psRes = spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', psScript], {
        encoding: 'utf8',
        windowsHide: true,
      });
      if (psRes.status === 0 || (psRes.stdout && psRes.stdout.includes('VERIFIED'))) {
        log(`  Custom extension ${fullName} installed and verified via VSIX.`);
        return { success: true, method: 'vsix' };
      }
    } catch (_) {}
  }

  // Fallback direct copy to extensions directory
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  fs.copyFileSync(path.join(panelSourceDir, 'package.json'), path.join(targetDir, 'package.json'));
  fs.copyFileSync(path.join(panelSourceDir, 'extension.js'), path.join(targetDir, 'extension.js'));

  log(`  Custom extension copied directly to ${targetDir}`);
  return { success: true, method: 'direct-copy' };
}

module.exports = {
  getInstalledExtensions,
  installExtension,
  installCustomGithubPanel,
};
