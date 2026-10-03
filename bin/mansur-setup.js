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
    skipAgentBrowser: false,
    skipFont: false,
    skipPermissions: false,
    rulesOnly: false,
    home: null,
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
    } else if (arg === '--skip-agent-browser') {
      result.skipAgentBrowser = true;
    } else if (arg === '--skip-font') {
      result.skipFont = true;
    } else if (arg === '--skip-permissions') {
      result.skipPermissions = true;
    } else if (arg === '--rules-only') {
      result.rulesOnly = true;
    } else if (arg === '--home') {
      if (!args[i + 1] || args[i + 1].startsWith('-')) throw new Error('--home needs a path');
      result.home = args[++i];
    } else if (arg === '--name' || arg === '-n') {
      if (args[i + 1] && !args[i + 1].startsWith('-')) {
        result.displayName = args[++i];
      }
    } else if (arg.startsWith('--name=')) {
      result.displayName = arg.slice(7);
    } else if (!arg.startsWith('-')) {
      positional.push(arg);
    } else {
      throw new Error('Unknown option: ' + arg);
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
  npx --yes github:safarovmurod/mansur-setup [command] [options]
  node bin/mansur-setup.js [command] [options]

COMMANDS:
  install             Apply the complete Antigravity setup (default)
  mentor              Update global frontend mentor and its rules only
  ai-rules            Update Codex + Antigravity rules, preserve other settings
  permissions         Apply global MCP auto-allow with Antigravity closed
  permissions-restore [dir] Restore only MCP preferences from a private backup
  doctor              Diagnose prerequisites, paths, and settings health
  backup              Create a manual backup of current settings & rules
  restore [dir]       Restore previous settings from backup
  unified-uninstall  Remove only the managed unified additions, preserve other setup
  unified-restore [dir] Undo latest completed unified operation; directory is optional
  help                Show this help message

OPTIONS:
  --name, -n <name>   Set your preferred display name (default: "Мансур")
  --dry-run, -d       Preview changes without writing any files
  --skip-extensions   Configure settings & rules without downloading extensions
  --skip-agent-browser Skip browser CLI/runtime installation
  --skip-font         Skip Windows font download/registration
  --skip-permissions  Preserve approvals; recommended inside Antigravity terminal
  --rules-only        Install/update unified rules and guides without settings, MCP or extensions
  --home <path>       Explicit user home for rules-only/unified operations (isolated tests)
  --help, -h          Show help message
  --version, -v       Show package version

EXAMPLES:
  npx --yes github:safarovmurod/mansur-setup install --skip-permissions --name "Мансур"
  npx --yes github:safarovmurod/mansur-setup install --dry-run
  npx --yes github:safarovmurod/mansur-setup unified-restore --dry-run
  npx --yes github:safarovmurod/mansur-setup mentor --dry-run
  npx --yes github:safarovmurod/mansur-setup doctor
`);
}

function main() {
  const args = process.argv.slice(2);
  if (args[0] === 'mentor' || args[0] === 'ai-rules') {
    const { spawnSync } = require('node:child_process');
    const result = spawnSync(process.execPath, [
      path.resolve(__dirname, args[0] === 'mentor' ? '../scripts/install-mentor-skill.cjs' : '../scripts/install-agent-rules.cjs'),
      ...args.slice(1),
    ], { stdio: 'inherit' });
    if (result.error) console.error(result.error.message);
    process.exit(result.status === null ? 1 : result.status);
  }
  const opts = parseArgs(args);
  if (opts.home && !(opts.command.startsWith('unified-') || (opts.command === 'install' && opts.rulesOnly))) {
    throw new Error('--home is supported only with install --rules-only or unified operations');
  }
  if (opts.rulesOnly && opts.command !== 'install') throw new Error('--rules-only needs install');

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
    case 'unified-uninstall':
    case 'unified-restore': {
      try {
        const unified = require('../lib/unified');
        const options = { home: opts.home, dryRun: opts.dryRun };
        console.log(JSON.stringify(opts.command === 'unified-uninstall'
          ? unified.uninstall(options) : unified.restore(opts.backupDir, options), null, 2));
      } catch (error) { console.error(error.message); process.exitCode = 1; }
      break;
    }
    case 'permissions-restore': {
      try {
        if (opts.dryRun) throw new Error('Use permissions --dry-run for preview; restore requires an explicit backup directory');
        const result = require('../lib/mcp-permissions').restoreMcpPermissions(envPaths, opts.backupDir);
        console.log(JSON.stringify(result, null, 2)); process.exit(0);
      } catch (error) { console.error(error.message); process.exit(1); }
      break;
    }
    case 'permissions': {
      try {
        const result = require('../lib/mcp-permissions').applyMcpPermissions(envPaths, { dryRun: opts.dryRun });
        console.log(JSON.stringify(result, null, 2));
        process.exit(result.applied || result.dryRun ? 0 : 1);
      } catch (error) { console.error(error.message); process.exit(1); }
      break;
    }
    case 'doctor': {
      const docRes = runDoctor();
      process.exit(docRes.ok ? 0 : 1);
      break;
    }

    case 'backup': {
      if (opts.dryRun) {
        console.log(`[DRY-RUN] Would create a manual setup backup under ${envPaths.backupsDir}; no files written.`);
        process.exit(0);
      }
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
        const rRes = restoreBackup(targetBackup, envPaths, { dryRun: opts.dryRun });
        console.log(opts.dryRun ? `[DRY-RUN] Would restore backup: ${targetBackup}` : `✓ Backup successfully restored from ${targetBackup}`);
        console.log(`  ${opts.dryRun ? 'Planned' : 'Restored'} items: ${rRes.restored.join(', ')}`);
        if (!opts.dryRun) console.log('Please reload Antigravity window (Ctrl+Shift+P -> Reload Window).');
        process.exit(0);
      } catch (err) {
        console.error(`Restore failed: ${err.message}`);
        process.exit(1);
      }
      break;
    }

    case 'install': {
      try {
        const res = runInstaller({
          displayName: opts.displayName,
          dryRun: opts.dryRun,
          skipExtensions: opts.skipExtensions,
          skipAgentBrowser: opts.skipAgentBrowser,
          skipFont: opts.skipFont,
          skipPermissions: opts.skipPermissions,
          rulesOnly: opts.rulesOnly,
          home: opts.home,
          log: opts.rulesOnly ? console.error : console.log,
        });
        if (opts.rulesOnly) console.log(JSON.stringify(res, null, 2));
        process.exit(res.success ? 0 : 1);
      } catch (err) {
        console.error(`\nInstallation failed: ${err.message}`);
        process.exit(1);
      }
      break;
    }
    default:
      console.error('Unknown command: ' + opts.command);
      process.exit(1);
  }
}

if (require.main === module) {
  main();
}
