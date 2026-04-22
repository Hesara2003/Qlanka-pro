param(
    [string]$GrafanaExe = "C:\Program Files\GrafanaLabs\grafana\bin\grafana-server.exe",
    [string]$GrafanaHome = "C:\Program Files\GrafanaLabs\grafana",
    [string]$PrometheusExe = "C:\Users\Dell\Downloads\prometheus-3.11.0.windows-amd64\prometheus-3.11.0.windows-amd64\prometheus.exe",
    [string]$PrometheusConfig = "deploy/infrastructure/monitoring/prometheus/prometheus.local.yml"
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

if (-not (Test-Path $GrafanaExe)) {
    throw "Grafana executable not found: $GrafanaExe"
}

if (-not (Test-Path $PrometheusExe)) {
    throw "Prometheus executable not found: $PrometheusExe"
}

$resolvedPromConfig = Resolve-Path $PrometheusConfig
$logsDir = Join-Path $repoRoot "logs/observability"
if (-not (Test-Path $logsDir)) {
    New-Item -Path $logsDir -ItemType Directory | Out-Null
}

$grafanaData = Join-Path $repoRoot "artifacts/grafana-data"
$grafanaLogs = Join-Path $repoRoot "artifacts/grafana-logs"
$grafanaPlugins = Join-Path $repoRoot "artifacts/grafana-plugins"
$promData = Join-Path $repoRoot "artifacts/prometheus-data"

foreach ($p in @($grafanaData, $grafanaLogs, $grafanaPlugins, $promData)) {
    if (-not (Test-Path $p)) {
        New-Item -Path $p -ItemType Directory | Out-Null
    }
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

$promOut = Join-Path $logsDir ("prometheus-local-" + $timestamp + ".out.log")
$promErr = Join-Path $logsDir ("prometheus-local-" + $timestamp + ".err.log")
$grafOut = Join-Path $logsDir ("grafana-local-" + $timestamp + ".out.log")
$grafErr = Join-Path $logsDir ("grafana-local-" + $timestamp + ".err.log")

$promProc = Start-Process -FilePath $PrometheusExe -ArgumentList @(
    "--config.file=$resolvedPromConfig",
    "--storage.tsdb.path=$promData",
    "--web.listen-address=:9090"
) -RedirectStandardOutput $promOut -RedirectStandardError $promErr -PassThru

$grafProc = Start-Process -FilePath $GrafanaExe -ArgumentList @(
    "--homepath=$GrafanaHome",
    "cfg:server.http_port=3000",
    "cfg:default.paths.data=$grafanaData",
    "cfg:default.paths.logs=$grafanaLogs",
    "cfg:default.paths.plugins=$grafanaPlugins"
) -RedirectStandardOutput $grafOut -RedirectStandardError $grafErr -PassThru

$state = [PSCustomObject]@{
    StartedAt = (Get-Date).ToString("o")
    Processes = @(
        [PSCustomObject]@{
            Name = "prometheus"
            Pid = $promProc.Id
            Port = 9090
            OutLog = $promOut
            ErrLog = $promErr
        },
        [PSCustomObject]@{
            Name = "grafana"
            Pid = $grafProc.Id
            Port = 3000
            OutLog = $grafOut
            ErrLog = $grafErr
        }
    )
}

$statePath = Join-Path $logsDir "local-grafana-prometheus-processes.json"
$state | ConvertTo-Json -Depth 5 | Set-Content -Path $statePath -Encoding UTF8

Write-Host "Started local Prometheus and Grafana." -ForegroundColor Green
$state.Processes | Format-Table Name,Pid,Port -AutoSize
Write-Host "Prometheus: http://localhost:9090" -ForegroundColor Cyan
Write-Host "Grafana: http://localhost:3000" -ForegroundColor Cyan
Write-Host "State file: $statePath" -ForegroundColor Cyan
