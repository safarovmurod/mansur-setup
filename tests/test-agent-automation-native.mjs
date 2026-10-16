// Opt-in: supply the audited official 2.5.5 out/main.js, never a fabricated marker file.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
const require = createRequire(import.meta.url);
const { update, restoreAutomation, queueAutomation, validateNative, readPolicies, POLICIES } = require('../lib/agent-automation');
const { TOPIC_KEY, stringField } = require('../lib/mcp-permissions');
const source = process.env.MANSUR_ANTIGRAVITY_MAIN;
if (!source) throw new Error('Set MANSUR_ANTIGRAVITY_MAIN to the official 2.5.5 out/main.js');
const native = fs.readFileSync(source);
test('The official embedded Topic/Primitive schema decodes the generated native preferences', () => {
  const runtime = process.env.MANSUR_PROTOBUF_RUNTIME;
  if (!runtime) throw new Error('Set MANSUR_PROTOBUF_RUNTIME to an isolated @bufbuild/protobuf 2.9.0 installation; see docs/AGENT-AUTOMATION.md');
  const { fromBinary, toBinary } = require(runtime);
  const { FileDescriptorProtoSchema } = require(path.join(runtime, 'dist/cjs/wkt/index.js'));
  const { fileDesc, messageDesc } = require(path.join(runtime, 'dist/cjs/codegenv2/index.js'));
  const encoded = native.toString('utf8').match(/rE=Uo\("([A-Za-z0-9+/]+)"/)[1];
  const descriptor = fromBinary(FileDescriptorProtoSchema, Buffer.from(encoded, 'base64'));
  assert.equal(descriptor.name, 'exa/unified_state_sync_pb/unified_state_sync.proto');
  // Keep the seven self-contained native messages; later cache messages import other schemas.
  descriptor.dependency = []; descriptor.messageType = descriptor.messageType.slice(0, 7);
  const file = fileDesc(Buffer.from(toBinary(FileDescriptorProtoSchema, descriptor)).toString('base64'));
  const topic = fromBinary(messageDesc(file, 0), Buffer.from(require('../lib/agent-automation').mergePolicies('', false), 'base64'));
  for (const [key, row] of Object.entries(topic.data)) {
    const primitive = fromBinary(messageDesc(file, 4), Buffer.from(row.value, 'base64'));
    assert.deepEqual(primitive.value, { case: 'int32Value', value: POLICIES[key] });
  }
  assert.deepEqual(Object.keys(topic.data).sort(), Object.keys(POLICIES).sort());
});
function fixture(t) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'mansur native '));
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  const env = { ideRoot: path.join(home, 'IDE'), userSettingsDir: path.join(home, 'User'), backupsDir: path.join(home, 'backups'), geminiConfigDir: path.join(home, 'gemini-config') };
  const out = path.join(env.ideRoot, 'resources/app/out');
  fs.mkdirSync(out, { recursive: true }); fs.writeFileSync(path.join(out, 'main.js'), native);
  fs.writeFileSync(path.join(out, '../product.json'), JSON.stringify({ ideVersion: '2.5.5' }));
  const dbFile = path.join(env.userSettingsDir, 'globalStorage/state.vscdb');
  fs.mkdirSync(path.dirname(dbFile), { recursive: true });
  const db = new DatabaseSync(dbFile);
  db.exec('CREATE TABLE ItemTable(key TEXT PRIMARY KEY,value TEXT)');
  db.prepare('INSERT INTO ItemTable VALUES(?,?)').run('private-account-row', 'PRIVATE-RETAIN');
  db.close();
  return { home, env, dbFile, out };
}
test('Official-build SQLite write/readback, repeat and scoped restore preserve private account rows', t => {
  const f = fixture(t), options = { isRunning: () => false };
  assert.equal(validateNative(f.env), null);
  assert.equal(update(f.env, { ...options, dryRun: true }).wouldChange, true);
  assert.equal(fs.existsSync(f.env.backupsDir), false);
  const result = update(f.env, options);
  assert.equal(result.applied, true); assert.equal(result.changed, true); assert.equal(result.runtimeVerified, false);
  assert.deepEqual(result.storedPolicies, POLICIES);
  assert.equal(update(f.env, options).changed, false);
  const db = new DatabaseSync(f.dbFile); t.after(() => db.close());
  assert.equal(db.prepare('SELECT value FROM ItemTable WHERE key=?').get('private-account-row').value, 'PRIVATE-RETAIN');
  const request = path.join(f.env.geminiConfigDir, 'mansur-setup/automation/request.json');
  fs.mkdirSync(path.dirname(request), { recursive: true });
  fs.writeFileSync(request, JSON.stringify({ env: f.env, includeMcp: true }));
  assert.equal(restoreAutomation(f.env, result.backup, options).applied, true);
  assert.equal(JSON.parse(fs.readFileSync(request)).cancelled, true);
  assert.equal(db.prepare('SELECT value FROM ItemTable WHERE key=?').get(TOPIC_KEY), undefined);
  assert.equal(db.prepare('SELECT value FROM ItemTable WHERE key=?').get('private-account-row').value, 'PRIVATE-RETAIN');
});
test('Running IDE, WAL, modified build and a restart during the transaction cannot publish new preferences', t => {
  const f = fixture(t);
  assert.equal(update(f.env, { isRunning: () => true }).deferred, true);
  assert.equal(fs.existsSync(f.env.backupsDir), false);
  fs.writeFileSync(f.dbFile + '-wal', 'pending');
  assert.equal(update(f.env, { isRunning: () => false }).deferred, true);
  fs.unlinkSync(f.dbFile + '-wal');
  let checks = 0;
  assert.throws(() => update(f.env, { isRunning: () => ++checks > 1 }), /restarted/);
  const db = new DatabaseSync(f.dbFile);
  assert.equal(db.prepare('SELECT value FROM ItemTable WHERE key=?').get(TOPIC_KEY), undefined); db.close();
  fs.appendFileSync(path.join(f.out, 'main.js'), '\n// changed');
  assert.match(update(f.env, { isRunning: () => false }).reason, /Unaudited/);
});
test('A real detached worker uses the installed runtime and applies only after a normal IDE shutdown', { skip: process.platform === 'win32' }, async t => {
  const f = fixture(t), bin = path.join(f.home, 'bin'), marker = path.join(f.home, 'ide-open');
  fs.mkdirSync(bin); fs.writeFileSync(marker, 'open');
  const quote = s => "'" + s.replaceAll("'", "'\\''") + "'";
  fs.writeFileSync(path.join(bin, 'tasklist.exe'), '#!/bin/sh\nif test -f ' + quote(marker) + '; then printf \'"Antigravity IDE.exe","123"\\n\'; fi\n', { mode: 0o755 });
  const original = process.env.PATH; let result;
  try { process.env.PATH = bin + path.delimiter + original; result = queueAutomation(f.env); }
  finally { process.env.PATH = original; }
  assert.equal(result.queued, true); assert.equal(result.applied, false);
  const deadline = Date.now() + 10000;
  while (!fs.existsSync(result.statusFile) && Date.now() < deadline) await new Promise(r => setTimeout(r, 20));
  assert.equal(JSON.parse(fs.readFileSync(result.statusFile)).state, 'waiting');
  await new Promise(r => setTimeout(r, 250));
  assert.equal(JSON.parse(fs.readFileSync(result.statusFile)).state, 'waiting');
  const pendingDb = new DatabaseSync(f.dbFile, { readOnly: true });
  assert.equal(pendingDb.prepare('SELECT value FROM ItemTable WHERE key=?').get(TOPIC_KEY), undefined); pendingDb.close();
  fs.unlinkSync(marker);
  let status;
  while (Date.now() < deadline) {
    status = JSON.parse(fs.readFileSync(result.statusFile));
    if (status.state !== 'waiting') break;
    await new Promise(r => setTimeout(r, 50));
  }
  assert.equal(status.state, 'applied', JSON.stringify(status));
  const db = new DatabaseSync(f.dbFile, { readOnly: true });
  assert.deepEqual(readPolicies(db.prepare('SELECT value FROM ItemTable WHERE key=?').get(TOPIC_KEY).value), POLICIES); db.close();
});
