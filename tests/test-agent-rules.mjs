import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { install, restore } = require('../scripts/install-agent-rules.cjs');

test('Agent rules preserve foreign instructions, preview, repeat, backup and restore', t => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-work-'));
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  const target = path.join(home, '.codex/AGENTS.md');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, 'Preserve unrelated personal instructions.\n');
  const options = { home, codexHome: path.join(home, '.codex') };
  assert.ok(install({ ...options, dryRun: true }).changed.length > 0);
  assert.equal(fs.readFileSync(target, 'utf8'), 'Preserve unrelated personal instructions.\n');
  assert.equal(fs.existsSync(path.join(home, '.gemini')), false);
  const result = install(options);
  assert.equal(result.chatgptApplied, false);
  assert.ok(fs.readFileSync(target, 'utf8').includes('Preserve unrelated personal instructions.'));
  assert.ok(fs.existsSync(path.join(home, '.agents/skills/mansur-frontend-mentor/references/cl4r1t4s.md')));
  assert.ok(fs.readFileSync(path.join(home, '.gemini/config/rules/mansur-agent-work.md'), 'utf8').startsWith('---\ntrigger: always_on'));
  assert.deepEqual(install(options).changed, []);
  restore(result.backup);
  assert.equal(fs.readFileSync(target, 'utf8'), 'Preserve unrelated personal instructions.\n');
  assert.equal(fs.existsSync(path.join(home, '.gemini/config/rules/mansur-agent-work.md')), false);
});

test('Active override or broken markers stop all writes', t => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-stop-'));
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  const codexHome = path.join(home, '.codex');
  fs.mkdirSync(codexHome);
  fs.writeFileSync(path.join(codexHome, 'AGENTS.override.md'), 'Active override');
  assert.throws(() => install({ home, codexHome }), /override/);
  assert.equal(fs.existsSync(path.join(home, '.gemini')), false);
  fs.unlinkSync(path.join(codexHome, 'AGENTS.override.md'));
  fs.writeFileSync(path.join(codexHome, 'AGENTS.md'), '<!-- mansur-agent-work:begin -->');
  assert.throws(() => install({ home, codexHome }), /markers/);
  assert.equal(fs.existsSync(path.join(home, '.gemini')), false);
});
