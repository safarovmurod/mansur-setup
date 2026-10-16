import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../extensions/ts-mancho/extension.cjs', import.meta.url), 'utf8');

async function fixture(overrides = {}, missingErrorLens = false) {
  const settings = { 'tsMancho.quietMode': false, 'tsMancho.smoothTyping': false,
    'tsMancho.autoSaveAfterTyping': false, ...overrides };
  const events = {}, commands = new Map(), timers = new Map(), renders = [], styles = [], calls = [];
  let serial = 0;
  const state = new Map();
  const subscriptions = [];
  const event = name => handler => {
    events[name] = handler;
    return { dispose() { delete events[name]; } };
  };
  const document = { languageId: 'typescript', uri: { scheme: 'file', toString: () => 'file:///sample.ts' },
    isDirty: true, isClosed: false, saved: 0,
    positionAt: offset => ({ line: 0, character: offset }),
    async save() { this.saved++; return true; } };
  const editor = { document, setDecorations(style, ranges) { renders.push({ style: style.id, ranges }); } };
  const button = { shown: false, show() { this.shown = true; }, hide() { this.shown = false; }, dispose() {} };
  const vscode = {
    extensions: { getExtension: () => missingErrorLens ? undefined : ({}) },
    ConfigurationTarget: { Global: 1 }, DecorationRangeBehavior: { ClosedClosed: 2 }, StatusBarAlignment: { Right: 2 },
    Range: class { constructor(start, end) { this.start = start; this.end = end; } },
    window: { activeTextEditor: editor,
      createTextEditorDecorationType(options) {
        const style = { id: styles.length, options, disposed: false, dispose() { this.disposed = true; } };
        styles.push(style); return style;
      },
      createStatusBarItem: () => button, onDidChangeActiveTextEditor: event('editor'),
      showWarningMessage: message => calls.push(message) },
    workspace: { getConfiguration(section) {
      return { get: (name, fallback) => settings[section ? section + '.' + name : name] ?? fallback,
        inspect: name => ({ globalValue: settings[name] }),
        async update(name, value) { if (value === undefined) delete settings[name]; else settings[name] = value; } };
    }, onDidChangeTextDocument: event('change'), onDidCloseTextDocument: event('close'),
    onDidChangeConfiguration: event('configuration') },
    commands: { registerCommand(name, handler) { commands.set(name, handler); return { dispose: () => commands.delete(name) }; },
      async executeCommand(name) { calls.push(name); } }
  };
  const module = { exports: {} };
  vm.runInNewContext(source, { module, console,
    setTimeout(callback, delay) { const id = ++serial; timers.set(id, { callback, delay }); return id; },
    clearTimeout: id => timers.delete(id) });
  const context = { subscriptions, globalState: { get: key => state.get(key),
    async update(key, value) { if (value === undefined) state.delete(key); else state.set(key, value); } } };
  const api = module.exports.createExtension(vscode, context);
  await api.ready();
  return { settings, events, timers, renders, styles, calls, document, editor, vscode, button, commands,
    change(text, reason) { events.change({ document, reason, contentChanges: [{ text, rangeOffset: 1 }] }); },
    async tick() { const first = timers.entries().next().value; if (first) { timers.delete(first[0]); await first[1].callback(); } },
    async refresh() { events.configuration({ affectsConfiguration: () => true }); await api.ready(); },
    dispose() { for (const item of subscriptions) item.dispose(); } };
}

test('Missing Error Lens does not block quiet visuals, smooth typing, or subsequent configuration updates', async () => {
  const f = await fixture({ 'tsMancho.quietMode': true, 'tsMancho.smoothTyping': true }, true);
  assert.equal(f.settings['problems.visibility'], false);
  assert.equal(f.settings['editor.cursorSmoothCaretAnimation'], 'on');
  assert.equal(f.settings['errorLens.excludeLanguages'], undefined);
  f.settings['tsMancho.smoothTyping'] = false; await f.refresh();
  assert.equal(f.settings['editor.cursorSmoothCaretAnimation'], undefined);
  f.dispose();
});

