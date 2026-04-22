param(
    [string]$PrometheusExe = "",
    [switch]$SkipPrometheus,
    [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

$logsDir = Join-Path $repoRoot "logs/observability"
if (-not (Test-Path $logsDir)) {
    New-Item -Path $logsDir -ItemType Directory | Out-Null
}

$processStatePath = Join-Path $logsDir "processes.json"
$startTime = Get-Date -Format "yyyyMMdd-HHmmss"

function Start-DotnetService {
    param(
        [string]$Name,
        [string]$ProjectPath,
        [int]$Port,
        [hashtable]$Env
    )

    $stdout = Join-Path $logsDir ("$Name-$startTime.out.log")
    $stderr = Join-Path $logsDir ("$Name-$startTime.err.log")

    $scriptBlock = @()
    $scriptBlock += "`$env:ASPNETCORE_ENVIRONMENT = 'Development'"
    $scriptBlock += "`$env:ASPNETCORE_URLS = 'http://localhost:$Port'"

    foreach ($key in $Env.Keys) {
        $value = $Env[$key].Replace("'", "''")
        $escapedKey = $key.Replace("'", "''")
        $scriptBlock += "Set-Item -Path 'Env:$escapedKey' -Value '$value'"
    }

    $escapedProjectPath = $ProjectPath.Replace("'", "''")
    $scriptBlock += "dotnet run --project '$escapedProjectPath'"

    $command = $scriptBlock -join "; "

    $proc = Start-Process -FilePath "powershell" -ArgumentList @(
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-Command", $command
    ) -RedirectStandardOutput $stdout -RedirectStandardError $stderr -PassThru

    return [PSCustomObject]@{
        Name = $Name
        Pid = $proc.Id
        Port = $Port
        OutLog = $stdout
        ErrLog = $stderr
        Kind = "dotnet"
    }
}

function Start-Prometheus {
    param([string]$ExePath)

    $resolvedConfig = Resolve-Path "deploy/infrastructure/monitoring/prometheus/prometheus.local.yml"
    $promDataPath = Join-Path $repoRoot "artifacts/prometheus-data"
    if (-not (Test-Path $promDataPath)) {
        New-Item -Path $promDataPath -ItemType Directory | Out-Null
    }

    if ([string]::IsNullOrWhiteSpace($ExePath)) {
        $promCmd = Get-Command "prometheus" -ErrorAction SilentlyContinue
        if ($null -ne $promCmd) {
            $ExePath = $promCmd.Source
        }
    }

    if (-not [string]::IsNullOrWhiteSpace($ExePath)) {
        $ExePath = $ExePath.Trim().Trim('"')
        if ((Test-Path $ExePath) -and (Get-Item $ExePath).PSIsContainer) {
            $candidate = Join-Path $ExePath "prometheus.exe"
            if (Test-Path $candidate) {
                $ExePath = $candidate
            }
        }
    }

    if ([string]::IsNullOrWhiteSpace($ExePath) -or -not (Test-Path $ExePath)) {
        throw "Prometheus executable not found. Checked path: '$ExePath'. Pass -PrometheusExe C:\\path\\to\\prometheus.exe or use -SkipPrometheus to start only backend services."
    }

    $stdout = Join-Path $logsDir ("prometheus-$startTime.out.log")
    $stderr = Join-Path $logsDir ("prometheus-$startTime.err.log")

    $proc = Start-Process -FilePath $ExePath -ArgumentList @(
        "--config.file=$resolvedConfig",
        "--storage.tsdb.path=$promDataPath",
        "--web.listen-address=:9090"
    ) -RedirectStandardOutput $stdout -RedirectStandardError $stderr -PassThru

    return [PSCustomObject]@{
        Name = "prometheus"
        Pid = $proc.Id
        Port = 9090
        OutLog = $stdout
        ErrLog = $stderr
        Kind = "prometheus"
    }
}

$started = @()

# Start dependency services first.
$started += Start-DotnetService -Name "identity" -ProjectPath "backend/QueueLanka.Identity/QueueLanka.Identity.csproj" -Port 5177 -Env @{}
$started += Start-DotnetService -Name "service-center" -ProjectPath "backend/QueueLanka.ServiceCenter/QueueLanka.ServiceCenter.csproj" -Port 5137 -Env @{}
$started += Start-DotnetService -Name "queue" -ProjectPath "backend/QueueLanka.Queue/QueueLanka.Queue.csproj" -Port 5239 -Env @{
    "ServiceUrls__ServiceCenter" = "http://localhost:5137/"
}
$started += Start-DotnetService -Name "gateway" -ProjectPath "backend/QueueLanka.Gateway/QueueLanka.Gateway.csproj" -Port 5012 -Env @{
    "ReverseProxy__Clusters__identity-cluster__Destinations__destination1__Address" = "http://localhost:5177/"
    "ReverseProxy__Clusters__servicecenter-cluster__Destinations__destination1__Address" = "http://localhost:5137/"
    "ReverseProxy__Clusters__queue-cluster__Destinations__destination1__Address" = "http://localhost:5239/"
}

if (-not $SkipPrometheus) {
    $started += Start-Prometheus -ExePath $PrometheusExe
} else {
    Write-Host "Skipping Prometheus startup (-SkipPrometheus enabled)." -ForegroundColor Yellow
}

$state = [PSCustomObject]@{
    StartedAt = (Get-Date).ToString("o")
    Processes = $started
}

$state | ConvertTo-Json -Depth 5 | Set-Content -Path $processStatePath -Encoding UTF8

Write-Host "Local observability stack started." -ForegroundColor Green
$started | Format-Table Name, Pid, Port, Kind -AutoSize
Write-Host ""
Write-Host "Logs: $logsDir" -ForegroundColor Cyan
if (-not $SkipPrometheus) {
    Write-Host "Prometheus targets: http://localhost:9090/targets" -ForegroundColor Cyan
}
Write-Host "Gateway health: http://localhost:5012/health" -ForegroundColor Cyan

if (-not $NoBrowser -and -not $SkipPrometheus) {
    Start-Process "http://localhost:9090/targets"
}
