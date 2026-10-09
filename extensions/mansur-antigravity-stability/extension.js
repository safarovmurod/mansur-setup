'use strict';
const vscode = require('vscode');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { execFile } = require('node:child_process');

function activate(context) {
  const output = vscode.window.createOutputChannel('Mansur Antigravity Stability');
  let running;
  let rerun = false;
  let child;
  let timer;
  let alive = true;
  let reconnecting = false;
  let lockToken;
  const lockFile = path.join(context.globalStorageUri.fsPath, 'maintenance.lock');
  context.subscriptions.push(output);

  function releaseLock() {
    if (!lockToken) return;
    try {
      const saved = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
      if (saved.token === lockToken) fs.unlinkSync(lockFile);
    } catch { /* A missing lock does not affect the protected extensions. */ }
    lockToken = undefined;
  }

  function acquireLock() {
    fs.mkdirSync(path.dirname(lockFile), { recursive: true });
    if (fs.existsSync(lockFile)) {
      const saved = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
      if (!Number.isInteger(saved.pid) || saved.pid <= 0 || typeof saved.token !== 'string') return false;
      let ownerIsAlive = true;
      try { process.kill(saved.pid, 0); }
      catch (error) { if (error.code === 'ESRCH') ownerIsAlive = false; }
      if (ownerIsAlive) return false;
      // Remove only the unchanged lock belonging to a process that no longer exists.
      if (JSON.parse(fs.readFileSync(lockFile, 'utf8')).token !== saved.token) return false;
      fs.unlinkSync(lockFile);
    }
    const token = crypto.randomBytes(12).toString('hex');
    try {
      fs.writeFileSync(lockFile, JSON.stringify({ pid: process.pid, token }), { flag: 'wx' });
      lockToken = token;
      return true;
    } catch (error) {
      if (error.code === 'EEXIST') return false;
      throw error;
    }
  }

  function extensionsRoot() {
    const extension = vscode.extensions.getExtension('anteprimorac.html-end-tag-labels') ||
      vscode.extensions.getExtension('formulahendry.auto-rename-tag') ||
      vscode.extensions.getExtension('mansur.antigravity-stability-helper');
    return path.dirname(extension ? extension.extensionPath : context.extensionPath);
  }

  function nodeExecutable() {
    if (process.platform === 'win32') {
      const installed = path.join(process.env.ProgramFiles || 'C:\\Program Files', 'nodejs', 'node.exe');
      if (fs.existsSync(installed)) return installed;
    }
    return 'node';
  }

  async function notify(result) {
    if (!alive) return;
    if (result.reviewRequired || result.error) {
      const details = result.targets || [];
      const signature = crypto.createHash('sha256').update(JSON.stringify({ details, error: result.error, errorCode: result.errorCode })).digest('hex');
      const notices = context.globalState.get('reviewNotices', {});
      if (notices[signature]) return;
      await context.globalState.update('reviewNotices', { ...notices, [signature]: true });
      if (!alive) return;
      const message = result.error ? 'Мансур, санҷиши helper иҷро нашуд. Output-и helper-ро санҷ.' :
        'Мансур, версия ё коди нави extension санҷиши алоҳида мехоҳад. Коди ношинос тағйир дода нашуд.';
      const action = await vscode.window.showWarningMessage(message, 'Show Status');
      if (alive && action === 'Show Status') output.show(true);
    } else if (result.changed) {
      const action = await vscode.window.showInformationMessage('Мансур, ду ислоҳи маълум барқарор шуданд. Барои бор кардани коди нав window-ро аз нав кушо.', 'Reload Window', 'Show Status');
      if (!alive) return;
      if (action === 'Reload Window') await vscode.commands.executeCommand('workbench.action.reloadWindow');
      if (action === 'Show Status') output.show(true);
    }
  }

  function invokeCli(repair) {
    return new Promise((resolve) => {
      if (repair) {
        try {
          if (!acquireLock()) {
            resolve({ mode: 'repair', changed: false, reviewRequired: false, targets: [], skipped: 'another_window_is_checking' });
            return;
          }
        } catch (error) {
          resolve({ mode: 'repair', changed: false, reviewRequired: true, targets: [], error: 'maintenance_lock_unavailable', errorCode: error.code || error.name });
          return;
        }
      }
      const args = [path.join(context.extensionPath, 'maintenance.cjs'), '--extensions-dir', extensionsRoot(),
        '--backup-dir', path.join(os.homedir(), '.gemini', 'backups', 'antigravity-extension-maintenance')];
      if (repair) args.push('--repair');
      child = execFile(nodeExecutable(), args, { cwd: context.extensionPath, encoding: 'utf8', windowsHide: true, timeout: 6000, maxBuffer: 128 * 1024 }, (error, stdout) => {
        releaseLock();
        let result;
        try { result = JSON.parse(stdout); } catch { result = undefined; }
        if (!result || !Array.isArray(result.targets) || (error && !(error.code === 2 && result.reviewRequired))) {
          result = { mode: repair ? 'repair' : 'status', changed: false, reviewRequired: true, targets: [],
            error: 'maintenance_process_failed', errorCode: error && (error.code || error.name) };
        }
        resolve(result);
      });
    });
  }

  async function scan(repair, reason) {
    if (running) {
      if (repair) rerun = true;
      return running;
    }
    const current = invokeCli(repair);
    running = current;
    try {
      const result = await current;
      if (alive) {
        output.appendLine(JSON.stringify({ reason, ...result }));
        void notify(result).catch(() => { if (alive) output.appendLine('Notice could not be displayed.'); });
      }
      return result;
    } finally {
      if (running === current) running = undefined;
      child = undefined;
      if (rerun && alive) {
        rerun = false;
        schedule('queued extension change');
      }
    }
  }

  function schedule(reason) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      void scan(true, reason).catch(() => { if (alive) output.appendLine('Maintenance check failed.'); });
    }, 700);
  }

  context.subscriptions.push(vscode.commands.registerCommand('mansurStability.status', async () => {
    const result = await scan(false, 'manual status');
    output.show(true);
    return result;
  }));
  context.subscriptions.push(vscode.commands.registerCommand('mansurStability.repair', async () => {
    const result = await scan(true, 'manual repair');
    output.show(true);
    return result;
  }));
  context.subscriptions.push(vscode.commands.registerCommand('mansurStability.reconnectMcp', async () => {
    if (reconnecting) return;
    reconnecting = true;
    try {
      // A restored MCP status tab can refresh old server instances during startup.
      const mcpTabs = vscode.window.tabGroups.all.flatMap(group => group.tabs)
        .filter(tab => tab.label === 'Manage MCPs' && !tab.isDirty);
      if (mcpTabs.length && !await vscode.window.tabGroups.close(mcpTabs, true)) {
        throw new Error('MCP status tab did not close');
      }
      await vscode.commands.executeCommand('antigravity.killLanguageServerAndReloadWindow');
    }
    catch { await vscode.window.showWarningMessage('Мансур, native MCP recovery иҷро нашуд. Output-и Antigravity-ро санҷ.'); }
    finally { reconnecting = false; }
  }));
  context.subscriptions.push(vscode.extensions.onDidChange(() => schedule('extensions changed')));
  context.subscriptions.push({ dispose() {
    alive = false;
    if (timer) clearTimeout(timer);
    if (child) child.kill();
    releaseLock();
  } });
  schedule('startup');
}

module.exports = { activate };
