# Opt-in public-network check. Does not install prerequisites, extensions or fonts.
# Tests production download/extraction helpers and the downloaded Node installer
# in an isolated profile. Native Windows bootstrap is covered separately.
$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent
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
    $bootstrap = Join-Path $directory 'downloaded bootstrap.ps1'
    Invoke-SetupDownload -Uri ('https://raw.githubusercontent.com/safarovmurod/mansur-setup/main/scripts/bootstrap.ps1?t=' + [guid]::NewGuid()) -OutFile $bootstrap -TimeoutSec 120
    $downloadErrors = $null
    [void][Management.Automation.Language.Parser]::ParseFile($bootstrap, [ref]$tokens, [ref]$downloadErrors)
    if ($downloadErrors.Count) { throw 'Downloaded bootstrap has PowerShell syntax errors' }
    $source = Get-SetupSource -GitPath $git -Commit $commit -Directory $directory
    $package = Get-Content -LiteralPath (Join-Path $source 'package.json') -Raw | ConvertFrom-Json
    if ($package.name -ne 'mansur-antigravity-setup') { throw 'Wrong downloaded package identity' }
    $isolatedProfile = Join-Path $directory 'User with spaces'
    $entry = Join-Path $source 'bin/mansur-setup.js'
    & $node $entry install --rules-only --home $isolatedProfile
    if ($LASTEXITCODE -ne 0) { throw 'Downloaded rules installer failed' }
    $original = Join-Path $source 'rules/GEMINI.template.md'
    $installed = Join-Path $isolatedProfile '.gemini/GEMINI.md'
    if ((Get-FileHash -LiteralPath $original).Hash -ne (Get-FileHash -LiteralPath $installed).Hash) { throw 'Downloaded rules were not applied exactly' }
    & $node -e 'const path=require("node:path"); const source=process.argv[1], home=process.argv[2]; const {runInstaller}=require(path.join(source,"lib/installer")); const options={customRoots:{userProfile:home,gitBashPath:process.execPath},skipExtensions:true,skipAgentBrowser:true,skipPermissions:true,log() {}}; for(let i=0;i<2;i++){const result=runInstaller(options);if(!result.success)throw new Error(result.failures.join("; "));} console.log("PASS: downloaded full isolated profile and repeat (external provisioning skipped)");' $source $isolatedProfile
    if ($LASTEXITCODE -ne 0) { throw 'Downloaded isolated profile installer failed' }
    Write-Host "PASS: live raw bootstrap, commit-resolved download/extraction, rules install, isolated full configuration and repeat. Package $($package.version); commit $commit"
} finally {
    if (Test-Path -LiteralPath $directory) { Remove-Item -LiteralPath $directory -Recurse -Force }
}
