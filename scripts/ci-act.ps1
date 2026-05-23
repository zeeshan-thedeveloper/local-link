# Run CI inside Docker via act (needs Docker Desktop + act).
# Install act:  winget install nektos.act
#               or WSL: curl -s https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash
# Usage:  pnpm ci:act

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not (Get-Command act -ErrorAction SilentlyContinue)) {
  Write-Host "act is not installed. Use: pnpm ci:local" -ForegroundColor Yellow
  Write-Host "Install act: winget install nektos.act" -ForegroundColor Yellow
  exit 1
}

if (-not (Test-Path ".secrets")) {
  Copy-Item ".secrets.example" ".secrets"
  Write-Host "Created .secrets from .secrets.example (empty values are fine for CI)." -ForegroundColor Yellow
}

Write-Host "Running CI in Docker (ci-act.yml)..." -ForegroundColor Cyan
act workflow_dispatch -W .github/workflows/ci-act.yml
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "`nact CI passed." -ForegroundColor Green