test('Typing pulse survives dirty-state events, fades in seven bounded frames, and supports UTF-16 characters', async () => {
  const f = await fixture();
  f.change('я');
  assert.equal(f.styles.length, 7);
  assert.equal(f.renders.at(-1).ranges[0].end.character, 2);
  const count = f.renders.length;
  f.events.change({ document: f.document, contentChanges: [] });
  assert.equal(f.renders.length, count, 'A dirty-state notification must not erase the pulse');
  assert.equal(f.timers.size, 7);
  assert.equal([...f.timers.values()].at(-1).delay, 280);
  for (let index = 0; index < 7; index++) await f.tick();
  assert.equal(f.timers.size, 0);
  assert.equal(f.renders.filter(item => item.ranges.length).length, 7);
  f.change('😀');
  assert.equal(f.renders.at(-1).ranges[0].end.character, 3);
  assert.equal(f.styles.length, 7, 'Decoration types are reused');
  f.dispose();
  assert.equal(f.timers.size, 0);
  assert.ok(f.styles.every(style => style.disposed));
});

test('Pulse skips Undo/Redo, large pastes and other languages, and clears on editor switch, close and disable', async () => {
  const f = await fixture();
  f.change('x', 1); f.change('x', 2); f.change('long paste'); f.change('\n');
  f.document.languageId = 'python'; f.change('x');
  assert.equal(f.renders.length, 0);
  f.document.languageId = 'typescript';
  f.change('x'); f.events.editor();
  assert.equal(f.timers.size, 0);
  assert.equal(f.renders.at(-1).ranges.length, 0);
  f.change('x'); f.events.close(f.document);
  assert.equal(f.timers.size, 0);
  f.change('x'); f.settings['tsMancho.typingPulse'] = false; await f.refresh();
  assert.equal(f.timers.size, 0);
  assert.equal(f.renders.at(-1).ranges.length, 0);
  f.dispose();
});

test('Pause-based save restarts on edits, defers to native Auto Save, and cancels on disable or close', async () => {
  const f = await fixture({ 'tsMancho.autoSaveAfterTyping': true, 'tsMancho.typingPulse': false,
    'tsMancho.autoSaveDelayMs': 650 });
  f.change('x'); f.change('y');
  assert.equal(f.timers.size, 1);
  assert.equal([...f.timers.values()][0].delay, 650);
  await f.tick();
  assert.equal(f.document.saved, 1);
  f.change('x'); f.settings['files.autoSave'] = 'afterDelay'; await f.tick();
  assert.equal(f.document.saved, 1, 'Native delayed save owns the write');
  f.change('x'); assert.equal(f.timers.size, 0);
  f.settings['files.autoSave'] = 'off';
  f.change('x'); f.events.close(f.document); assert.equal(f.timers.size, 0);
  f.change('x'); f.settings['tsMancho.autoSaveAfterTyping'] = false; await f.refresh();
  assert.equal(f.timers.size, 0);
  f.document.uri.scheme = 'untitled';
  f.settings['tsMancho.autoSaveAfterTyping'] = true;
  f.change('x'); assert.equal(f.timers.size, 0);
  f.dispose();
});

test('Format button follows its setting and active file, and invokes the configured native formatter', async () => {
  const f = await fixture();
  assert.equal(f.button.shown, true);
  await f.commands.get(f.button.command)();
  assert.deepEqual(f.calls, ['editor.action.formatDocument']);
  f.settings['tsMancho.showFormatButton'] = false; await f.refresh();
  assert.equal(f.button.shown, false);
  f.settings['tsMancho.showFormatButton'] = true;
  f.vscode.window.activeTextEditor = undefined; f.events.editor();
  assert.equal(f.button.shown, false);
  await f.commands.get(f.button.command)();
  assert.equal(f.calls.length, 1);
  f.dispose();
  assert.equal(f.commands.size, 0);
});
