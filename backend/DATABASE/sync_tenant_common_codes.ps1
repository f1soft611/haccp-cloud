# Add central (PLATFORM / 000001) common code groups and items that are missing
# in existing tenant DBs. Same source rows as copyCommonCodes() in
# TenantDatabaseProvisioningServiceImpl, but matched by code instead of PK
# (tenant sequences may already have used the central PKs).
#
# - Groups: central use_at = 'Y' groups, inserted when (tenant_id, group_code) is missing.
# - Items: every item of those groups, inserted when (group_id, item_code) is missing.
# - Existing rows are never updated (tenants may have edited them).
# - parent_group_id / parent_item_id are set only on rows inserted by this run.
#
# Usage:
#   .\sync_tenant_common_codes.ps1                     # all tenants
#   .\sync_tenant_common_codes.ps1 -TenantCode ACME
#   .\sync_tenant_common_codes.ps1 -DryRun             # run in a transaction, print counts, roll back
param(
    [string]$TenantCode = "",
    [switch]$DryRun,
    [string]$PgBin = "",
    [string]$DbHost = "218.155.74.34",
    [int]$Port = 5433,
    [string]$User = "postgres",
    [string]$CentralDatabase = "haccp_cloud_central"
)

if ($TenantCode -and $TenantCode -notmatch '^[A-Za-z0-9_]+$') {
    throw "Invalid TenantCode: $TenantCode"
}

if ($PgBin) {
    $psql = Join-Path $PgBin "psql.exe"
} else {
    $onPath = Get-Command psql.exe -ErrorAction SilentlyContinue
    $psql = if ($onPath) { $onPath.Source } else { "C:\Program Files\PostgreSQL\18\bin\psql.exe" }
}
if (-not (Test-Path $psql)) {
    throw "psql.exe not found at: $psql (pass -PgBin to point at your PostgreSQL bin directory)"
}

$securePassword = Read-Host "PostgreSQL password for user '$User'" -AsSecureString
$passwordBstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
$groupCsvFile = Join-Path $env:TEMP "sync_tenant_common_code_groups.csv"
$itemCsvFile = Join-Path $env:TEMP "sync_tenant_common_code_items.csv"
$tenantSqlFile = Join-Path $env:TEMP "sync_tenant_common_codes.sql"

try {
    $env:PGPASSWORD = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordBstr)
    $env:PGCLIENTENCODING = "UTF8"
    # psql error text in English so it is readable in a non-UTF8 console
    $env:LC_MESSAGES = "C"

    & $psql -h $DbHost -p $Port -U $User -d $CentralDatabase -tA -c "SELECT 1;" | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Cannot connect to $CentralDatabase at ${DbHost}:$Port (check password / pg_hba.conf / network)."
    }

    # Central rows do not depend on the tenant, so export once.
    # Parents are carried as codes; a parent outside the copied set stays NULL (same as provisioning).
    $groupExportSql = @"
COPY (
SELECT g.group_code, g.group_nm, g.group_dc, g.sort_order, pg.group_code
FROM public.tb_common_code_group g
JOIN public.tb_tenant t ON t.tenant_id = g.tenant_id
LEFT JOIN public.tb_common_code_group pg ON pg.common_code_group_id = g.parent_group_id AND pg.use_at = 'Y'
WHERE UPPER(t.tenant_code) IN ('PLATFORM', '000001') AND g.use_at = 'Y'
ORDER BY g.common_code_group_id
) TO STDOUT WITH CSV
"@
    & $psql -h $DbHost -p $Port -U $User -d $CentralDatabase -v ON_ERROR_STOP=1 -c $groupExportSql -o $groupCsvFile
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to export common code groups from central DB."
    }

    $itemExportSql = @"
COPY (
SELECT g.group_code, i.item_code, i.item_nm, i.item_dc, i.sort_order, i.use_at, pg.group_code, pi.item_code
FROM public.tb_common_code_item i
JOIN public.tb_common_code_group g ON g.common_code_group_id = i.group_id
JOIN public.tb_tenant t ON t.tenant_id = g.tenant_id
LEFT JOIN public.tb_common_code_item pi ON pi.common_code_item_id = i.parent_item_id
LEFT JOIN public.tb_common_code_group pg ON pg.common_code_group_id = pi.group_id AND pg.use_at = 'Y'
WHERE UPPER(t.tenant_code) IN ('PLATFORM', '000001') AND g.use_at = 'Y'
ORDER BY i.common_code_item_id
) TO STDOUT WITH CSV
"@
    & $psql -h $DbHost -p $Port -U $User -d $CentralDatabase -v ON_ERROR_STOP=1 -c $itemExportSql -o $itemCsvFile
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to export common code items from central DB."
    }

    $groupCount = @(Get-Content $groupCsvFile -Encoding UTF8 | Where-Object { $_ }).Count
    $itemCount = @(Get-Content $itemCsvFile -Encoding UTF8 | Where-Object { $_ }).Count
    Write-Host "Central: $groupCount group(s), $itemCount item(s)."
    if ($groupCount -eq 0) {
        throw "No central common code groups found (tenant_code PLATFORM / 000001)."
    }

    $tenantFilter = if ($TenantCode) { "AND t.tenant_code = '$TenantCode'" } else { "" }
    $tenants = & $psql -h $DbHost -p $Port -U $User -d $CentralDatabase -tA -F "|" -c @"
