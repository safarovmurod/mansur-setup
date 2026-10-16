# Opt-in public-network check. Does not install prerequisites, extensions or fonts.
# Tests production download/extraction helpers and the downloaded Node installer
# in an isolated profile. Native Windows bootstrap is covered separately.
param([string]$ExpectedCommit = '')
$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent
$expectedVersion = (Get-Content -LiteralPath (Join-Path $repo 'package.json') -Raw -Encoding UTF8 | ConvertFrom-Json).version
$directory = Join-Path ([IO.Path]::GetTempPath()) ('mansur-live-download-' + [guid]::NewGuid().ToString('N'))
$tokens = $null; $errors = $null
$ast = [Management.Automation.Language.Parser]::ParseFile((Join-Path $repo 'scripts/bootstrap.ps1'), [ref]$tokens, [ref]$errors)
if ($errors.Count) { throw ($errors | Out-String) }
foreach ($statement in $ast.EndBlock.Statements) {
    if ($statement -is [Management.Automation.Language.FunctionDefinitionAst]) { . ([scriptblock]::Create($statement.Extent.Text)) }
}
try {
    New-Item -ItemType Directory -Path $directory | Out-Null
    $git = (Get-Command git -ErrorAction Stop).Source
    $node = (Get-Command node -ErrorAction Stop).Source
    $remote = Invoke-SetupGit -GitPath $git -Arguments @('ls-remote', 'https://github.com/safarovmurod/mansur-setup.git', 'refs/heads/main') -Label 'Resolve live main'
    $commit = ("$remote" -split '\s+')[0]
    if ($ExpectedCommit -and $commit -cne $ExpectedCommit) { throw "Remote main $commit differs from expected published commit $ExpectedCommit" }
    $bootstrap = Join-Path $directory 'downloaded bootstrap.ps1'
    Invoke-SetupDownload -Uri ('https://raw.githubusercontent.com/safarovmurod/mansur-setup/main/scripts/bootstrap.ps1?t=' + [guid]::NewGuid()) -OutFile $bootstrap -TimeoutSec 120
    $downloadErrors = $null
    $downloadedAst = [Management.Automation.Language.Parser]::ParseFile($bootstrap, [ref]$tokens, [ref]$downloadErrors)
    if ($downloadErrors.Count) { throw 'Downloaded bootstrap has PowerShell syntax errors' }
    $functions = @($downloadedAst.EndBlock.Statements | Where-Object { $_ -is [Management.Automation.Language.FunctionDefinitionAst] })
    if ('Assert-SetupPackage' -notin $functions.Name) { throw 'Downloaded bootstrap is stale: minimum-version guard missing' }
    foreach ($statement in $functions) { . ([scriptblock]::Create($statement.Extent.Text)) }
    $source = Get-SetupSource -GitPath $git -Commit $commit -Directory $directory
    $package = Assert-SetupPackage -Source $source -MinimumVersion $expectedVersion
    if ($package.version -ne $expectedVersion) { throw "Downloaded $($package.version), expected the published version $expectedVersion" }
    if ((Get-FileHash -LiteralPath $bootstrap).Hash -ne (Get-FileHash -LiteralPath (Join-Path $source 'scripts/bootstrap.ps1')).Hash) { throw 'Raw bootstrap and commit ZIP do not contain the same script' }
    foreach ($required in @('lib/agent-automation.js', 'docs/AGENT-AUTOMATION.md', 'rules/GEMINI.template.md', 'config/settings.json')) {
        if (-not (Test-Path -LiteralPath (Join-Path $source $required) -PathType Leaf)) { throw "New release file is missing: $required" }
    }
    $isolatedProfile = Join-Path $directory 'User with spaces'
    $entry = Join-Path $source 'bin/mansur-setup.js'
    & $node $entry install --rules-only --home $isolatedProfile
    if ($LASTEXITCODE -ne 0) { throw 'Downloaded rules installer failed' }
    $original = Join-Path $source 'rules/GEMINI.template.md'
    $installed = Join-Path $isolatedProfile '.gemini/GEMINI.md'
    if ((Get-FileHash -LiteralPath $original).Hash -ne (Get-FileHash -LiteralPath $installed).Hash) { throw 'Downloaded rules were not applied exactly' }
    $verifyDownloaded = @'
const path = require('node:path'), fs = require('node:fs'), assert = require('node:assert/strict');
const source = process.argv[1], home = process.argv[2];
const { runInstaller } = require(path.join(source, 'lib/installer'));
const { getEnvironmentPaths } = require(path.join(source, 'lib/paths'));
const { planPayload, statePath, digest } = require(path.join(source, 'lib/owned-files'));
const customRoots = { userProfile: home, gitBashPath: process.execPath };
for (let i = 0; i < 2; i++) {
  const result = runInstaller({ customRoots, skipExtensions: true, skipAgentBrowser: true, skipPermissions: true, log() {} });
  if (!result.success) throw new Error(result.failures.join('; '));
}
const env = getEnvironmentPaths(customRoots), plan = planPayload(env, source, 'Шеф');
assert.equal(plan.writes.length, 0, 'Downloaded payload must be complete and repeatable');
assert.equal(plan.removals.length, 0);
const registry = JSON.parse(fs.readFileSync(statePath(env)));
assert.equal(registry.files.length, plan.expectedCount);
assert.ok(registry.files.length >= 1068, 'Rules, skills, agents, hooks and runtimes must all be present');
const counts = {};
for (const file of registry.files) {
  const separator = file.key.indexOf('/'), area = file.key.slice(0, separator);
  const installed = path.join(plan.roots[area], file.key.slice(separator + 1));
  assert.equal(digest(fs.readFileSync(installed)), file.hash, 'Installed file mismatch: ' + file.key);
  counts[area] = (counts[area] || 0) + 1;
}
console.log('PASS: downloaded full profile and repeat; every installed payload hash verified: ' + JSON.stringify(counts));
console.log('NOTE: external font/gallery/browser provisioning and live native chat were not run by this isolated check.');
'@
    & $node -e $verifyDownloaded $source $isolatedProfile
    if ($LASTEXITCODE -ne 0) { throw 'Downloaded isolated profile installer failed' }
    Write-Host "PASS: live raw bootstrap, commit-resolved download/extraction, rules install, isolated full configuration and repeat. Package $($package.version); commit $commit"
} finally {
    if (Test-Path -LiteralPath $directory) { Remove-Item -LiteralPath $directory -Recurse -Force }
}
