// mansur-github-panel — extension.js
// Глобальное расширение для Antigravity IDE (VS Code fork)
// Все операции Git выполняются через Git CLI как надёжный fallback
'use strict';

const vscode = require('vscode');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

// ─── константы ───────────────────────────────────────────────────────────────
const GIT = 'C:\\Program Files\\Git\\cmd\\git.exe';
const PANEL_ID = 'mansurGithubPanel';
const OUTPUT_CHANNEL_NAME = 'Mansur GitHub Panel';
const SECRET_PATTERNS = [
  /^\.env$/i, /^\.env\..+$/i,
  /\.pem$/i, /\.key$/i,
  /^id_rsa$/i, /^id_ed25519$/i,
  /credentials\.json$/i,
  /service-account.*\.json$/i,
];
const SECRET_WHITELIST = [/^\.env\.example$/i];

// ─── глобальные disposables ───────────────────────────────────────────────────
let outputChannel;
let panelProvider;
let disposables = [];

// ─── утилиты ─────────────────────────────────────────────────────────────────

function log(msg) {
  if (!outputChannel) outputChannel = vscode.window.createOutputChannel(OUTPUT_CHANNEL_NAME);
  outputChannel.appendLine(`[${new Date().toLocaleTimeString()}] ${msg}`);
}