SELECT t.tenant_code, t.tenant_id, d.db_name FROM public.tb_tenant t
JOIN public.tb_tenant_database d ON d.tenant_id = t.tenant_id
WHERE d.use_at = 'Y' $tenantFilter
ORDER BY d.db_name;
"@
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to read tenant database list."
    }
    $tenants = @($tenants | Where-Object { $_ -and $_.Trim() -ne "" })
    if ($tenants.Count -eq 0) {
        throw "No tenant databases found$(if ($TenantCode) { " for tenant_code=$TenantCode" })."
    }
    Write-Host "Target $($tenants.Count) tenant DB(s).$(if ($DryRun) { ' (DryRun: rolled back)' })"

    $groupCsvPath = $groupCsvFile.Replace('\', '/')
    $itemCsvPath = $itemCsvFile.Replace('\', '/')
    $endTx = if ($DryRun) { "ROLLBACK;" } else { "COMMIT;" }

    $failed = @()
    foreach ($row in $tenants) {
        $code, $tenantId, $tenantDb = $row.Split("|")
        Write-Host "== $code ($tenantDb)"
        try {
            $tenantSql = @"
BEGIN;
CREATE TEMP TABLE src_group (
    group_code VARCHAR(50), group_nm VARCHAR(200), group_dc VARCHAR(500),
    sort_order INT, parent_group_code VARCHAR(50)
) ON COMMIT DROP;
CREATE TEMP TABLE src_item (
    group_code VARCHAR(50), item_code VARCHAR(50), item_nm VARCHAR(200), item_dc VARCHAR(500),
    sort_order INT, use_at CHAR(1), parent_group_code VARCHAR(50), parent_item_code VARCHAR(50)
) ON COMMIT DROP;
CREATE TEMP TABLE new_group (group_id BIGINT) ON COMMIT DROP;
CREATE TEMP TABLE new_item (item_id BIGINT) ON COMMIT DROP;
\copy src_group FROM '$groupCsvPath' WITH (FORMAT csv, ENCODING 'UTF8')
\copy src_item FROM '$itemCsvPath' WITH (FORMAT csv, ENCODING 'UTF8')

WITH ins AS (
    INSERT INTO public.tb_common_code_group (tenant_id, group_code, group_nm, group_dc, sort_order, use_at)
    SELECT $tenantId, group_code, group_nm, group_dc, sort_order, 'Y' FROM src_group
    ON CONFLICT (tenant_id, group_code) DO NOTHING
    RETURNING common_code_group_id
)
INSERT INTO new_group SELECT common_code_group_id FROM ins;

UPDATE public.tb_common_code_group g
SET parent_group_id = p.common_code_group_id
FROM src_group s
JOIN public.tb_common_code_group p ON p.tenant_id = $tenantId AND p.group_code = s.parent_group_code
WHERE g.common_code_group_id IN (SELECT group_id FROM new_group)
  AND g.group_code = s.group_code;

WITH ins AS (
    INSERT INTO public.tb_common_code_item (tenant_id, group_id, item_code, item_nm, item_dc, sort_order, use_at)
    SELECT $tenantId, g.common_code_group_id, s.item_code, s.item_nm, s.item_dc, s.sort_order, s.use_at
    FROM src_item s
    JOIN public.tb_common_code_group g ON g.tenant_id = $tenantId AND g.group_code = s.group_code
    ON CONFLICT (group_id, item_code) DO NOTHING
    RETURNING common_code_item_id
)
INSERT INTO new_item SELECT common_code_item_id FROM ins;

UPDATE public.tb_common_code_item i
SET parent_item_id = pi.common_code_item_id
FROM src_item s
JOIN public.tb_common_code_group g ON g.tenant_id = $tenantId AND g.group_code = s.group_code
JOIN public.tb_common_code_group pg ON pg.tenant_id = $tenantId AND pg.group_code = s.parent_group_code
JOIN public.tb_common_code_item pi ON pi.group_id = pg.common_code_group_id AND pi.item_code = s.parent_item_code
WHERE i.common_code_item_id IN (SELECT item_id FROM new_item)
  AND i.group_id = g.common_code_group_id
  AND i.item_code = s.item_code;

SELECT 'added groups: ' || (SELECT COUNT(*) FROM new_group) || ', added items: ' || (SELECT COUNT(*) FROM new_item);
$endTx
"@
            [System.IO.File]::WriteAllText($tenantSqlFile, $tenantSql, (New-Object System.Text.UTF8Encoding($false)))

            & $psql -h $DbHost -p $Port -U $User -d $tenantDb -v ON_ERROR_STOP=1 -tA -q -f $tenantSqlFile
            if ($LASTEXITCODE -ne 0) {
                throw "Failed to sync common codes into tenant DB (rolled back)"
            }
        }
        catch {
            Write-Warning "   $code ($tenantDb): $_"
            $failed += "$code ($tenantDb)"
        }
    }

    if ($failed.Count -gt 0) {
        throw "Failed tenant(s): $($failed -join ', ')"
    }
    Write-Host "Common code sync completed for $($tenants.Count) tenant DB(s)."
}
finally {
    Remove-Item $groupCsvFile, $itemCsvFile, $tenantSqlFile -ErrorAction SilentlyContinue
    Remove-Item Env:\PGPASSWORD, Env:\PGCLIENTENCODING, Env:\LC_MESSAGES -ErrorAction SilentlyContinue
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordBstr)
}