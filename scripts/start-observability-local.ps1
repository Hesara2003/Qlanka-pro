param(
    [string]$PrometheusExe = "",
    [string]$PrometheusConfig = "deploy/infrastructure/monitoring/prometheus/prometheus.local.yml",
    [int]$PrometheusPort = 9090,
    [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

$resolvedConfig = Resolve-Path $PrometheusConfig

if ([string]::IsNullOrWhiteSpace($PrometheusExe)) {
    $promCmd = Get-Command "prometheus" -ErrorAction SilentlyContinue
    if ($null -ne $promCmd) {
        $PrometheusExe = $promCmd.Source
    }
}

if ([string]::IsNullOrWhiteSpace($PrometheusExe)) {
    Write-Host "Prometheus executable not found." -ForegroundColor Yellow
    Write-Host "Install Prometheus and rerun with -PrometheusExe <path-to-prometheus.exe>." -ForegroundColor Yellow
    Write-Host "Example: .\\scripts\\start-observability-local.ps1 -PrometheusExe C:\\tools\\prometheus\\prometheus.exe" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path $PrometheusExe)) {
    throw "Prometheus executable path is invalid: $PrometheusExe"
}

Write-Host "Starting Prometheus with config: $resolvedConfig" -ForegroundColor Cyan
$prometheusProcess = Start-Process -FilePath $PrometheusExe -ArgumentList @(
    "--config.file=$resolvedConfig",
    "--web.listen-address=:$PrometheusPort"
) -PassThru

Write-Host "Prometheus started (PID: $($prometheusProcess.Id)) on http://localhost:$PrometheusPort" -ForegroundColor Green
Write-Host "Start backend services, then open Grafana and add datasource http://localhost:$PrometheusPort if not already configured." -ForegroundColor Green

if (-not $NoBrowser) {
    Start-Process "http://localhost:$PrometheusPort/targets"
}
