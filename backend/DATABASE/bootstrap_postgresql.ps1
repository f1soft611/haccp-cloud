param(
    [string]$PgBin = "C:\Program Files\PostgreSQL\18\bin",
    [string]$PgHost = "localhost",
    [int]$Port = 5432,
    [string]$AdminUser = "postgres",
    [string]$Database = "haccp_cloud",
    [string]$SchemaFile = "$PSScriptRoot\login_postgresql_schema.sql",
    [switch]$ForceRecreateSchema
)

$psql = Join-Path $PgBin "psql.exe"
$createdb = Join-Path $PgBin "createdb.exe"

if (-not (Test-Path $psql)) {
    throw "psql.exe not found at: $psql"
}

if (-not (Test-Path $createdb)) {
    throw "createdb.exe not found at: $createdb"
}

if (-not (Test-Path $SchemaFile)) {
    throw "Schema file not found: $SchemaFile"
}

$securePassword = Read-Host "PostgreSQL password for user '$AdminUser'" -AsSecureString
$passwordBstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)

try {
    $plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordBstr)
    $env:PGPASSWORD = $plainPassword

    $dbExists = & $psql -h $PgHost -p $Port -U $AdminUser -d postgres -tA -c "SELECT 1 FROM pg_database WHERE datname='$Database';"
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to connect to PostgreSQL as '$AdminUser'. Check host/port/credentials."
    }

    if ([string]::IsNullOrWhiteSpace($dbExists) -or $dbExists.Trim() -ne "1") {
        Write-Host "Creating database '$Database'..."
        & $createdb -h $PgHost -p $Port -U $AdminUser $Database
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to create database '$Database'."
        }
    } else {
        Write-Host "Database '$Database' already exists."
    }

    if ($ForceRecreateSchema) {
        Write-Host "Force resetting schema 'public' in database '$Database'..."
        & $psql -h $PgHost -p $Port -U $AdminUser -d $Database -v ON_ERROR_STOP=1 -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;"
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to force reset schema 'public'. Check active sessions/permissions."
        }
    }

    Write-Host "Applying schema file: $SchemaFile"
    $env:PGCLIENTENCODING = 'UTF8'
    & $psql -h $PgHost -p $Port -U $AdminUser -d $Database -f $SchemaFile
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to apply schema file '$SchemaFile'."
    }

    Write-Host "Bootstrap completed successfully."
}
finally {
    if ($passwordBstr -ne [IntPtr]::Zero) {
        [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordBstr)
    }
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}