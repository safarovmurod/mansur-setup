'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');

const BEGIN = '<!-- mansur-unified:begin -->';
const END = '<!-- mansur-unified:end -->';
const STATE = '.gemini/config/mansur-unified/.installation.json';
const RULES = ['core', 'full-stack', 'design', 'sources'];
const GUIDES = ['full-stack.md', 'design.md', 'source-adaptation.md'];
const MAPS = ['source-manifest.json', 'source-coverage.csv', 'source-sections.csv', 'requirements-map.csv'];
const FILES = [...RULES.map(name => '.gemini/config/rules/mansur-unified-' + name + '.md'),
  ...GUIDES.map(name => '.gemini/config/mansur-unified/guides/' + name),
  ...MAPS.map(name => '.gemini/config/mansur-unified/' + name)];
const GLOBAL = '.gemini/GEMINI.md';
const hash = content => crypto.createHash('sha256').update(content).digest('hex');
function globalText(home) {
  const content = read(home, GLOBAL);
  if (content === null) return '';
  try { return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(content); }
  catch { throw new Error('Global GEMINI.md is not valid UTF-8; no files changed'); }
}

function guard(home, relative) {
  const target = path.resolve(home, relative), distance = path.relative(home, target);
  if (!distance || distance.startsWith('..') || path.isAbsolute(distance)) throw new Error('Target outside selected home');
  let current = home;
  for (const part of ['', ...distance.split(path.sep)]) {
    current = path.join(current, part);
    let stat;
    try { stat = fs.lstatSync(current); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (stat && stat.isSymbolicLink()) throw new Error('Linked target is unsupported: ' + current);
  }
  return target;
}

function read(home, relative) {
  const target = guard(home, relative);
  return fs.existsSync(target) ? fs.readFileSync(target) : null;
}

function write(home, relative, content) {
  const target = guard(home, relative);
  if (content === null) { if (fs.existsSync(target)) fs.unlinkSync(target); return; }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const temporary = target + '.' + crypto.randomUUID() + '.tmp';
  try { fs.writeFileSync(temporary, content); fs.renameSync(temporary, target); }
  finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
}

function block(text) {
  const first = text.indexOf(BEGIN), last = text.indexOf(END);
  if ((first < 0) !== (last < 0) || (first >= 0 && last < first)
    || (first >= 0 && text.indexOf(BEGIN, first + BEGIN.length) >= 0)
    || (last >= 0 && text.indexOf(END, last + END.length) >= 0)) throw new Error('Broken unified markers; no files changed');
  return first < 0 ? null : { first, last: last + END.length, text: text.slice(first, last + END.length) };
}

function loadState(home) {
  const content = read(home, STATE);
  if (!content) return null;
  const state = JSON.parse(content);
  if (state.schema !== 1 || state.contract !== 'mansur-unified-v1' || !Array.isArray(state.files)
    || state.files.length !== FILES.length || new Set(state.files.map(file => file.relative)).size !== FILES.length
    || state.files.some(file => !FILES.includes(file.relative) || !/^[a-f0-9]{64}$/.test(file.installedHash))
    || !/^[a-f0-9]{64}$/.test(state.globalBlockHash)) {
    throw new Error('Invalid unified installation registry; no files changed');
  }
  return state;
}

function checkOwned(home, state) {
  for (const file of state.files) {
    const current = read(home, file.relative);
    if (!current || hash(current) !== file.installedHash) throw new Error('Unified conflict: edited or missing ' + file.relative + '; preserve and reconcile it before update/removal');
  }
  const currentBlock = block(globalText(home));
  if (!currentBlock || hash(currentBlock.text) !== state.globalBlockHash) throw new Error('Unified conflict: global block edited or missing; no files changed');
}

function transaction(home, plans, action, backupRelative, onProgress = () => {}) {
  const changes = plans.filter(item => {
    const old = read(home, item.relative);
    return item.content === null ? old !== null : old === null || !old.equals(item.content);
  });
  if (!changes.length) return { changed: [], backup: null };
  const relative = backupRelative || '.gemini/backups/mansur-unified-' + Date.now() + '-' + crypto.randomUUID();
  const backup = guard(home, relative);
  fs.mkdirSync(backup, { recursive: true, mode: 0o700 });
  const records = changes.map((item, index) => {
    const old = read(home, item.relative), file = index + '.bak';
    if (old !== null) fs.writeFileSync(path.join(backup, file), old, { mode: 0o600 });
    return { relative: item.relative, file, existed: old !== null,
      beforeHash: old === null ? null : hash(old), installedHash: item.content === null ? null : hash(item.content) };
  });
  const manifest = { schema: 1, contract: 'mansur-unified-v1', home, action, status: 'pending', records };
  fs.writeFileSync(path.join(backup, 'manifest.json'), JSON.stringify(manifest, null, 2), { mode: 0o600 });
  let written = 0;
  try {
    for (const item of changes) {
      write(home, item.relative, item.content); written++;
      onProgress({ completed: written, total: changes.length, relative: item.relative });
    }
    write(home, relative + '/manifest.json', Buffer.from(JSON.stringify({ ...manifest, status: 'complete' }, null, 2)));
  }
  catch (error) {
    try {
      for (let index = written - 1; index >= 0; index--) {
        const record = records[index];
        write(home, record.relative, record.existed ? fs.readFileSync(path.join(backup, record.file)) : null);
      }
    } catch (rollbackError) { throw new Error('Unified operation failed; rollback incomplete. Backup: ' + backup + '; ' + error.message + '; ' + rollbackError.message); }
    throw new Error('Unified operation failed and was rolled back. Backup: ' + backup + '; ' + error.message);
  }
  return { changed: changes.map(item => guard(home, item.relative)), backup };
}

function install(options = {}) {
  if (Number(process.versions.node.split('.')[0]) < 24) throw new Error('Unified setup requires Node.js >=24');
  const home = path.resolve(options.home || os.homedir());
  const sourceRoot = path.resolve(options.sourceRoot || path.join(__dirname, '..'));
  const displayName = options.displayName || 'Мансур';
  if (typeof displayName !== 'string' || !displayName.trim() || /[\r\n]/.test(displayName) || displayName.length > 80
    || displayName.includes(BEGIN) || displayName.includes(END)) throw new Error('Invalid display name');
  const state = loadState(home);
  if (state) checkOwned(home, state);
  const plans = FILES.map(relative => {
    const name = path.basename(relative);
    const source = relative.includes('/rules/') ? path.join(sourceRoot, 'rules', name.replace('.md', '.template.md'))
      : path.join(sourceRoot, 'config/mansur-unified', relative.split('/mansur-unified/')[1]);
    const content = fs.readFileSync(source);
    return { relative, content: relative.includes('/rules/') ? Buffer.from(content.toString().replaceAll('{{DISPLAY_NAME}}', displayName)) : content };
  });
  for (const name of RULES) {
    const content = plans.find(item => item.relative.endsWith('mansur-unified-' + name + '.md')).content.toString();
    const trigger = name === 'core' ? 'always_on' : 'model_decision';
    if (!content.startsWith('---\ntrigger: ' + trigger + '\n')) throw new Error('Invalid unified rule frontmatter: ' + name);
  }
  const manifest = JSON.parse(plans.find(item => item.relative.endsWith('/source-manifest.json')).content);
  if (manifest.contract !== 'mansur-unified-v1') throw new Error('Invalid unified source manifest');
  const oldGlobal = globalText(home);
  const existingBlock = block(oldGlobal);
  if (!state && existingBlock) throw new Error('Unregistered unified global block; preserve it before adopting this installation');
  if (!state) for (const item of plans) {
    if (read(home, item.relative) !== null) throw new Error('Unmanaged unified file already exists: ' + item.relative + '; no overwrite');
  }
  const core = plans[0].content.toString().replace(/^---\n[\s\S]*?\n---\n/, '').trim();
  const globalBlock = BEGIN + '\n' + core + '\n' + END;
  let foreign = oldGlobal;
  if (existingBlock) {
    let after = oldGlobal.slice(existingBlock.last);
    if (after.startsWith('\n')) after = after.slice(1);
    foreign = oldGlobal.slice(0, existingBlock.first) + after;
  }
  // Keep the independent core ahead of legacy loaders and discovery length limits.
  const newGlobal = globalBlock + '\n' + foreign;
  const backupRelative = '.gemini/backups/mansur-unified-' + Date.now() + '-' + crypto.randomUUID();
  const next = { schema: 1, contract: 'mansur-unified-v1', globalBlockHash: hash(globalBlock),
    files: plans.map(item => ({ relative: item.relative, installedHash: hash(item.content) })) };
  plans.push({ relative: GLOBAL, content: Buffer.from(newGlobal) });
  plans.push({ relative: STATE, content: Buffer.from(JSON.stringify(next, null, 2) + '\n') });
  const changes = plans.filter(item => { const old = read(home, item.relative); return !old || !old.equals(item.content); });
  if (options.dryRun) return { success: true, dryRun: true, changed: changes.map(item => guard(home, item.relative)), backup: null };
  return { success: true, dryRun: false, ...transaction(home, plans, 'install', backupRelative, options.onProgress) };
}

function uninstall(options = {}) {
  const home = path.resolve(options.home || os.homedir()), state = loadState(home);
  if (!state) return { changed: [], backup: null, dryRun: !!options.dryRun };
  checkOwned(home, state);
  const plans = state.files.map(file => ({ relative: file.relative, content: null }));
  const global = globalText(home), owned = block(global);
  let after = global.slice(owned.last);
  // Only remove the single separator inserted by installation.
  if (after.startsWith('\n')) after = after.slice(1);
  const foreign = global.slice(0, owned.first) + after;
  plans.push({ relative: GLOBAL, content: foreign.length ? Buffer.from(foreign) : null }, { relative: STATE, content: null });
  if (options.dryRun) return { dryRun: true, changed: plans.map(item => guard(home, item.relative)), backup: null };
  return { dryRun: false, ...transaction(home, plans, 'uninstall', undefined, options.onProgress) };
}

function latestBackup(options = {}) {
  const home = path.resolve(options.home || os.homedir());
  const root = guard(home, '.gemini/backups');
  if (!fs.existsSync(root)) throw new Error('No unified backups found; install or update rules first');
  const candidates = fs.readdirSync(root, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && /^mansur-unified-\d+-[a-f0-9-]+$/.test(entry.name))
    .map(entry => {
      const manifest = guard(home, '.gemini/backups/' + entry.name + '/manifest.json');
      return { name: entry.name, timestamp: Number(entry.name.split('-')[2]), modified: fs.existsSync(manifest) ? fs.statSync(manifest).mtimeMs : 0 };
    })
    .sort((a, b) => b.timestamp - a.timestamp || b.modified - a.modified || b.name.localeCompare(a.name));
  for (const candidate of candidates) {
    const relative = '.gemini/backups/' + candidate.name + '/manifest.json';
    const bytes = read(home, relative);
    if (!bytes) throw new Error('Newest unified backup is incomplete: ' + candidate.name + '; select an older backup explicitly');
    let manifest;
    try { manifest = JSON.parse(bytes); } catch { throw new Error('Invalid newest unified backup manifest: ' + candidate.name); }
    if (manifest.schema !== 1 || manifest.contract !== 'mansur-unified-v1' || path.resolve(manifest.home || '') !== home
      || !['install', 'uninstall', 'restore'].includes(manifest.action)) throw new Error('Invalid newest unified backup or wrong home');
    if (manifest.status === 'pending') continue; // Failed/interrupted operation is never selected automatically.
    if (manifest.status !== undefined && manifest.status !== 'complete') throw new Error('Invalid unified backup status');
    // Legacy backups have no completion field; restore still verifies every record and current hash.
    return guard(home, '.gemini/backups/' + candidate.name);
  }
  throw new Error('No completed unified backups found; install or update rules first');
}

function restore(directory, options = {}) {
  const backup = directory ? path.resolve(directory) : latestBackup(options);
  const home = path.resolve(options.home || os.homedir());
  const relativeBackup = path.relative(home, backup);
  if (!/^\.gemini\/backups\/mansur-unified-[^/\\]+$/.test(relativeBackup.replaceAll(path.sep, '/'))) throw new Error('Backup outside unified backups');
  const manifestPath = guard(home, path.join(relativeBackup, 'manifest.json'));
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.schema !== 1 || manifest.contract !== 'mansur-unified-v1' || path.resolve(manifest.home) !== home
    || !Array.isArray(manifest.records) || !manifest.records.length || (manifest.status !== undefined && manifest.status !== 'complete')) throw new Error('Invalid, incomplete backup or wrong selected home');
  const allowed = [...FILES, GLOBAL, STATE];
  const seen = new Set();
  const plans = manifest.records.map(record => {
    if (!allowed.includes(record.relative) || seen.has(record.relative) || !/^[0-9]+\.bak$/.test(record.file)
      || typeof record.existed !== 'boolean' || ![record.beforeHash, record.installedHash].every(value => value === null || /^[a-f0-9]{64}$/.test(value))) throw new Error('Invalid backup record');
    seen.add(record.relative);
    const current = read(home, record.relative);
    if ((current === null ? null : hash(current)) !== record.installedHash) throw new Error('Restore conflict: changed ' + record.relative + '; no overwrite');
    let content = null;
    if (record.existed) {
      const original = guard(home, path.join(relativeBackup, record.file));
      content = fs.readFileSync(original);
      if (hash(content) !== record.beforeHash) throw new Error('Backup integrity mismatch: ' + record.file);
    }
    return { relative: record.relative, content };
  });
  if (options.dryRun) return { dryRun: true, sourceBackup: backup, changed: plans.map(item => guard(home, item.relative)), backup: null };
  return { dryRun: false, sourceBackup: backup, ...transaction(home, plans, 'restore', undefined, options.onProgress) };
}

module.exports = { install, uninstall, restore, latestBackup, FILES, STATE, BEGIN, END };
