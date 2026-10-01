#!/usr/bin/env node
'use strict';

const path = require('path');
const { runInstaller } = require('../lib/installer');
const { runDoctor } = require('../lib/doctor');
const { createBackup, restoreBackup, listBackups } = require('../lib/backup');
const { getEnvironmentPaths } = require('../lib/paths');

function parseArgs(args) {
  const result = {
    command: 'install',
    displayName: 'Мансур',
    dryRun: false,
    skipExtensions: false,
    backupDir: null,
    help: false,
    version: false,
  };

  const positional = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      result.help = true;
    } else if (arg === '--version' || arg === '-v') {
      result.version = true;
    } else if (arg === '--dry-run' || arg === '-d') {
      result.dryRun = true;
    } else if (arg === '--skip-extensions') {
      result.skipExtensions = true;
    } else if (arg === '--name' || arg === '-n') {
      if (args[i + 1] && !args[i + 1].startsWith('-')) {
        result.displayName = args[++i];
      }
    } else if (arg.startsWith('--name=')) {
      result.displayName = arg.slice(7);
    } else if (!arg.startsWith('-')) {
      positional.push(arg);
    }
  }

  if (positional.length > 0) {
    result.command = positional[0].toLowerCase();
    if (positional.length > 1) {
      result.backupDir = positional[1];
    }
  }

  return result;
}

function showHelp() {
  console.log(`
Mansur Antigravity Setup CLI

USAGE:
  npx mansur-antigravity-setup [command] [options]
  node bin/mansur-setup.js [command] [options]

COMMANDS:
  install             Apply the complete Antigravity setup (default)
  doctor              Diagnose prerequisites, paths, and settings health
  backup              Create a manual backup of current settings & rules
  restore [dir]       Restore previous settings from backup
  help                Show this help message

OPTIONS:
  --name, -n <name>   Set your preferred display name (default: "Мансур")
  --dry-run, -d       Preview changes without writing any files
  --skip-extensions   Configure settings & rules without downloading extensions
  --help, -h          Show help message
  --version, -v       Show package version

EXAMPLES:
  npx mansur-antigravity-setup install --name "Мансур"
  npx mansur-antigravity-setup install --dry-run
  npx mansur-antigravity-setup doctor
  npx mansur-antigravity-setup restore
`);
}

function main() {
  const args = process.argv.slice(2);
  const opts = parseArgs(args);

  if (opts.version) {
    const pkg = require('../package.json');
    console.log(`mansur-antigravity-setup v${pkg.version}`);
    process.exit(0);
  }

  if (opts.help || opts.command === 'help') {
    showHelp();
    process.exit(0);
  }

  const envPaths = getEnvironmentPaths();

  switch (opts.command) {
    case 'doctor': {
      const docRes = runDoctor();
      process.exit(docRes.ok ? 0 : 1);
      break;
    }

    case 'backup': {
      console.log('Creating manual backup of Antigravity settings...');
      const bRes = createBackup(envPaths, 'manual');
      console.log(`✓ Backup saved to: ${bRes.backupDir}`);
      console.log(`  Files included: ${bRes.backedUp.join(', ')}`);
      process.exit(0);
      break;
    }

    case 'restore': {
      let targetBackup = opts.backupDir;
      if (!targetBackup) {
        const backups = listBackups(envPaths);
        if (backups.length === 0) {
          console.error('No previous backups found in ' + envPaths.backupsDir);
          process.exit(1);
        }
        targetBackup = backups[0].path;
        console.log(`Restoring most recent backup: ${backups[0].name}`);
      }
      try {
        const rRes = restoreBackup(targetBackup, envPaths);
        console.log(`✓ Backup successfully restored from ${targetBackup}`);
        console.log(`  Restored items: ${rRes.restored.join(', ')}`);
        console.log('Please reload Antigravity window (Ctrl+Shift+P -> Reload Window).');
        process.exit(0);
      } catch (err) {
        console.error(`Restore failed: ${err.message}`);
        process.exit(1);
      }
      break;
    }

    case 'install':
    default: {
      try {
        const res = runInstaller({
          displayName: opts.displayName,
          dryRun: opts.dryRun,
          skipExtensions: opts.skipExtensions,
        });
        process.exit(res.success ? 0 : 1);
      } catch (err) {
        console.error(`\nInstallation failed: ${err.message}`);
        process.exit(1);
      }
      break;
    }
  }
}

if (require.main === module) {
  main();
}
