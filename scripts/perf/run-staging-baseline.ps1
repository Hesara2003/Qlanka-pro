Param(
    [string]$Properties = "tests/jmeter/config/staging.properties",
    [string]$ResultsDir = "artifacts/perf/jmeter"
)

$ErrorActionPreference = "Stop"

$jmeter = ".tools/apache-jmeter-5.6.3/bin/jmeter.bat"
if (-not (Test-Path $jmeter)) {
    throw "JMeter not found at $jmeter"
}

New-Item -Path $ResultsDir -ItemType Directory -Force | Out-Null

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

$bookingResult = Join-Path $ResultsDir "booking-surge-$timestamp.jtl"
$pollingResult = Join-Path $ResultsDir "queue-polling-$timestamp.jtl"
$wsResult = Join-Path $ResultsDir "websocket-updates-$timestamp.jtl"

& $jmeter -n -t tests/jmeter/booking-surge.jmx -q $Properties -l $bookingResult
& $jmeter -n -t tests/jmeter/queue-polling.jmx -q $Properties -l $pollingResult
& $jmeter -n -t tests/jmeter/websocket-updates.jmx -q $Properties -l $wsResult

Write-Host "Generated:"
Write-Host " - $bookingResult"
Write-Host " - $pollingResult"
Write-Host " - $wsResult"
