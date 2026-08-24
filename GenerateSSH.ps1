# Generate SSH Key Pair and Log
param(
    [string]$KeyName = "id_ed25519",
    [string]$TargetDir = "$env:OneDrive\Dalizebo Holdings\imperial_codex\SSHKeys"
)

# Ensure target directory exists
if (-not (Test-Path $TargetDir)) {
    New-Item -ItemType Directory -Path $TargetDir | Out-Null
}

# Full path for key files
$PrivateKeyPath = Join-Path $TargetDir $KeyName
$PublicKeyPath  = "$PrivateKeyPath.pub"

# Generate SSH key
Write-Host "Generating SSH key pair..."
ssh-keygen -t ed25519 -C "lucasphogole@icloud.com" -f $PrivateKeyPath -N ""

# Log the action
$LogFile = "$TargetDir\SSHKeyLog.txt"
$LogEntry = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - Generated SSH key: $KeyName at $TargetDir"
Add-Content -Path $LogFile -Value $LogEntry

# Output paths
Write-Host "Private Key: $PrivateKeyPath"
Write-Host "Public Key:  $PublicKeyPath"
Write-Host "Log File:    $LogFile"
