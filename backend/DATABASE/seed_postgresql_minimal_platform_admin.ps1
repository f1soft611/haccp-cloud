param(
    [string]$PgBin = "C:\Program Files\PostgreSQL\18\bin",
    [string]$DbHost = "218.155.74.34",
    [int]$Port = 5433,
    [string]$User = "postgres",
    [string]$Database = "haccp_cloud",
    [string]$SeedFile = "$PSScriptRoot\seed_postgresql_minimal_platform_admin.sql"
)

$psql = Join-Path $PgBin "psql.exe"

if (-not (Test-Path $psql)) {
    throw "psql.exe not found at: $psql"
}

if (-not (Test-Path $SeedFile)) {
    throw "Seed file not found: $SeedFile"
}

$securePassword = Read-Host "PostgreSQL password for user '$User'" -AsSecureString
$passwordBstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)

try {
    $plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordBstr)
    $env:PGPASSWORD = $plainPassword
    $env:PGCLIENTENCODING = "UTF8"

    Write-Host "Applying minimal platform-admin seed to $DbHost`:$Port/$Database ..."
    & $psql -h $DbHost -p $Port -U $User -d $Database -v ON_ERROR_STOP=1 -f $SeedFile
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to apply seed file '$SeedFile'."
    }

    Write-Host "Seed applied successfully."
}
finally {
    if ($passwordBstr -ne [IntPtr]::Zero) {
        [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordBstr)
    }
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    Remove-Item Env:PGCLIENTENCODING -ErrorAction SilentlyContinue
}