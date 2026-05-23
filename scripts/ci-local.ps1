# Run the same checks as GitHub CI without Actions (fastest on Windows).
# Usage:  pnpm ci:local
#         .\scripts\ci-local.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Run([string]$label, [scriptblock]$cmd) {
  Write-Host "`n==> $label" -ForegroundColor Cyan
  & $cmd
  if ($LASTEXITCODE -ne 0) { throw "$label failed (exit $LASTEXITCODE)" }
}

Run "install" { { pnpm install --frozen-lockfile } }
Run "lint" { { pnpm lint } }
Run "typecheck" { { pnpm typecheck } }
Run "test" { { pnpm test:coverage } }
Run "build" { { pnpm build } }

Write-Host "`nCI passed locally." -ForegroundColor Green
