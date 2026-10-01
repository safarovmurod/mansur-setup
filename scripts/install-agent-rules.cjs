'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const mentor = require('./install-mentor-skill.cjs');

function guard(target, home) {
  const relative = path.relative(home, target);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Target outside selected home');
  let current = home;
  if (fs.existsSync(current) && fs.lstatSync(current).isSymbolicLink()) throw new Error('Linked home is unsupported');
  for (const part of relative.split(path.sep)) {
    current = path.join(current, part);
    if (fs.existsSync(current) && fs.lstatSync(current).isSymbolicLink()) throw new Error('Linked target is unsupported: ' + current);
  }
}

function atomicWrite(target, content) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const temporary = target + '.' + crypto.randomUUID() + '.tmp';
  try {
    fs.writeFileSync(temporary, content);
    fs.renameSync(temporary, target);
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
}

function plan(options = {}) {
  const home = path.resolve(options.home || os.homedir());
  const sourceRoot = path.resolve(options.sourceRoot || path.join(__dirname, '..'));
  const codexHome = path.resolve(options.codexHome || process.env.CODEX_HOME || path.join(home, '.codex'));
  // Restore records deliberately support files inside the selected user home only.
  guard(path.join(codexHome, 'AGENTS.md'), home);
  if (fs.existsSync(path.join(codexHome, 'AGENTS.override.md')) && fs.readFileSync(path.join(codexHome, 'AGENTS.override.md'), 'utf8').trim()) {
    throw new Error('AGENTS.override.md is active; review it before modifying AGENTS.md');
  }
  const plans = mentor.planInstall({ home, sourceRoot, shared: true });
  const target = path.join(codexHome, 'AGENTS.md');
  const old = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
  const begin = '<!-- mansur-agent-work:begin -->';
  const end = '<!-- mansur-agent-work:end -->';
  const startIndex = old.indexOf(begin), endIndex = old.indexOf(end);
  if ((startIndex < 0) !== (endIndex < 0) || (startIndex >= 0 && endIndex < startIndex)
    || (startIndex >= 0 && old.indexOf(begin, startIndex + begin.length) >= 0)
    || (endIndex >= 0 && old.indexOf(end, endIndex + end.length) >= 0)) throw new Error('Invalid agent-work markers; no files written');
  const block = begin + '\n' + fs.readFileSync(path.join(sourceRoot, 'config/ai/codex.md'), 'utf8').trimEnd() + '\n' + end;
  const content = startIndex >= 0
    ? old.slice(0, startIndex) + block + old.slice(endIndex + end.length)
    : old.trimEnd() + '\n\n' + block + '\n';
  plans.push({ target, content: Buffer.from(content) });
  plans.push({ target: path.join(home, '.gemini/config/rules/mansur-agent-work.md'), content: fs.readFileSync(path.join(sourceRoot, 'rules/mansur-agent-work.template.md')) });
  for (const item of plans) guard(item.target, home);
  return plans.filter(item => !fs.existsSync(item.target) || !fs.readFileSync(item.target).equals(item.content));
}

function install(options = {}) {
  const home = path.resolve(options.home || os.homedir());
  const plans = plan(options);
  if (options.dryRun || plans.length === 0) return { changed: plans.map(item => item.target), dryRun: !!options.dryRun, backup: null, chatgptApplied: false };
  const backup = path.join(home, '.gemini/backups', 'agent-work-' + new Date().toISOString().replace(/[:.]/g, '-') + '-' + crypto.randomUUID().slice(0, 8));
  guard(backup, home);
  fs.mkdirSync(backup, { recursive: true });
  const records = plans.map((item, index) => {
    const existed = fs.existsSync(item.target), file = index + '.bak';
    if (existed) fs.copyFileSync(item.target, path.join(backup, file));
    return { target: item.target, existed, file, installedHash: crypto.createHash('sha256').update(item.content).digest('hex') };
  });
  fs.writeFileSync(path.join(backup, 'manifest.json'), JSON.stringify({ home, records }, null, 2));
  let written = 0;
  try {
    for (const item of plans) { atomicWrite(item.target, item.content); written++; }
  } catch (error) {
    for (let index = written - 1; index >= 0; index--) {
      const record = records[index];
      if (record.existed) atomicWrite(record.target, fs.readFileSync(path.join(backup, record.file)));
      else fs.unlinkSync(record.target);
    }
    throw error;
  }
  return { changed: plans.map(item => item.target), backup, dryRun: false, chatgptApplied: false };
}

if (require.main === module) {
  try {
    const args = process.argv.slice(2), options = {};
    for (let index = 0; index < args.length; index++) {
      if (args[index] === '--dry-run') options.dryRun = true;
      else if (args[index] === '--home') {
        const value = args[++index];
        if (!value || value.startsWith('--')) throw new Error('--home needs a path');
        options.home = value;
      } else throw new Error('Unknown argument: ' + args[index]);
    }
    console.log(JSON.stringify(install(options), null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}

module.exports = { plan, install, restore: mentor.restore };
