param(
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroupName = "rg-queuelanka-pro",

    [Parameter(Mandatory=$false)]
    [string]$Location = "eastus", # Use eastus as it generally supports the free tiers reliably

    [Parameter(Mandatory=$false)]
    [string]$DbPassword # Passed in or prompted
)

# Prompt for DB password if not provided
if (-not $DbPassword) {
    $DbPassword = Read-Host -Prompt "Enter a secure password for the PostgreSQL Admin user (Must contain upper, lower, number, special char)" -AsSecureString
    $DbPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($DbPassword))
}

Write-Host "Checking Azure Login..."
$azAccount = az account show --query "environmentName" -o tsv
if (-not $azAccount) {
    Write-Host "You are not logged in to Azure CLI. Please run 'az login' first." -ForegroundColor Red
    exit 1
}

Write-Host "Creating Resource Group '$ResourceGroupName' in '$Location'..."
az group create --name $ResourceGroupName --location $Location | Out-Null

Write-Host "Starting Bicep Deployment (This may take roughly 5-10 minutes to provision the database)..."
az deployment group create `
    --resource-group $ResourceGroupName `
    --template-file .\main.bicep `
    --parameters dbAdminPassword=$DbPassword

Write-Host "Deployment Completed!" -ForegroundColor Green
Write-Host "Next Step: Your Azure resources are ready. We can now setup the CI/CD pipeline to push Docker images." -ForegroundColor Cyan
