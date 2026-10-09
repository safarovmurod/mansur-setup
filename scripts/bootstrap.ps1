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
$setupTemp = $null
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
    # Resolve main once; installation and Doctor must use the same immutable source.
    $remote = & $git.Source ls-remote 'https://github.com/safarovmurod/mansur-setup.git' 'refs/heads/main'
    if ($LASTEXITCODE -ne 0 -or @($remote).Count -ne 1 -or $remote -notmatch '^([a-f0-9]{40})\s+refs/heads/main$') { throw 'Cannot resolve the latest setup commit; no setup files changed.' }
    $commit = $Matches[1]
    $setupTemp = Join-Path ([System.IO.Path]::GetTempPath()) ('mansur-setup-' + [guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $setupTemp -ErrorAction Stop | Out-Null
    $archive = Join-Path $setupTemp 'setup.zip'
    [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
    Write-Host ('[3/4] Downloading current setup commit ' + $commit + '...')
    Invoke-WebRequest -UseBasicParsing -Uri ('https://codeload.github.com/safarovmurod/mansur-setup/zip/' + $commit) -OutFile $archive
    Expand-Archive -LiteralPath $archive -DestinationPath $setupTemp -ErrorAction Stop
    $source = Join-Path $setupTemp ('mansur-setup-' + $commit)
    $entry = Join-Path $source 'bin\mansur-setup.js'
    $packagePath = Join-Path $source 'package.json'
    if (-not (Test-Path -LiteralPath $entry -PathType Leaf) -or -not (Test-Path -LiteralPath $packagePath -PathType Leaf)) { throw 'Downloaded archive is incomplete; no setup files changed.' }
    $package = Get-Content -LiteralPath $packagePath -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($package.name -ne 'mansur-antigravity-setup') { throw 'Unexpected downloaded package identity; no setup files changed.' }
    Write-Host ('  Package ' + $package.version + '; source ' + $commit)
    $setupArgs = @($entry, 'install')
    if ($RulesOnly) { $setupArgs += '--rules-only' } else { $setupArgs += '--skip-permissions' }
    if ($Name) { $setupArgs += @('--name', $Name) }
    & $node.Source @setupArgs
    if ($LASTEXITCODE -ne 0) { throw "Setup returned exit $LASTEXITCODE; read the failed stage above. Doctor is not reported as passed." }
    if ($RulesOnly) {
        Write-Host '[4/4] Rules-only install completed; full IDE Doctor is not applicable to this scoped mode.'
    } else {
        Write-Host '[4/4] Checking installed setup with Doctor...'
        & $node.Source $entry doctor
        if ($LASTEXITCODE -ne 0) { throw "Doctor found failures (exit $LASTEXITCODE); read its report above." }
    }
    Write-Host 'Setup stages complete. Save work; reload the IDE window if needed and start a new chat. Personal accounts/MCP authorization are configured separately.'
    exit 0
} catch {
    Write-Error $_ -ErrorAction Continue
    exit 1
} finally {
    if ($setupTemp -and (Test-Path -LiteralPath $setupTemp)) {
        # Remove only the unique temporary directory created by this invocation.
        $resolvedTemp = [System.IO.Path]::GetFullPath($setupTemp)
        $tempParent = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath()).TrimEnd('\') + '\'
        if ($resolvedTemp.StartsWith($tempParent, [StringComparison]::OrdinalIgnoreCase) -and (Split-Path $resolvedTemp -Leaf) -match '^mansur-setup-[a-f0-9]{32}$') {
            Remove-Item -LiteralPath $resolvedTemp -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}
