# Apply a tenant-schema migration SQL file to the central DB and every
# existing tenant database. Tenant DBs are read from tb_tenant_database
# (the same registry PlatformTenantServiceImpl uses when provisioning new
# tenants), so this stays correct as tenants are added/removed.
#
# Usage:
#   .\apply_migration_to_all_tenants.ps1 -MigrationFile .\migrate_postgresql_add_role_dc_column.sql
param(
    [Parameter(Mandatory = $true)]
    [string]$MigrationFile,
    [string]$PgBin = "",
    [string]$DbHost = "218.155.74.34",
    [int]$Port = 5433,
    [string]$User = "postgres",
    [string]$CentralDatabase = "haccp_cloud_central",
    [switch]$SkipCentral
)

if ($PgBin) {
    $psql = Join-Path $PgBin "psql.exe"
} else {
    $onPath = Get-Command psql.exe -ErrorAction SilentlyContinue
    $psql = if ($onPath) { $onPath.Source } else { "C:\Program Files\PostgreSQL\18\bin\psql.exe" }
}

if (-not (Test-Path $psql)) {
    throw "psql.exe not found at: $psql (pass -PgBin to point at your PostgreSQL bin directory)"
}
if (-not (Test-Path $MigrationFile)) {
    throw "Migration file not found: $MigrationFile"
}

$securePassword = Read-Host "PostgreSQL password for user '$User'" -AsSecureString
$passwordBstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)

try {
    $plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordBstr)
    $env:PGPASSWORD = $plainPassword
    $env:PGCLIENTENCODING = "UTF8"

    $tenantDbNames = & $psql -h $DbHost -p $Port -U $User -d $CentralDatabase -tA `
        -c "SELECT db_name FROM public.tb_tenant_database WHERE use_at = 'Y' ORDER BY db_name;"
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to read tenant database list from tb_tenant_database."
    }
    $tenantDbNames = $tenantDbNames | Where-Object { $_ -and $_.Trim() -ne "" }

    $targetDatabases = @()
    if (-not $SkipCentral) {
        $targetDatabases += $CentralDatabase
    }
    $targetDatabases += $tenantDbNames

    Write-Host "Applying $MigrationFile to $($targetDatabases.Count) database(s): $($targetDatabases -join ', ')"

    foreach ($db in $targetDatabases) {
        Write-Host "Applying to database: $db"
        & $psql -h $DbHost -p $Port -U $User -d $db -v ON_ERROR_STOP=1 -f $MigrationFile
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to apply migration to database: $db"
        }
    }

    Write-Host "Migration applied to all databases successfully."
}
finally {
    if ($passwordBstr -ne [IntPtr]::Zero) {
        [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordBstr)
    }
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    Remove-Item Env:PGCLIENTENCODING -ErrorAction SilentlyContinue
}
