param(
  [int]$Port = 3000,
  [switch]$SeedDemoData
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptDir
Set-Location $repoRoot

if (-not (Test-Path ".env.local")) {
  throw "Missing .env.local. Copy .env.example to .env.local, set AUTH_SECRET, DATABASE_URL, and ENABLE_DEV_AUTH=true for a private review tunnel."
}

Write-Host "Starting local PostgreSQL..."
docker compose up -d postgres

Write-Host "Preparing Prisma..."
corepack pnpm prisma:generate
corepack pnpm prisma:deploy

if ($SeedDemoData) {
  Write-Host "Seeding deterministic demo data..."
  $env:SEED_DEMO_DATA = "true"
  corepack pnpm prisma:seed
}

$env:HOSTNAME = "0.0.0.0"
$env:PORT = "$Port"

Write-Host "Starting Pabal on http://localhost:$Port and http://0.0.0.0:$Port"
Write-Host "For public review, route Cloudflare Tunnel to http://localhost:$Port and protect it with Cloudflare Access."
corepack pnpm exec next dev --hostname 0.0.0.0 --port $Port
