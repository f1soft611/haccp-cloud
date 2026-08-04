param(
    [string]$PgBin = "C:\Program Files\PostgreSQL\18\bin",
    [string]$DbHost = "218.155.74.34",
    [int]$Port = 5433,
    [string]$User = "postgres",
    [string]$Database = "haccp_cloud"
)

$psql = Join-Path $PgBin "psql.exe"

if (-not (Test-Path $psql)) {
    throw "psql.exe not found at: $psql"
}

$scriptFiles = @(
    "$PSScriptRoot\add_postgresql_plan_subscription_feature_tables.sql",
    "$PSScriptRoot\migrate_postgresql_add_drafting_work_category_tables.sql",
    "$PSScriptRoot\migrate_postgresql_add_role_system_flag.sql",
    "$PSScriptRoot\migrate_postgresql_add_document_attachment_tables.sql",
    "$PSScriptRoot\migrate_postgresql_drop_tenant_id_from_tb_menu.sql",
    "$PSScriptRoot\migrate_postgresql_add_menu_metadata_columns.sql",
    "$PSScriptRoot\seed_postgresql_minimal_platform_admin.sql",
    "$PSScriptRoot\migrate_postgresql_add_plan_management_menu_mapping.sql",
    "$PSScriptRoot\seed_postgresql_f1soft_plan_bootstrap.sql",
    "$PSScriptRoot\seed_postgresql_sample_tenant_plan_validation.sql"
)

foreach ($file in $scriptFiles) {
    if (-not (Test-Path $file)) {
        throw "Required SQL file not found: $file"
    }
}

$securePassword = Read-Host "PostgreSQL password for user '$User'" -AsSecureString
$passwordBstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)

try {
    $plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordBstr)
    $env:PGPASSWORD = $plainPassword
    $env:PGCLIENTENCODING = "UTF8"

    foreach ($file in $scriptFiles) {
        Write-Host "Applying: $file"
        & $psql -h $DbHost -p $Port -U $User -d $Database -v ON_ERROR_STOP=1 -f $file
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to apply SQL file: $file"
        }
    }

    Write-Host "All latest plan scripts applied successfully."
}
finally {
    if ($passwordBstr -ne [IntPtr]::Zero) {
        [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordBstr)
    }
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    Remove-Item Env:PGCLIENTENCODING -ErrorAction SilentlyContinue
}
