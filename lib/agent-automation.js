'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const { DatabaseSync } = require('node:sqlite');
const { fields, stringField, TOPIC_KEY, mergeMcpGrant, isIdeRunning } = require('./mcp-permissions');

// Audited against the checksum-verified official Windows 2.5.5 installer.
// These are native USS Primitive.int32_value values, not settings.json keys.
const NATIVE_MAIN_SHA256 = '6f1a12099ac635d462bd7092357119ec1ec7516988cacb874b7e97691272b104';
const POLICIES = Object.freeze({ terminalAutoExecutionPolicySentinelKey: 3, artifactReviewPolicySentinelKey: 2 });

function decode(value) {
  if (typeof value !== 'string' || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) throw new Error('Invalid native preferences; no write');
  return Buffer.from(value, 'base64');
}
function entryData(entry) {
  if (entry.id !== 1 || entry.wire !== 2) return null;
  const pair = fields(entry.value), keys = pair.filter(f => f.id === 1 && f.wire === 2);
  if (keys.length !== 1) throw new Error('Invalid preference map key');
  return { pair, key: keys[0].value.toString('utf8') };
}
function replaceValue(entry, encoded) {
  const { pair } = entryData(entry);
  const rows = pair.filter(f => f.id === 2 && f.wire === 2);
  if (rows.length !== 1) throw new Error('Invalid native preference row');
  const row = fields(rows[0].value), values = row.filter(f => f.id === 1 && f.wire === 2);
  if (values.length !== 1) throw new Error('Invalid native preference value');
  decode(values[0].value.toString('utf8'));
  const next = Buffer.concat(row.map(f => f === values[0] ? stringField(1, encoded) : f.raw));
  return stringField(1, Buffer.concat(pair.map(f => f === rows[0] ? stringField(2, next) : f.raw)));
}
function mapEntry(key, encoded) {
  return stringField(1, Buffer.concat([stringField(1, key), stringField(2, stringField(1, encoded))]));
}
function readPolicies(value) {
  const result = {};
  for (const entry of fields(decode(value))) {
    const data = entryData(entry);
    if (!data || ![...Object.keys(POLICIES), 'secureModeSentinelKey', 'enableTerminalSandboxSentinelKey'].includes(data.key)) continue;
    if (Object.hasOwn(result, data.key)) throw new Error('Duplicate native preference');
    const rows = data.pair.filter(f => f.id === 2 && f.wire === 2);
    if (rows.length !== 1) throw new Error('Invalid native preference row');
    const values = fields(rows[0].value).filter(f => f.id === 1 && f.wire === 2);
    if (values.length !== 1) throw new Error('Invalid native preference value');
    const primitive = fields(decode(values[0].value.toString('utf8')));
    const kind = Object.hasOwn(POLICIES, data.key) ? 2 : 1;
    if (primitive.filter(f => f.wire === 0 && f.id === kind).length !== 1 || primitive.some(f => f.id <= 5 && f.id !== kind)) throw new Error('Unexpected native preference type');
    result[data.key] = primitive.find(f => f.id === kind).value;
  }
  return result;
}
function mergePolicies(value, includeMcp = true) {
  readPolicies(value); // Refuse malformed or duplicate policy rows before any mutation.
  const seen = new Set();
  const entries = fields(decode(value)).map(entry => {
    const data = entryData(entry);
    if (!data || !Object.hasOwn(POLICIES, data.key)) return entry.raw;
    seen.add(data.key);
    return replaceValue(entry, Buffer.from([16, POLICIES[data.key]]).toString('base64'));
  });
  for (const [key, mode] of Object.entries(POLICIES)) if (!seen.has(key)) entries.push(mapEntry(key, Buffer.from([16, mode]).toString('base64')));
  const next = Buffer.concat(entries).toString('base64');
  return includeMcp ? mergeMcpGrant(next, { allow: ['mcp(*)'], replaceMcpAskAndDeny: true }) : next;
}
function restorePolicies(current, saved, includeMcp) {
  // Restore only rows owned by this operation; preserve later model/account settings.
  const keys = new Set(Object.keys(POLICIES));
  const originals = new Map();
  for (const entry of fields(decode(saved))) {
    const data = entryData(entry);
    if (data && keys.has(data.key)) {
      if (originals.has(data.key)) throw new Error('Duplicate backup preference');
      originals.set(data.key, entry.raw);
    }
  }
  const next = [];
  const seen = new Set();
  for (const entry of fields(decode(current))) {
    const data = entryData(entry);
    if (!data || !keys.has(data.key)) { next.push(entry.raw); continue; }
    if (seen.has(data.key)) throw new Error('Duplicate current preference');
    seen.add(data.key);
    if (originals.has(data.key)) next.push(originals.get(data.key));
  }
  for (const [key, raw] of originals) if (!seen.has(key)) next.push(raw);
  let result = Buffer.concat(next).toString('base64');
  if (includeMcp) result = require('./mcp-permissions').restoreMcpGrants(result, saved);
  return result;
}
function assertNoLinks(file) {
  for (let cursor = path.resolve(file); ; cursor = path.dirname(cursor)) {
    try { if (fs.lstatSync(cursor).isSymbolicLink()) throw new Error('Linked automation path refused: ' + cursor); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (path.dirname(cursor) === cursor) break;
  }
}
function validateNative(env) {
  const app = path.join(env.ideRoot || '', 'resources', 'app');
  const productFile = path.join(app, 'product.json'), mainFile = path.join(app, 'out', 'main.js');
  if (!env.ideRoot || !fs.existsSync(productFile) || !fs.existsSync(mainFile)) return 'Antigravity installation not found';
  const product = JSON.parse(fs.readFileSync(productFile, 'utf8'));
  if (product.ideVersion !== '2.5.5' || crypto.createHash('sha256').update(fs.readFileSync(mainFile)).digest('hex') !== NATIVE_MAIN_SHA256) return 'Unaudited Antigravity build: native automation not changed';
  return null;
}
function savePrivate(file, value) {
  assertNoLinks(file);
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  const temporary = file + '.' + crypto.randomUUID() + '.tmp';
  try { fs.writeFileSync(temporary, value, { mode: 0o600 }); fs.renameSync(temporary, file); }
  finally { fs.rmSync(temporary, { force: true }); }
}
function update(env, options = {}) {
  const reason = validateNative(env);
  if (reason) return { applied: false, reason };
  const running = options.isRunning || isIdeRunning;
  if (running()) return { applied: false, deferred: true, reason: 'Waiting for all Antigravity windows to close normally' };
  const dbFile = path.join(env.userSettingsDir, 'globalStorage', 'state.vscdb');
  assertNoLinks(dbFile);
  if (!fs.existsSync(dbFile)) return { applied: false, reason: 'Open Antigravity once to initialize its profile, close it, then retry automation' };
  for (const suffix of ['-wal', '-shm']) if (fs.existsSync(dbFile + suffix)) return { applied: false, deferred: true, reason: 'Native profile still has a WAL/SHM file; waiting for a clean IDE shutdown' };
  const db = new DatabaseSync(dbFile, { readOnly: !!options.dryRun });
  try {
    const row = db.prepare('SELECT value FROM ItemTable WHERE key=?').get(TOPIC_KEY);
    const before = row?.value || '';
    const after = options.restore ? restorePolicies(before, options.restore.value, options.restore.includeMcp) : mergePolicies(before, options.includeMcp !== false);
    const policies = readPolicies(after);
    if (after === before) return { applied: true, changed: false, storedPolicies: policies, runtimeVerified: false };
    if (options.dryRun) return { applied: false, dryRun: true, wouldChange: true, storedPolicies: policies };
    const backup = path.join(env.backupsDir, 'agent-automation-' + crypto.randomUUID());
    assertNoLinks(backup);
    fs.mkdirSync(backup, { recursive: true, mode: 0o700 });
    db.prepare('VACUUM INTO ?').run(path.join(backup, 'state.vscdb'));
    fs.chmodSync(path.join(backup, 'state.vscdb'), 0o600);
    savePrivate(path.join(backup, 'agent-preferences.base64'), before);
    savePrivate(path.join(backup, 'manifest.json'), JSON.stringify({ format: 1, topicKey: TOPIC_KEY, hadTopic: !!row, includeMcp: options.restore ? options.restore.includeMcp : options.includeMcp !== false, mainSha256: NATIVE_MAIN_SHA256 }));
    db.exec('BEGIN IMMEDIATE');
    try {
      if (options.isCancelled?.()) throw new Error('Pending automation was cancelled');
      if (running()) throw new Error('Antigravity restarted; automation cancelled');
      if (db.prepare('SELECT value FROM ItemTable WHERE key=?').get(TOPIC_KEY)?.value !== row?.value) throw new Error('Native preferences changed concurrently; retry after closing IDE');
      if (options.restore && !options.restore.hadTopic && !after) db.prepare('DELETE FROM ItemTable WHERE key=?').run(TOPIC_KEY);
      else db.prepare('INSERT INTO ItemTable(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(TOPIC_KEY, after);
      const actual = db.prepare('SELECT value FROM ItemTable WHERE key=?').get(TOPIC_KEY)?.value || '';
      if (actual !== after || db.prepare('PRAGMA integrity_check').get().integrity_check !== 'ok') throw new Error('Native automation readback failed');
      db.exec('COMMIT');
      return { applied: true, changed: true, backup, storedPolicies: policies, runtimeVerified: false };
    } catch (error) { db.exec('ROLLBACK'); throw error; }
  } finally { db.close(); }
}
function restoreAutomation(env, directory, options = {}) {
  if (!directory) throw new Error('Specify the private agent-automation backup directory');
  assertNoLinks(directory);
  const backup = fs.realpathSync(directory), root = fs.realpathSync(env.backupsDir);
  if (path.dirname(backup).toLowerCase() !== root.toLowerCase() || !path.basename(backup).startsWith('agent-automation-')) throw new Error('Invalid automation backup directory');
  const manifest = JSON.parse(fs.readFileSync(path.join(backup, 'manifest.json'), 'utf8'));
  if (manifest.format !== 1 || manifest.topicKey !== TOPIC_KEY || manifest.mainSha256 !== NATIVE_MAIN_SHA256 || typeof manifest.hadTopic !== 'boolean' || typeof manifest.includeMcp !== 'boolean') throw new Error('Invalid automation backup manifest');
  const value = fs.readFileSync(path.join(backup, 'agent-preferences.base64'), 'utf8');
  readPolicies(value);
  const request = path.join(env.geminiConfigDir, 'mansur-setup', 'automation', 'request.json');
  if (fs.existsSync(request)) {
    const job = JSON.parse(fs.readFileSync(request, 'utf8'));
    savePrivate(request, JSON.stringify({ ...job, cancelled: true }));
  }
  return update(env, { ...options, restore: { ...manifest, value } });
}
function queueAutomation(env, options = {}) {
  const result = update(env, options);
  if (options.dryRun && result.deferred) return { ...result, dryRun: true, wouldQueue: true };
  if (!result.deferred || options.dryRun) return result;
  const directory = path.join(env.geminiConfigDir, 'mansur-setup', 'automation');
  const request = path.join(directory, 'request.json');
  assertNoLinks(directory);
  const statusFile = path.join(directory, 'status.json');
  // Keep the worker outside the bootstrap's temporary checkout, which is deleted.
  for (const name of ['agent-automation.js', 'mcp-permissions.js']) savePrivate(path.join(directory, name), fs.readFileSync(path.join(__dirname, name)));
  const job = { env, includeMcp: options.includeMcp !== false, requestedAt: new Date().toISOString() };
  savePrivate(request, JSON.stringify(job));
  let previous;
  try { previous = JSON.parse(fs.readFileSync(statusFile, 'utf8')); if (previous.state === 'waiting') process.kill(previous.pid, 0); else previous = null; } catch { previous = null; }
  if (previous) return { ...result, queued: true, statusFile };
  const child = spawn(process.execPath, [path.join(directory, 'agent-automation.js'), request], { detached: true, stdio: 'ignore', windowsHide: true });
  child.on('error', error => savePrivate(statusFile, JSON.stringify({ state: 'failed', reason: error.message })));
  if (!child.pid) return { applied: false, reason: 'Could not start the automation worker' };
  child.unref();
  return { ...result, queued: true, statusFile };
}
async function runWorker(request, options = {}) {
  const statusFile = path.join(path.dirname(request), 'status.json');
  savePrivate(statusFile, JSON.stringify({ state: 'waiting', pid: process.pid }));
  const deadline = Date.now() + (options.timeoutMs ?? 24 * 60 * 60 * 1000);
  const attempt = options.apply || update;
  while (Date.now() < deadline) {
    const job = JSON.parse(fs.readFileSync(request, 'utf8'));
    if (job.cancelled) {
      const result = { applied: false, cancelled: true };
      savePrivate(statusFile, JSON.stringify({ state: 'cancelled', ...result }));
      return result;
    }
    const result = attempt(job.env, { includeMcp: job.includeMcp,
      isCancelled: () => JSON.parse(fs.readFileSync(request, 'utf8')).cancelled === true });
    if (!result.deferred) {
      savePrivate(statusFile, JSON.stringify({ state: result.applied ? 'applied' : 'failed', completedAt: new Date().toISOString(), ...result }));
      return result;
    }
    await new Promise(resolve => setTimeout(resolve, options.intervalMs ?? 2000));
  }
  const result = { applied: false, reason: 'Waiting timed out; rerun mansur-setup automation after closing Antigravity' };
  savePrivate(statusFile, JSON.stringify({ state: 'failed', ...result }));
  return result;
}
if (require.main === module) runWorker(process.argv[2]).catch(error => {
  try { savePrivate(path.join(path.dirname(process.argv[2]), 'status.json'), JSON.stringify({ state: 'failed', reason: error.message })); } catch {}
  process.exitCode = 1;
});
module.exports = { POLICIES, NATIVE_MAIN_SHA256, readPolicies, mergePolicies, restorePolicies, validateNative, update, restoreAutomation, queueAutomation, runWorker };
