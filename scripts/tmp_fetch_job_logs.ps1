$ErrorActionPreference = 'Stop'

$credentialInput = "protocol=https`nhost=github.com`n`n"
$raw = $credentialInput | git credential-manager get

$map = @{}
$raw -split "`r?`n" | ForEach-Object {
  if ($_ -match '^(?<k>[^=]+)=(?<v>.*)$') {
    $map[$Matches.k] = $Matches.v
  }
}

$token = $map['password']
if (-not $token) {
  throw 'No GitHub token from credential manager.'
}

$headers = @{
  Authorization = "Bearer $token"
  Accept = 'application/vnd.github+json'
  'X-GitHub-Api-Version' = '2022-11-28'
}

$jobId = '72446623613'
$zipPath = 'gh_job_logs.zip'
$extractDir = 'gh_job_logs'

if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
if (Test-Path $extractDir) { Remove-Item $extractDir -Recurse -Force }

Invoke-WebRequest -Headers $headers -Uri ("https://api.github.com/repos/Hesara2003/Qlanka-pro/actions/jobs/" + $jobId + "/logs") -OutFile $zipPath
Expand-Archive -Path $zipPath -DestinationPath $extractDir -Force

rg -n "ACR|acr login|unauthorized|denied|forbidden|Process completed with exit code|docker login|ERROR|error" $extractDir -S
