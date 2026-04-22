$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$statePath = Join-Path $repoRoot "logs/observability/local-grafana-prometheus-processes.json"

if (-not (Test-Path $statePath)) {
    Write-Host "No Grafana/Prometheus state file found at $statePath" -ForegroundColor Yellow
    exit 0
}

$state = Get-Content $statePath -Raw | ConvertFrom-Json

foreach ($proc in $state.Processes) {
    try {
        $running = Get-Process -Id $proc.Pid -ErrorAction SilentlyContinue
        if ($null -ne $running) {
            Stop-Process -Id $proc.Pid -Force
            Write-Host "Stopped $($proc.Name) (PID $($proc.Pid))"
        } else {
            Write-Host "Already stopped: $($proc.Name) (PID $($proc.Pid))"
        }
    }
    catch {
        Write-Host "Failed to stop $($proc.Name) (PID $($proc.Pid)): $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Remove-Item $statePath -Force
Write-Host "Local Grafana/Prometheus processes stopped." -ForegroundColor Green