function gitExec(args, cwd) {
  return new Promise((resolve, reject) => {
    execFile(GIT, args, { cwd, encoding: 'utf8', timeout: 30000, windowsHide: true }, (err, stdout, stderr) => {
      if (err) {
        log(`git ${args.join(' ')} => ERROR: ${stderr || err.message}`);
        reject(new Error(stderr ? stderr.trim() : err.message));
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

function getWorkspaceRoot() {
  const wf = vscode.workspace.workspaceFolders;
  if (!wf || wf.length === 0) return null;
  // Если есть активный editor — ищем его workspace folder
  const active = vscode.window.activeTextEditor;
  if (active) {
    const folder = vscode.workspace.getWorkspaceFolder(active.document.uri);
    if (folder) return folder.uri.fsPath;
  }
  return wf[0].uri.fsPath;
}

async function isGitRepo(cwd) {
  try {
    await gitExec(['rev-parse', '--git-dir'], cwd);
    return true;
  } catch { return false; }
}

async function getCurrentBranch(cwd) {
  try {
    return await gitExec(['branch', '--show-current'], cwd);
  } catch { return null; }
}

async function getStatus(cwd) {
  return await gitExec(['status', '--porcelain'], cwd);
}

async function getRemote(cwd) {
  try {
    return await gitExec(['remote', 'get-url', 'origin'], cwd);
  } catch { return null; }
}

async function getLocalSHA(cwd) {
  return await gitExec(['rev-parse', 'HEAD'], cwd);
}

async function getRemoteSHA(cwd, branch) {
  try {
    const out = await gitExec(['ls-remote', 'origin', `refs/heads/${branch}`], cwd);
    if (!out) return null;
    return out.split('\t')[0].trim();
  } catch { return null; }
}

async function getBranches(cwd) {
  let locals = [];
  let remotes = [];
  try {
    const localOut = await gitExec(['branch', '--format=%(refname:short)'], cwd);
    locals = localOut.split('\n').map(s => s.trim()).filter(Boolean);
  } catch {}
  try {
    const remoteOut = await gitExec(['for-each-ref', '--format=%(refname:short)', 'refs/remotes/origin/'], cwd);
    remotes = remoteOut.split('\n')
      .map(s => s.trim())
      .filter(s => s && s !== 'origin/HEAD')
      .map(s => s.replace(/^origin\//, ''))
      .filter(Boolean);
  } catch {}
  // merge + deduplicate
  const all = [...new Set([...locals, ...remotes])];
  return all;
}

async function detectDefaultBranch(cwd) {
  // 1. origin/HEAD
  try {
    const out = await gitExec(['symbolic-ref', '--short', 'refs/remotes/origin/HEAD'], cwd);
    if (out) return out.replace(/^origin\//, '');
  } catch {}
  // 2. main
  try {
    await gitExec(['rev-parse', '--verify', 'refs/remotes/origin/main'], cwd);
    return 'main';
  } catch {}
  // 3. master
  try {
    await gitExec(['rev-parse', '--verify', 'refs/remotes/origin/master'], cwd);
    return 'master';
  } catch {}
  return null;
}

function checkSecretFiles(files) {
  const bad = [];
  for (const f of files) {
    const base = path.basename(f);
    const whitelisted = SECRET_WHITELIST.some(r => r.test(base));
    if (!whitelisted && SECRET_PATTERNS.some(r => r.test(base))) {
      bad.push(f);
    }
  }
  return bad;
}

async function getStagedFiles(cwd) {
  const out = await gitExec(['ls-files', '-z', '--cached', '--others', '--exclude-standard'], cwd);
  return out.split('\0').filter(Boolean);
}

// ─── GitState — главный объект состояния ─────────────────────────────────────

async function collectState(cwd = getWorkspaceRoot()) {
  const state = {
    cwd,
    isRepo: false,
    branch: null,
    remote: null,
    status: null,
    isClean: true,
    mergeInProgress: false,
    rebaseInProgress: false,
    error: null,
  };
  if (!cwd) { state.error = 'No workspace open'; return state; }
  state.isRepo = await isGitRepo(cwd);
  if (!state.isRepo) { state.error = 'Not a Git repository'; return state; }
  state.branch = await getCurrentBranch(cwd);
  if (!state.branch) { state.error = 'Detached HEAD or no branch'; return state; }
  state.remote = await getRemote(cwd);
  const porcelain = await getStatus(cwd);
  state.status = porcelain;
  state.isClean = !porcelain;
  // check merge/rebase state
  try {
    const gitDir = await gitExec(['rev-parse', '--git-dir'], cwd);
    state.mergeInProgress = fs.existsSync(path.join(cwd, gitDir, 'MERGE_HEAD'));
    state.rebaseInProgress =
      fs.existsSync(path.join(cwd, gitDir, 'rebase-merge')) ||
      fs.existsSync(path.join(cwd, gitDir, 'rebase-apply'));
  } catch {}
  return state;
}

// ─── WebviewViewProvider ──────────────────────────────────────────────────────

class GithubPanelProvider {
  constructor() {
    this._view = null;
    this._busy = false;
  }

  resolveWebviewView(webviewView) {
    this._view = webviewView;
    log('GITHUB EXPLORER VIEW RESOLVED');
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = this._getHtml();

    // сообщения от webview
    webviewView.webview.onDidReceiveMessage(async msg => {
      if (!msg || typeof msg.command !== 'string' || this._busy) return;
      const mutation = ['push', 'newBranch', 'switchBranch'].includes(msg.command);
      if (mutation) this._busy = true;
      try {
        switch (msg.command) {
          case 'init': await this._sendState(); break;
          case 'push': await this._handlePush(); break;
          case 'newBranch': await this._handleNewBranch(msg.name); break;
          case 'switchBranch': await this._handleSwitchBranch(msg.name); break;
          case 'refresh': await this._sendState(); break;
        }
      } catch (e) {
        log(`Message handler error: ${e.message}`);
        this._postMessage({ type: 'error', text: e.message });
      } finally {
        if (mutation) { this._busy = false; await this._sendState(); }
      }
    }, null, disposables);

    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) this._sendState();
    }, null, disposables);

    this._sendState();
  }

  async refresh() {
    if (this._view) await this._sendState();
  }

  async _sendState() {
    try {
      const s = await collectState();
      s.busy = this._busy;
      const branches = s.isRepo && s.branch ? await getBranches(s.cwd).catch(() => []) : [];
      this._postMessage({ type: 'state', state: s, branches });
    } catch (e) {
      this._postMessage({ type: 'error', text: e.message });
    }
  }

  _postMessage(msg) {
    if (this._view && this._view.webview) {
      this._view.webview.postMessage(msg);
    }
  }

  // ─── Git Push ─────────────────────────────────────────────────────────────
  async _handlePush() {
    const cwd = getWorkspaceRoot();
    if (!cwd) { this._postMessage({ type: 'error', text: 'No workspace open' }); return; }

    const state = await collectState(cwd);
    if (state.error) throw new Error(state.error);
    if (state.mergeInProgress || state.rebaseInProgress) throw new Error('Finish the merge/rebase first.');
    const branch = state.branch;
    if (!state.remote) throw new Error('origin: missing. Configure the repository remote first.');
    let upstream = null;
    try { upstream = await gitExec(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'], cwd); } catch {}
    if (upstream && upstream !== 'origin/' + branch) {
      throw new Error('Upstream does not match origin/' + branch + '. Resolve tracking before Git Push.');
    }

    // check status
    const porcelain = await getStatus(cwd);
    if (porcelain) {
      // secret check
      const files = await getStagedFiles(cwd);
      const badFiles = checkSecretFiles(files);
      if (badFiles.length > 0) {
        this._postMessage({ type: 'error', text: `⛔ Secret file detected: ${badFiles.join(', ')}. Add to .gitignore first.` });
        return;
      }

      // user.name / user.email check
      try {
        await gitExec(['config', 'user.name'], cwd);
        await gitExec(['config', 'user.email'], cwd);
      } catch {
        this._postMessage({ type: 'error', text: 'Git user.name / user.email not configured. Run: git config --global user.name "Your Name"' });
        return;
      }

      const now = new Date();
      const ts = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      const commitMsg = `practice: save ${branch} ${ts}`;

      this._postMessage({ type: 'status', text: 'Adding files...' });
      await gitExec(['add', '-A'], cwd);
      const staged = await gitExec(['diff', '--cached', '--name-only', '-z', '--diff-filter=ACMR'], cwd);
      const stagedSecrets = checkSecretFiles(staged.split('\0').filter(Boolean));
      if (stagedSecrets.length) throw new Error('Secret file detected in index: ' + stagedSecrets.join(', '));

      this._postMessage({ type: 'status', text: 'Committing...' });
      await gitExec(['commit', '-m', commitMsg], cwd);
    }

    // push
    this._postMessage({ type: 'status', text: 'Pushing...' });
    let upstreamExists = false;
    try {
      const trackingOut = await gitExec(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'], cwd);
      upstreamExists = !!trackingOut;
    } catch {}

    if (upstreamExists) {
      await gitExec(['push'], cwd);
    } else {
      await gitExec(['push', '--set-upstream', 'origin', branch], cwd);
    }

    // verify
    this._postMessage({ type: 'status', text: 'Verifying...' });
    const localSHA = await getLocalSHA(cwd);
    const remoteSHA = await getRemoteSHA(cwd, branch);

    if (localSHA && remoteSHA && localSHA === remoteSHA) {
      this._postMessage({ type: 'pushOk', branch, sha: localSHA.slice(0, 7) });
    } else {
      this._postMessage({ type: 'error', text: `Push verification FAILED. Local: ${localSHA?.slice(0,7)} Remote: ${remoteSHA?.slice(0,7) || 'not found'}` });
      return;
    }

    await this._sendState();
  }

  // ─── New Branch ───────────────────────────────────────────────────────────
  async _handleNewBranch(name) {
    if (typeof name !== 'string' || !name.trim()) { this._postMessage({ type: 'error', text: 'Branch name required' }); return; }
    name = name.trim();
    const cwd = getWorkspaceRoot();
    if (!cwd) { this._postMessage({ type: 'error', text: 'No workspace open' }); return; }

    // validate branch name
    try {
      await gitExec(['check-ref-format', '--branch', name], cwd);
    } catch {
      this._postMessage({ type: 'error', text: `Invalid branch name: "${name}"` }); return;
    }

    // dirty check — MUST be clean before creating new branch
    const porcelain = await getStatus(cwd);
    if (porcelain) {
      this._postMessage({ type: 'error', text: '⚠️ Сначала нажми Git Push для текущей ветки. Незакоммиченные изменения изолируют тебя от нового branch.' });
      return;
    }

    // check if branch already exists locally
    let localBranches = [];
    try {
      const lo = await gitExec(['branch', '--format=%(refname:short)'], cwd);
      localBranches = lo.split('\n').map(s=>s.trim()).filter(Boolean);
    } catch {}
    if (localBranches.includes(name)) {
      this._postMessage({ type: 'error', text: `Branch "${name}" already exists locally` }); return;
    }

    const state = await collectState(cwd);
    if (state.error) throw new Error(state.error);
    if (state.mergeInProgress || state.rebaseInProgress) throw new Error('Finish the merge/rebase first.');
    if (!state.remote) throw new Error('origin: missing');
    this._postMessage({ type: 'status', text: 'Fetching origin...' });
    await gitExec(['fetch', 'origin', '--prune'], cwd);
    const branches = await getBranches(cwd);
    if (branches.includes(name)) throw new Error('Branch already exists: ' + name);
    const defaultBranch = await detectDefaultBranch(cwd);
    if (!defaultBranch) throw new Error('Cannot determine origin default branch.');
    const baseRef = 'refs/remotes/origin/' + defaultBranch;
    const baseSHA = await gitExec(['rev-parse', '--verify', baseRef], cwd);
    if (localBranches.includes(defaultBranch)) {
      try { await gitExec(['merge-base', '--is-ancestor', 'refs/heads/' + defaultBranch, baseRef], cwd); }
      catch { throw new Error('Local default branch has unpublished or divergent commits. New Branch stopped.'); }
      await gitExec(['switch', defaultBranch], cwd);
    } else {
      await gitExec(['switch', '--track', '-c', defaultBranch, 'origin/' + defaultBranch], cwd);
    }
    await gitExec(['pull', '--ff-only', 'origin', defaultBranch], cwd);
    if (await getLocalSHA(cwd) !== baseSHA) throw new Error('Default branch changed during creation. Retry after checking main.');
    await gitExec(['switch', '--no-track', '-c', name], cwd);

    // push upstream
    this._postMessage({ type: 'status', text: `Pushing upstream...` });
    await gitExec(['push', '--set-upstream', 'origin', name], cwd);

    // verify
    const currentBranch = await getCurrentBranch(cwd);
    if (currentBranch !== name) {
      this._postMessage({ type: 'error', text: `Branch switch verification FAILED. Current: ${currentBranch}` }); return;
    }

    // verify remote
    const remoteSHA = await getRemoteSHA(cwd, name);
    if (remoteSHA !== await getLocalSHA(cwd)) {
      this._postMessage({ type: 'error', text: `Remote SHA verification failed for ${name}` }); return;
    }

    this._postMessage({ type: 'branchOk', branch: name, defaultBranch });
    await this._sendState();
  }

  // ─── Switch Branch ────────────────────────────────────────────────────────
  async _handleSwitchBranch(name) {
    if (typeof name !== 'string' || !name.trim()) { this._postMessage({ type: 'error', text: 'Branch name required' }); return; }
    name = name.trim();
    const cwd = getWorkspaceRoot();
    if (!cwd) { this._postMessage({ type: 'error', text: 'No workspace open' }); return; }

    await gitExec(['check-ref-format', '--branch', name], cwd);
    // merge/rebase check
    const s = await collectState(cwd);
    if (s.error) throw new Error(s.error);
    if (s.mergeInProgress) { this._postMessage({ type: 'error', text: 'Merge in progress' }); return; }
    if (s.rebaseInProgress) { this._postMessage({ type: 'error', text: 'Rebase in progress' }); return; }

    // dirty check
    const porcelain = await getStatus(cwd);
    if (porcelain) {
      this._postMessage({ type: 'error', text: '⚠️ Сначала сохрани текущую ветку через Git Push.' });
      return;
    }

    // check if branch is local
    let localBranches = [];
    try {
      const lo = await gitExec(['branch', '--format=%(refname:short)'], cwd);
      localBranches = lo.split('\n').map(s=>s.trim()).filter(Boolean);
    } catch {}

    if (localBranches.includes(name)) {
      await gitExec(['switch', name], cwd);
    } else {
      // create tracking branch from origin
      await gitExec(['switch', '--track', '-c', name, `origin/${name}`], cwd);
    }

    const currentBranch = await getCurrentBranch(cwd);
    if (currentBranch !== name) {
      this._postMessage({ type: 'error', text: `Switch verification FAILED. Current: ${currentBranch}` }); return;
    }

    this._postMessage({ type: 'switchOk', branch: name });
    await this._sendState();
  }

  // ─── HTML Webview ─────────────────────────────────────────────────────────
  _getHtml() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: var(--vscode-font-family, system-ui, sans-serif);
    font-size: var(--vscode-font-size, 13px);
    color: var(--vscode-foreground);
    background: var(--vscode-sideBar-background, transparent);
    padding: 8px 10px 12px;
    user-select: none;
  }

  .section { margin-bottom: 10px; }

  .label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--vscode-sideBarSectionHeader-foreground, var(--vscode-descriptionForeground));
    margin-bottom: 4px;
  }

  .info-block {
    background: var(--vscode-input-background);
    border: 1px solid var(--vscode-input-border, transparent);
    border-radius: 4px;
    padding: 6px 8px;
    font-size: 12px;
    line-height: 1.5;
  }

  .branch-name {
    font-weight: 600;
    color: var(--vscode-textLink-foreground, #4ec9b0);
  }

  .remote-status {
    color: var(--vscode-descriptionForeground);
    font-size: 11px;
  }

  .clean-badge {
    color: #4caf50;
    font-size: 11px;
  }

  .dirty-badge {
    color: var(--vscode-editorWarning-foreground, #f0c040);
    font-size: 11px;
  }

  .btn {
    display: block;
    width: 100%;
    padding: 5px 10px;
    margin-top: 6px;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    font-family: inherit;
    font-size: 12px;
    font-weight: 500;
    text-align: center;
  }

  .btn:hover { filter: brightness(1.15); }
  .btn:active { filter: brightness(0.9); }
  .btn:disabled { opacity: 0.45; cursor: default; filter: none; }

  .btn-primary {
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
  }

  .btn-secondary {
    background: var(--vscode-button-secondaryBackground, #3a3d41);
    color: var(--vscode-button-secondaryForeground, #cccccc);
  }

  input[type="text"] {
    width: 100%;
    padding: 4px 7px;
    background: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    border: 1px solid var(--vscode-input-border, #3c3c3c);
    border-radius: 3px;
    font-family: inherit;
    font-size: 12px;
    outline: none;
    margin-top: 4px;
  }

  input[type="text"]:focus {
    border-color: var(--vscode-focusBorder, #007acc);
  }

  select {
    width: 100%;
    padding: 4px 7px;
    background: var(--vscode-dropdown-background, var(--vscode-input-background));
    color: var(--vscode-dropdown-foreground, var(--vscode-foreground));
    border: 1px solid var(--vscode-dropdown-border, #3c3c3c);
    border-radius: 3px;
    font-family: inherit;
    font-size: 12px;
    outline: none;
    margin-top: 4px;
    cursor: pointer;
  }

  select:focus { border-color: var(--vscode-focusBorder, #007acc); }

  .status-msg {
    font-size: 11px;
    padding: 4px 6px;
    border-radius: 3px;
    margin-top: 6px;
    line-height: 1.4;
  }

  .status-ok {
    background: rgba(76,175,80,0.12);
    color: #4caf50;
    border-left: 2px solid #4caf50;
  }

  .status-err {
    background: rgba(244,67,54,0.12);
    color: var(--vscode-editorError-foreground, #f44336);
    border-left: 2px solid var(--vscode-editorError-foreground, #f44336);
    word-break: break-word;
  }

  .status-info {
    background: rgba(100,100,100,0.12);
    color: var(--vscode-descriptionForeground);
    border-left: 2px solid var(--vscode-descriptionForeground);
  }

  .divider {
    height: 1px;
    background: var(--vscode-sideBarSectionHeader-border, rgba(128,128,128,0.2));
    margin: 10px 0;
  }

  #statusMsg { display: none; }
</style>
</head>
<body>

<!-- Current Info -->
<div class="section">
  <div class="label">Current</div>
  <div class="info-block">
    <div class="branch-name" id="branchName">—</div>
    <div class="remote-status" id="remoteStatus">loading...</div>
    <div id="cleanBadge" class="clean-badge" style="display:none">✓ Clean</div>
    <div id="dirtyBadge" class="dirty-badge" style="display:none">● Changes</div>
  </div>
</div>

<!-- Git Push -->
<div class="section">
  <button class="btn btn-primary" id="pushBtn" onclick="doPush()">Git Push</button>
</div>

<div class="divider"></div>

<!-- New Branch -->
<div class="section">
  <div class="label">Branch name</div>
  <input type="text" id="newBranchInput" placeholder="day-2" />
  <button class="btn btn-secondary" id="newBranchBtn" onclick="doNewBranch()" style="margin-top:6px">New Branch</button>
</div>

<div class="divider"></div>

<!-- My Branch -->
<div class="section">
  <div class="label">My Branch</div>
  <select id="branchSelect" onchange="doSwitchBranch(this.value)"></select>
</div>

<!-- Status message -->
<div class="status-msg" id="statusMsg"></div>

<script>
const vscode = acquireVsCodeApi();
let currentBranch = null;
let busy = false;

function post(command, extra) {
  vscode.postMessage(Object.assign({ command }, extra));
}

function setStatus(text, type) {
  const el = document.getElementById('statusMsg');
  el.style.display = 'block';
  el.className = 'status-msg status-' + type;
  el.textContent = text;
}

function setBusy(val) {
  busy = val;
  document.getElementById('pushBtn').disabled = val;
  document.getElementById('newBranchBtn').disabled = val;
  document.getElementById('branchSelect').disabled = val;
}

function doPush() {
  if (busy) return;
  setBusy(true);
  setStatus('Starting push...', 'info');
  post('push');
}

function doNewBranch() {
  if (busy) return;
  const name = document.getElementById('newBranchInput').value.trim();
  if (!name) { setStatus('Enter branch name', 'err'); return; }
  setBusy(true);
  setStatus('Creating branch...', 'info');
  post('newBranch', { name });
}

function doSwitchBranch(name) {
  if (busy || !name || name === currentBranch) return;
  setBusy(true);
  setStatus('Switching branch...', 'info');
  post('switchBranch', { name });
}

function applyState(state, branches) {
  setBusy(Boolean(state.busy));
  currentBranch = state.branch;

  if (state.error) {
    setBusy(true);
    document.getElementById('branchName').textContent = '—';
    document.getElementById('remoteStatus').textContent = state.error;
    document.getElementById('cleanBadge').style.display = 'none';
    document.getElementById('dirtyBadge').style.display = 'none';
    updateBranchSelect([], null);
    return;
  }

  document.getElementById('branchName').textContent = state.branch || '—';
  document.getElementById('remoteStatus').textContent = state.remote
    ? 'origin: connected'
    : 'origin: missing';

  document.getElementById('cleanBadge').style.display = state.isClean ? '' : 'none';
  document.getElementById('dirtyBadge').style.display = state.isClean ? 'none' : '';

  updateBranchSelect(branches, state.branch);
}

function updateBranchSelect(branches, current) {
  const sel = document.getElementById('branchSelect');
  const prev = sel.value;
  sel.innerHTML = '';
  if (!branches || branches.length === 0) {
    const opt = document.createElement('option');
    opt.textContent = current || '—';
    opt.value = current || '';
    sel.appendChild(opt);
    return;
  }
  branches.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b;
    opt.textContent = b;
    if (b === current) opt.selected = true;
    sel.appendChild(opt);
  });
}

window.addEventListener('message', ev => {
  const msg = ev.data;
  switch (msg.type) {
    case 'state':
      applyState(msg.state, msg.branches);
      break;
    case 'status':
      setStatus(msg.text, 'info');
      break;
    case 'pushOk':
      setStatus('✓ Pushed · ' + msg.branch + ' · ' + msg.sha, 'ok');
      setBusy(false);
      break;
    case 'branchOk':
      setStatus('✓ Branch ' + msg.branch + ' created from ' + msg.defaultBranch, 'ok');
      document.getElementById('newBranchInput').value = '';
      setBusy(false);
      break;
    case 'switchOk':
      setStatus('✓ Switched to ' + msg.branch, 'ok');
      setBusy(false);
      break;
    case 'error':
      setStatus(msg.text, 'err');
      setBusy(false);
      break;
  }
});

// init
post('init');

// Refresh on focus; Git commands also refresh their result.
window.addEventListener('focus', () => { if (!busy) post('refresh'); });
</script>
</body>
</html>`;
  }
}

// ─── Activate ─────────────────────────────────────────────────────────────────

function activate(context) {
  log('mansur-github-panel 1.1.0 activating...');

  if (!outputChannel) {
    outputChannel = vscode.window.createOutputChannel(OUTPUT_CHANNEL_NAME);
  }

  panelProvider = new GithubPanelProvider();

  const providerReg = vscode.window.registerWebviewViewProvider(
    PANEL_ID,
    panelProvider,
    { webviewOptions: { retainContextWhenHidden: true } }
  );
  context.subscriptions.push(providerReg);
  disposables.push(providerReg);

  // команда обновления
  const refreshCmd = vscode.commands.registerCommand('mansurGithubPanel.refresh', () => {
    panelProvider.refresh();
  });
  context.subscriptions.push(refreshCmd);
  disposables.push(refreshCmd);

  // авто-обновление при смене workspace/editor
  const wsChange = vscode.workspace.onDidChangeWorkspaceFolders(() => panelProvider.refresh());
  context.subscriptions.push(wsChange);
  disposables.push(wsChange);

  const editorChange = vscode.window.onDidChangeActiveTextEditor(() => panelProvider.refresh());
  context.subscriptions.push(editorChange);
  disposables.push(editorChange);

  log('mansur-github-panel 1.1.0 activated.');
}

function deactivate() {
  log('mansur-github-panel deactivated.');
  for (const d of disposables) {
    try { d.dispose(); } catch {}
  }
  disposables = [];
  if (outputChannel) { outputChannel.dispose(); outputChannel = null; }
}

module.exports = { activate, deactivate };
