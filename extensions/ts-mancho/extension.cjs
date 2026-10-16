'use strict';

const LANGUAGES = ['javascript', 'javascriptreact', 'typescript', 'typescriptreact'];
const QUIET_OVERRIDE = {
  'editor.showUnused': false
};
const QUIET_KEYS = {
  'typescript.validate.enable': false,
  'javascript.validate.enable': false,
  'typescript.suggestionActions.enabled': false,
  'javascript.suggestionActions.enabled': false
};
const SMOOTH_KEYS = {
  'editor.cursorSmoothCaretAnimation': 'on',
  'editor.cursorBlinking': 'smooth',
  'editor.cursorWidth': 3,
  'editor.smoothScrolling': true
};
const STORE_PREFIX = 'tsMancho.v31.managed.';

function equal(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function createExtension(vscode, context) {
  const { window, workspace, commands } = vscode;
  const subscriptions = context.subscriptions;
  const timers = new Map();
  const pulseTimers = new Map();
  const pulseFrames = [0.28, 0.24, 0.20, 0.16, 0.12, 0.08, 0.04];
  const pulses = pulseFrames.map(alpha => window.createTextEditorDecorationType({
    backgroundColor: `rgba(56, 189, 248, ${alpha})`,
    light: { backgroundColor: `rgba(2, 132, 199, ${alpha})` },
    borderRadius: '3px',
    rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
  }));
  subscriptions.push(...pulses);

  const button = window.createStatusBarItem(vscode.StatusBarAlignment.Right, 90);
  button.text = '$(symbol-method) Format';
  button.name = 'TS MANCHO Format';
  button.tooltip = 'Format current file with the configured formatter';
  button.command = 'tsMancho.formatDocument';
  subscriptions.push(button);

  function settings() {
    return workspace.getConfiguration('tsMancho');
  }

  function clearPulse(editor) {
    const pending = pulseTimers.get(editor);
    if (pending) pending.forEach(clearTimeout);
    pulseTimers.delete(editor);
    for (const style of pulses) editor.setDecorations(style, []);
  }

  function clearAllPulses() {
    for (const editor of pulseTimers.keys()) clearPulse(editor);
  }

  function pulseOnType(event) {
    clearAllPulses();
    if (!settings().get('typingPulse', true)) return;
    if (event.reason !== undefined || !LANGUAGES.includes(event.document.languageId)) return;
    if (event.contentChanges.length !== 1) return;
    const change = event.contentChanges[0];
    if (!change.text || change.text.length > 2 || /[\r\n]/.test(change.text)) return;
    const editor = window.activeTextEditor;
    if (!editor || editor.document !== event.document) return;
    const start = event.document.positionAt(change.rangeOffset);
    const end = event.document.positionAt(change.rangeOffset + change.text.length);
    if (start.line !== end.line) return;
    const range = new vscode.Range(start, end);
    editor.setDecorations(pulses[0], [range]);
    const sequence = pulseFrames.map((_, index) => setTimeout(() => {
      editor.setDecorations(pulses[index], []);
      if (index + 1 < pulses.length) editor.setDecorations(pulses[index + 1], [range]);
      else pulseTimers.delete(editor);
    }, (index + 1) * 40));
    pulseTimers.set(editor, sequence);
  }

  function clearSaves() {
    for (const handle of timers.values()) clearTimeout(handle);
    timers.clear();
  }

  function scheduleSave(document) {
    if (!settings().get('autoSaveAfterTyping', true) || document.uri.scheme !== 'file') return;
    const native = workspace.getConfiguration('files', document.uri).get('autoSave', 'off');
    if (native === 'afterDelay') return; // The built-in feature already provides this.
    const key = document.uri.toString();
    clearTimeout(timers.get(key));
    const configured = settings().get('autoSaveDelayMs', 1000);
    const delay = Math.max(300, Math.min(10000, Number(configured) || 1000));
    const handle = setTimeout(async () => {
      timers.delete(key);
      if (!document.isDirty || document.isClosed) return;
      if (workspace.getConfiguration('files', document.uri).get('autoSave', 'off') === 'afterDelay') return;
      try {
        await document.save();
      } catch (error) {
        console.warn('TS MANCHO: Auto Save failed:', error);
      }
    }, delay);
    timers.set(key, handle);
  }

  function showFormatButton() {
    const editor = window.activeTextEditor;
    const enabled = settings().get('showFormatButton', true);
    if (enabled && editor && editor.document.uri.scheme === 'file') button.show();
    else button.hide();
  }

  // Save original user values once; restore only settings that still match our edits.
  async function applyFlat(group, changes, enabled) {
    const key = STORE_PREFIX + group;
    const config = workspace.getConfiguration();
    const original = context.globalState.get(key);
    if (enabled) {
      if (!original) {
        const backup = {};
        for (const name of Object.keys(changes)) {
          const old = config.inspect(name)?.globalValue;
          backup[name] = { hasValue: old !== undefined, value: old };
        }
        await context.globalState.update(key, backup);
      }
      for (const [name, value] of Object.entries(changes)) {
        if (!equal(config.inspect(name)?.globalValue, value)) {
          await config.update(name, value, vscode.ConfigurationTarget.Global);
        }
      }
    } else if (!enabled && original) {
      for (const [name, value] of Object.entries(changes)) {
        if (equal(config.inspect(name)?.globalValue, value)) {
          const before = original[name];
          await config.update(name, before.hasValue ? before.value : undefined, vscode.ConfigurationTarget.Global);
        }
      }
      await context.globalState.update(key, undefined);
    }
  }

  async function applyQuiet(enabled) {
    // Restore validation flags disabled by older releases. Quiet mode now
    // changes presentation only; it never turns off the language service.
    await applyFlat('quietFlags', QUIET_KEYS, false);
    // VS Code derives validation decorations from problems.visibility and overrides
    // the internal renderValidationDecorations option, which is not a user setting.
    await applyFlat('quietPresentation', { 'problems.visibility': false }, enabled);
    const key = STORE_PREFIX + 'quietLanguages';
    const config = workspace.getConfiguration();
    const original = context.globalState.get(key);
    if (enabled) {
      if (!original) {
        const backup = {};
        for (const language of LANGUAGES) {
          const name = `[${language}]`;
          const old = config.inspect(name)?.globalValue;
          backup[name] = { hasValue: old !== undefined, value: old || {} };
        }
        await context.globalState.update(key, backup);
      }
      for (const language of LANGUAGES) {
        const name = `[${language}]`;
        const old = config.inspect(name)?.globalValue || {};
        const next = { ...old, ...QUIET_OVERRIDE };
        if (!equal(old, next)) await config.update(name, next, vscode.ConfigurationTarget.Global);
      }
    } else if (!enabled && original) {
      for (const language of LANGUAGES) {
        const name = `[${language}]`;
        const current = { ...(config.inspect(name)?.globalValue || {}) };
        const previous = original[name]?.value || {};
        for (const [setting, quietValue] of Object.entries({
          ...QUIET_OVERRIDE, 'editor.renderValidationDecorations': 'off'
        })) {
          if (!equal(current[setting], quietValue)) continue;
          if (Object.prototype.hasOwnProperty.call(previous, setting)) current[setting] = previous[setting];
          else delete current[setting];
        }
        await config.update(name, Object.keys(current).length ? current : undefined, vscode.ConfigurationTarget.Global);
      }
      await context.globalState.update(key, undefined);
    }

    // Error Lens is optional; writing its unregistered settings would abort this sync.
    if (!vscode.extensions.getExtension('usernamehw.errorlens')) return;
    const lensKey = STORE_PREFIX + 'quietErrorLens';
    const lensPrevious = context.globalState.get(lensKey);
    const lensSettings = config.inspect('errorLens.excludeLanguages');
    if (!lensSettings) return;
    const lensCurrent = lensSettings.globalValue;
    if (enabled) {
      const before = Array.isArray(lensCurrent) ? lensCurrent : [];
      if (!lensPrevious) await context.globalState.update(lensKey, { hasValue: lensCurrent !== undefined, value: before });
      const next = [...new Set([...before, ...LANGUAGES])];
      if (!equal(next, before)) await config.update('errorLens.excludeLanguages', next, vscode.ConfigurationTarget.Global);
    } else if (!enabled && lensPrevious) {
      const current = Array.isArray(lensCurrent) ? lensCurrent : [];
      const added = LANGUAGES.filter(language => !lensPrevious.value.includes(language));
      const after = current.filter(language => !added.includes(language));
      await config.update('errorLens.excludeLanguages',
        after.length || lensPrevious.hasValue ? after : undefined,
        vscode.ConfigurationTarget.Global);
      await context.globalState.update(lensKey, undefined);
    }
  }

  let updating = Promise.resolve();
  function syncSettings() {
    updating = updating.then(async () => {
      await applyQuiet(settings().get('quietMode', true));
      await applyFlat('smooth', SMOOTH_KEYS, settings().get('smoothTyping', true));
      if (!settings().get('typingPulse', true)) clearAllPulses();
      if (!settings().get('autoSaveAfterTyping', true)) clearSaves();
      showFormatButton();
    }).catch(error => console.error('TS MANCHO: Unable to sync settings:', error));
    return updating;
  }

  subscriptions.push(workspace.onDidChangeTextDocument(event => {
    if (!event.contentChanges.length) return;
    pulseOnType(event);
    scheduleSave(event.document);
  }));
  subscriptions.push(workspace.onDidCloseTextDocument(document => {
    for (const editor of pulseTimers.keys()) if (editor.document === document) clearPulse(editor);
    const key = document.uri.toString();
    clearTimeout(timers.get(key));
    timers.delete(key);
  }));
  subscriptions.push(window.onDidChangeActiveTextEditor(() => {
    clearAllPulses();
    showFormatButton();
  }));
  subscriptions.push(workspace.onDidChangeConfiguration(event => {
    if (event.affectsConfiguration('tsMancho')) syncSettings();
  }));
  subscriptions.push(commands.registerCommand('tsMancho.formatDocument', async () => {
    if (!window.activeTextEditor) return;
    try {
      await commands.executeCommand('editor.action.formatDocument');
    } catch (error) {
      window.showWarningMessage(`TS MANCHO: Format failed: ${String(error.message || error)}`);
    }
  }));

  subscriptions.push({ dispose() {
    clearSaves();
    clearAllPulses();
  }});
  syncSettings();
  return { ready: () => updating };
}

function activate(context) {
  return createExtension(require('vscode'), context);
}

function deactivate() { /* VS Code disposes subscriptions and decorations. */ }

module.exports = { activate, deactivate, createExtension };
