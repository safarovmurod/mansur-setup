param([string]$Name = '', [switch]$RulesOnly, [switch]$DryRun)
# Windows PowerShell 5.1 compatible. Run from the Antigravity PowerShell terminal.
$ErrorActionPreference = 'Stop'
function Refresh-SetupPath {
    $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' +
        [Environment]::GetEnvironmentVariable('Path', 'User') + ';' + $script:originalPath
}
function Install-Prerequisite {
    param([string]$Id)
    if ($DryRun) { Write-Host "  [DRY-RUN] Would install $Id using winget; no changes made."; return }
    $winget = Get-Command winget.exe -ErrorAction SilentlyContinue
    if (-not $winget) { throw 'winget is unavailable. Install Node.js >=24 and Git for Windows, then use the npx command in README.' }
    Write-Host "  Installing $Id (winget download/installation output follows)..."
    & $winget.Source install --id $Id --exact --source winget --silent --accept-source-agreements --accept-package-agreements --disable-interactivity
    if ($LASTEXITCODE -ne 0) { throw "winget could not install $Id (exit $LASTEXITCODE). Resolve the Windows installer error, then rerun bootstrap." }
    Refresh-SetupPath
}
try {
    if ([Environment]::OSVersion.Platform -ne [PlatformID]::Win32NT) { throw 'Bootstrap requires Windows 10/11' }
    $script:originalPath = $env:Path
    Refresh-SetupPath
    Write-Host '[1/4] Checking Node.js >=24 and npm >=10...'
    $node = Get-Command node.exe -ErrorAction SilentlyContinue
    $needsNode = -not $node
    if ($node) {
        $nodeVersion = & $node.Source --version
        if ($LASTEXITCODE -ne 0 -or $nodeVersion -notmatch '^v(\d+)\.') { throw 'Could not read Node.js version' }
        $needsNode = [int]$Matches[1] -lt 24
    }
    $existingNpm = Get-Command npm.cmd -ErrorAction SilentlyContinue
    if (-not $existingNpm) { $needsNode = $true }
    elseif (-not $needsNode) {
        $npmVersion = & $existingNpm.Source --version
        if ($LASTEXITCODE -ne 0 -or $npmVersion -notmatch '^(\d+)\.' -or [int]$Matches[1] -lt 10) { $needsNode = $true }
    }
    if ($needsNode) { Install-Prerequisite -Id 'OpenJS.NodeJS.LTS' }

    Write-Host '[2/4] Checking Git for GitHub package download...'
    if (-not (Get-Command git.exe -ErrorAction SilentlyContinue)) { Install-Prerequisite -Id 'Git.Git' }
    if ($DryRun) {
        Write-Host '[3/4] [DRY-RUN] Would run setup with existing MCP permissions preserved.'
        Write-Host '[4/4] [DRY-RUN] Would run Doctor. No prerequisites or setup files changed.'
        exit 0
    }
    $node = Get-Command node.exe -ErrorAction Stop
    $version = & $node.Source --version
    if ($LASTEXITCODE -ne 0 -or $version -notmatch '^v(\d+)\.' -or [int]$Matches[1] -lt 24) { throw 'Node.js >=24 is still required. Check PATH and restart the terminal.' }
    $npm = Get-Command npm.cmd -ErrorAction Stop
    $npmVersion = & $npm.Source --version
    if ($LASTEXITCODE -ne 0 -or $npmVersion -notmatch '^(\d+)\.' -or [int]$Matches[1] -lt 10) { throw 'npm >=10 is required' }
    $git = Get-Command git.exe -ErrorAction Stop
    & $git.Source --version
    if ($LASTEXITCODE -ne 0) { throw 'Git is installed but does not run' }
    $npx = Get-Command npx.cmd -ErrorAction Stop
    $setupArgs = @('--yes', '--loglevel=info', '--progress=true', 'github:safarovmurod/mansur-setup', 'install')
    if ($RulesOnly) { $setupArgs += '--rules-only' } else { $setupArgs += '--skip-permissions' }
    if ($Name) { $setupArgs += @('--name', $Name) }
    Write-Host '[3/4] Downloading Mansur Setup from GitHub and installing...'
    & $npx.Source @setupArgs
    if ($LASTEXITCODE -ne 0) { throw "Setup returned exit $LASTEXITCODE; read the failed stage above. Doctor is not reported as passed." }
    if ($RulesOnly) {
        Write-Host '[4/4] Rules-only install completed; full IDE Doctor is not applicable to this scoped mode.'
    } else {
        Write-Host '[4/4] Checking installed setup with Doctor...'
        & $npx.Source --yes github:safarovmurod/mansur-setup doctor
        if ($LASTEXITCODE -ne 0) { throw "Doctor found failures (exit $LASTEXITCODE); read its report above." }
    }
    Write-Host 'Setup stages complete. Save work; reload the IDE window if needed and start a new chat. Personal accounts/MCP authorization are configured separately.'
    exit 0
} catch {
    Write-Error $_ -ErrorAction Continue
    exit 1
}
