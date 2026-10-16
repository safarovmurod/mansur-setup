import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { stringField, fields, readMcpPolicy } = require('../lib/mcp-permissions');
const { mergePolicies, readPolicies, restorePolicies, POLICIES, runWorker } = require('../lib/agent-automation');
const { mergeSettings, mergeKeybindings } = require('../lib/profile-settings');
const entry = (key, value) => stringField(1, Buffer.concat([stringField(1, key), stringField(2, stringField(1, value))]));
const integer = n => Buffer.from([16, n]).toString('base64');
function grantFields(value) {
  const row = fields(Buffer.from(value, 'base64')).find(f => fields(f.value).some(x => x.id === 1 && x.value.toString() === 'permission_grants_global'));
  const pair = fields(row.value), encoded = fields(pair.find(f => f.id === 2).value).find(f => f.id === 1).value.toString();
  return fields(Buffer.from(encoded, 'base64')).map(f => [f.id, f.value.toString()]);
}

test('Native modes use USS int32 rows; preserve secure mode, sandbox, denials and unrelated exact bytes; repeat is stable', () => {
  const foreign = entry('model', 'SENSITIVE-UNRELATED');
  const secure = entry('secureModeSentinelKey', Buffer.from([8, 1]).toString('base64'));
  const sandbox = entry('enableTerminalSandboxSentinelKey', Buffer.from([8, 1]).toString('base64'));
  const grants = entry('permission_grants_global', stringField(3, 'command(rm)').toString('base64'));
  const before = Buffer.concat([foreign, secure, sandbox, grants, entry(Object.keys(POLICIES)[0], integer(1))]).toString('base64');
  const next = mergePolicies(before);
  assert.deepEqual(readPolicies(next), { secureModeSentinelKey: 1, enableTerminalSandboxSentinelKey: 1, ...POLICIES });
  assert.deepEqual(fields(Buffer.from(next, 'base64')).slice(0, 3).map(f => f.raw), [foreign, secure, sandbox]);
  assert.deepEqual(readMcpPolicy(next), { allowed: true, conflicts: 0 });
  assert.deepEqual(grantFields(next), [[3, 'command(rm)'], [1, 'mcp(*)']]);
  assert.equal(mergePolicies(next), next);
  assert.deepEqual(readPolicies(mergePolicies('', false)), POLICIES);
  assert.equal(readMcpPolicy(mergePolicies('', false)).allowed, false);
});

test('Malformed types, invalid base64 and duplicate native rows are refused', () => {
  assert.throws(() => mergePolicies('not base64'));
  assert.throws(() => mergePolicies(Buffer.from([10, 100]).toString('base64')));
  const key = Object.keys(POLICIES)[0];
  assert.throws(() => mergePolicies(Buffer.concat([entry(key, integer(1)), entry(key, integer(3))]).toString('base64')), /Duplicate/);
  assert.throws(() => mergePolicies(entry(key, Buffer.from([8, 1]).toString('base64')).toString('base64')), /type/);
});

test('Restore removes newly added native rows and restores MCP while retaining later model and non-MCP changes', () => {
  const old = Buffer.concat([entry('model', 'OLD'), entry('permission_grants_global', stringField(3, 'mcp(*)').toString('base64'))]).toString('base64');
  const later = Buffer.concat([entry('model', 'NEW'), entry('permission_grants_global', Buffer.concat([stringField(1, 'mcp(*)'), stringField(3, 'command(rm)')]).toString('base64')),
    ...Object.entries(POLICIES).map(([k, v]) => entry(k, integer(v)))]).toString('base64');
  const restored = restorePolicies(later, old, true);
  assert.deepEqual(readPolicies(restored), {});
  assert.ok(Buffer.from(restored, 'base64').includes(entry('model', 'NEW')));
  assert.deepEqual(readMcpPolicy(restored), { allowed: false, conflicts: 1 });
  assert.ok(Buffer.from(restored, 'base64').includes(Buffer.from(Buffer.concat([stringField(3, 'command(rm)'), stringField(3, 'mcp(*)')]).toString('base64'))));
});

test('Queued worker retries a clean shutdown, records actual result, and reports timeout/failure honestly', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mansur-worker-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const request = path.join(directory, 'request.json');
  fs.writeFileSync(request, JSON.stringify({ env: {}, includeMcp: true }));
  let calls = 0;
  const result = await runWorker(request, { intervalMs: 1, apply: () => ++calls < 3 ? { deferred: true } : { applied: true, runtimeVerified: false } });
  assert.equal(calls, 3); assert.equal(result.applied, true);
  assert.equal(JSON.parse(fs.readFileSync(path.join(directory, 'status.json'))).state, 'applied');
  await runWorker(request, { timeoutMs: 0 });
  assert.equal(JSON.parse(fs.readFileSync(path.join(directory, 'status.json'))).state, 'failed');
  fs.writeFileSync(request, JSON.stringify({ cancelled: true }));
  const cancelled = await runWorker(request, { apply: () => assert.fail('Cancelled work must not apply') });
  assert.equal(cancelled.cancelled, true);
  assert.equal(JSON.parse(fs.readFileSync(path.join(directory, 'status.json'))).state, 'cancelled');
});

test('Managed profile preserves unrelated settings, exclusion paths, explicit denials and personal shortcuts', () => {
  const current = { personal: 'keep', 'editor.fontSize': 12, 'files.watcherExclude': { '**/custom/**': true },
    'chat.tools.terminal.autoApprove': { 'npm install': false, rm: false, custom: true } };
  const managed = { 'editor.fontSize': 15, 'files.watcherExclude': { '**/node_modules/**': true }, 'chat.tools.terminal.autoApprove': { 'npm install': true, 'git status': true } };
  const next = mergeSettings(current, managed);
  assert.equal(next.personal, 'keep'); assert.equal(next['editor.fontSize'], 15);
  assert.deepEqual(next['files.watcherExclude'], { '**/custom/**': true, '**/node_modules/**': true });
  assert.deepEqual(next['chat.tools.terminal.autoApprove'], { 'npm install': false, rm: false, custom: true, 'git status': true });
  assert.deepEqual(mergeSettings(next, managed), next);
  const personal = { key: 'ctrl+alt+p', command: 'personal.command' };
  const bindings = [{ key: 'ctrl+f', command: 'managed.command' }];
  const nextBindings = mergeKeybindings([personal, { key: 'ctrl+f', command: 'old.command' }], bindings);
  assert.deepEqual(nextBindings, [personal, ...bindings]);
  assert.deepEqual(mergeKeybindings(nextBindings, bindings), nextBindings);
});
