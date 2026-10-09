import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { inflateRawSync } from 'node:zlib';
const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, '..');
const { buildVsix } = require('../scripts/package-stability.cjs');

test('Published stability VSIX reproduces source bytes and its MIT license', () => {
  const result = buildVsix();
  assert.deepEqual(fs.readFileSync(result.file), result.bytes);
  let offset = 0;
  const names = [];
  while (result.bytes.readUInt32LE(offset) === 0x04034b50) {
    const header = result.bytes.subarray(offset, offset + 30);
    const size = header.readUInt32LE(18), nameSize = header.readUInt16LE(26), extraSize = header.readUInt16LE(28);
    const name = result.bytes.subarray(offset + 30, offset + 30 + nameSize).toString('utf8');
    const start = offset + 30 + nameSize + extraSize;
    const bytes = inflateRawSync(result.bytes.subarray(start, start + size));
    names.push(name);
    if (name.startsWith('extension/')) {
      const source = name === 'extension/LICENSE.txt' ? path.join(root, 'LICENSE') : path.join(root, 'extensions/mansur-antigravity-stability', name.slice(10));
      assert.deepEqual(bytes, fs.readFileSync(source), name);
    }
    offset = start + size;
  }
  assert.equal(names.length, 7);
  assert.equal(result.bytes.readUInt32LE(offset), 0x02014b50);
});

for (const [name, file, count] of [
  ['Global helper concurrency, lifecycle and manual recovery', 'stability-helper.cjs', 12],
  ['Maintenance backups, unknown versions, traversal and update races', 'stability-maintenance.cjs', 18],
]) {
  test(name, () => {
    const result = execFileSync(process.execPath, [path.join(root, 'tests/fixtures', file)], { encoding: 'utf8', timeout: 20000 });
    assert.equal(JSON.parse(result).passed, count);
  });
}

test('New inventory includes Android without requiring SDK installation', () => {
  const inventory = require('../config/skill-inventory.json');
  const actual = fs.readdirSync(path.join(root, 'skills')).filter(name => fs.existsSync(path.join(root, 'skills', name, 'SKILL.md'))).sort();
  assert.deepEqual(inventory.skills, actual);
  assert.equal(actual.length, 78);
  assert.ok(actual.includes('android-cli'));
});
