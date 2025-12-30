# ======================================================
# Interview Engine — Config Validation (AJV CLI direct)
# Validates config/interview-engine/*.json against schemas/interview-engine/*.schema.json
# ======================================================

$ErrorActionPreference = "Stop"

Write-Host "== Validating Interview Engine Configs (AJV CLI direct) ==" -ForegroundColor Cyan

$ConfigDir = "config/interview-engine"
$SchemaDir = "schemas/interview-engine"

$ValidationMap = @{
  "router-policy.json"        = "router-policy.schema.json"
  "depth-governor.json"       = "depth-governor.schema.json"
  "state-machines.json"       = "state-machines.schema.json"
  "negative-constraints.json" = "negative-constraints.schema.json"
}

function Fail([string]$msg) {
  Write-Host $msg -ForegroundColor Red
  exit 1
}

if (-not (Test-Path $ConfigDir)) { Fail "Missing directory: $ConfigDir" }
if (-not (Test-Path $SchemaDir)) { Fail "Missing directory: $SchemaDir" }

foreach ($config in $ValidationMap.Keys) {
  $p = Join-Path $ConfigDir $config
  if (-not (Test-Path $p)) { Fail "Missing config file: $p" }
}

foreach ($schema in $ValidationMap.Values) {
  $p = Join-Path $SchemaDir $schema
  if (-not (Test-Path $p)) { Fail "Missing schema file: $p" }
}

$AjvCmd = Join-Path $PWD "node_modules\.bin\ajv.cmd"
if (-not (Test-Path $AjvCmd)) {
  Fail "AJV CLI not found at $AjvCmd. Run: npm init -y; npm install --save-dev ajv ajv-cli"
}

foreach ($config in $ValidationMap.Keys) {
  $schema = $ValidationMap[$config]
  $ConfigPath = Join-Path $ConfigDir $config
  $SchemaPath = Join-Path $SchemaDir $schema

  Write-Host "Validating $ConfigPath against $SchemaPath..." -ForegroundColor Gray
  & $AjvCmd validate -s $SchemaPath -d $ConfigPath --strict=false --all-errors
  if ($LASTEXITCODE -ne 0) { Fail "Validation failed for $ConfigPath" }
  Write-Host "✔ Valid: $config" -ForegroundColor Green
}

Write-Host "== All Interview Engine configs are valid ==" -ForegroundColor Cyan
exit 0
