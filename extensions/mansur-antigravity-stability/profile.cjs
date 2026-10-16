'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function contains(actual, expected) {
  if (!expected || typeof expected !== 'object' || Array.isArray(expected)) return same(actual, expected);
  return !!actual && Object.entries(expected).every(([key, value]) => contains(actual[key], value));
}

// Only use vendor switches actually declared by the installed IDE extension.
function vendorCompletionSettings(extensions) {
  const settings = {};
  for (const extension of extensions) {
    const contributions = extension.packageJSON?.contributes?.configuration;
    for (const section of Array.isArray(contributions) ? contributions : [contributions]) {
      for (const [key, definition] of Object.entries(section?.properties || {})) {
        if (!/^(antigravity|codeium)\./i.test(key) || definition.type !== 'boolean') continue;
        if (!/(auto.?complet|super.?complet|inline.?suggest|tab.?complet|(?:^|\.)tab\.|(?:enable|disable)Tab$)/i.test(key)) continue;
        if (/(?:^|\.)(?:disable\w*|\w*Disabled)$/i.test(key)) settings[key] = true;
        else if (/(?:^|\.)(?:enable\w*|\w*Enabled)$/i.test(key)) settings[key] = false;
      }
    }
  }
  return settings;
}

function isRegisteredSetting(vscode, key) {
  if (/^\[.+\]$/.test(key)) return true;
  if (vscode.workspace.getConfiguration().inspect(key)?.defaultValue !== undefined) return true;
  return vscode.extensions.all.some(extension => {
    const configuration = extension.packageJSON?.contributes?.configuration;
    return (Array.isArray(configuration) ? configuration : [configuration]).some(section => Object.hasOwn(section?.properties || {}, key));
  });
}

async function applyEditorProfile(vscode, context, options = {}) {
  const file = options.file || path.join(os.homedir(), '.gemini/config/mansur-setup/editor-profile.json');
  if (!fs.existsSync(file)) return { skipped: 'no setup profile' };
  if (fs.lstatSync(file).isSymbolicLink()) throw new Error('Linked editor profile is unsupported');
  const plan = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (plan.schema !== 1 || typeof plan.requestId !== 'string' || !/^[a-f0-9-]{36}$/.test(plan.requestId)
    || plan.locale !== 'ru' || !plan.settings || Array.isArray(plan.settings) || typeof plan.settings !== 'object') {
    throw new Error('Invalid managed editor profile');
  }
  const alreadyApplied = !options.force && context.globalState.get('editorProfileRequest') === plan.requestId;
  const config = vscode.workspace.getConfiguration();
  const desired = { ...plan.settings, ...vendorCompletionSettings(vscode.extensions.all) };
  if (context.globalState.get('editorProfilePreviousSettings')?.requestId !== plan.requestId) {
    await context.globalState.update('editorProfilePreviousSettings', { requestId: plan.requestId,
      settings: Object.keys(desired).map(key => ({ key, value: config.inspect(key)?.globalValue })) });
  }
  const failed = [], overrides = [], applied = [], unavailable = [];
  for (const [key, value] of Object.entries(desired)) {
    try {
      const inspected = config.inspect(key);
      if (!isRegisteredSetting(vscode, key)) {
        unavailable.push(key);
        // Keep version-specific/optional extension keys out of API writes.
        continue;
      }
      const previous = inspected?.globalValue;
      if (!alreadyApplied && !contains(previous, value)) {
        const next = /^\[.+\]$/.test(key) ? { ...previous, ...value } : value;
        await config.update(key, next, vscode.ConfigurationTarget.Global);
        applied.push(key);
      }
      if (!contains(vscode.workspace.getConfiguration().get(key), value)) overrides.push(key);
    } catch { failed.push(key); }
  }
  for (const languageId of ['javascript', 'javascriptreact', 'typescript', 'typescriptreact']) {
    const scoped = vscode.workspace.getConfiguration(undefined, { uri: vscode.window.activeTextEditor?.document.uri, languageId });
    for (const key of ['editor.defaultFormatter', 'editor.inlineSuggest.enabled']) {
      const expected = desired['[' + languageId + ']']?.[key] ?? desired[key];
      if (expected !== undefined && !same(scoped.get(key), expected)) overrides.push('[' + languageId + '].' + key);
    }
  }
  const restartRequired = !/^ru(?:-|$)/i.test(vscode.env.language);
  const result = { setupVersion: plan.setupVersion, settingsApplied: applied.length, settingsChecked: Object.keys(desired).length - unavailable.length,
    failed, overrides, unavailable, language: vscode.env.language, requestedLanguage: plan.locale, restartRequired,
    vendorCompletionSwitches: Object.keys(vendorCompletionSettings(vscode.extensions.all)),
    status: failed.length || overrides.length ? 'needs-attention' : restartRequired ? 'restart-required' : 'applied' };
  if (alreadyApplied) result.skipped = 'already applied in this IDE profile; verified current values';
  await context.globalState.update('editorProfileStatus', result);
  if (!failed.length) await context.globalState.update('editorProfileRequest', plan.requestId);
  return result;
}

function watchEditorProfile(vscode, context, output, options = {}) {
  const file = options.file || path.join(os.homedir(), '.gemini/config/mansur-setup/editor-profile.json');
  const directory = path.dirname(file);
  let disposed = false, timer, running, again = false;
  async function apply(force = false) {
    if (disposed) return;
    if (running) { again = true; return running; }
    running = applyEditorProfile(vscode, context, { force, file });
    try {
      const result = await running;
      if (!disposed) {
        output.appendLine('Editor profile: ' + JSON.stringify(result));
        if (!result.skipped && (result.failed.length || result.overrides.length)) {
          void vscode.window.showWarningMessage('Настройки применены частично. Проверьте Output → Mansur Antigravity Stability: настройки проекта могут иметь приоритет.');
        } else if (!result.skipped && result.restartRequired) {
          void vscode.window.showInformationMessage('Русский язык выбран. Сохраните работу, полностью закройте все окна Antigravity и откройте IDE снова. Reload Window не меняет язык.');
        }
      }
      return result;
    } catch {
      if (!disposed) output.appendLine('Editor profile failed to apply; rerun setup or use Mansur: Apply and Check Editor Settings.');
    } finally {
      running = undefined;
      if (again && !disposed) { again = false; schedule(); }
    }
  }
  function schedule() { clearTimeout(timer); timer = setTimeout(() => { void apply(); }, 600); }
  context.subscriptions.push(vscode.commands.registerCommand('mansurStability.applySettings', () => apply(true)));
  if (fs.existsSync(directory)) {
    const watcher = fs.watch(directory, (_event, filename) => { if (!filename || filename === path.basename(file)) schedule(); });
    watcher.on('error', () => { if (!disposed) output.appendLine('Profile watcher unavailable; settings will be checked at next startup.'); });
    context.subscriptions.push({ dispose() { watcher.close(); } });
  }
  context.subscriptions.push({ dispose() { disposed = true; clearTimeout(timer); } });
  schedule();
}

module.exports = { applyEditorProfile, vendorCompletionSettings, isRegisteredSetting, watchEditorProfile };
