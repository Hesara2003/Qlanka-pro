$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$processStatePath = Join-Path $repoRoot "logs/observability/processes.json"

if (-not (Test-Path $processStatePath)) {
    Write-Host "No process state file found at $processStatePath" -ForegroundColor Yellow
    exit 0
}

$state = Get-Content $processStatePath -Raw | ConvertFrom-Json

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

Remove-Item $processStatePath -Force
Write-Host "Local observability stack stopped." -ForegroundColor Green
