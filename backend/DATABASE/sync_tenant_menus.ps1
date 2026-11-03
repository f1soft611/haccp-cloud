# Re-sync tenant DB tb_menu / TENANT_ADMIN menu permissions from the central
# tb_menu + tb_plan_menu (same result as TenantDatabaseProvisioningServiceImpl at creation).
#
# - Menus in the tenant's ACTIVE plan (plus their ancestors) are upserted (name/url/icon/order/parent).
# - Tenant menus no longer in the plan are set use_at = 'N'.
# - TENANT_ADMIN gets PERM_WRITE on every synced menu (existing grants are kept).
#
# Usage:
#   .\sync_tenant_menus.ps1                            # all tenants
#   .\sync_tenant_menus.ps1 -TenantCode ACME
#   .\sync_tenant_menus.ps1 -DryRun                    # only print the menu lists
param(
    # 기존 -> TenantCode 필수, 업체 1개만 처리
    # 변경 -> TenantCode 선택, 비우면 업체 전체 처리
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
$csvFile = Join-Path $env:TEMP "sync_tenant_menus.csv"
$tenantSqlFile = Join-Path $env:TEMP "sync_tenant_menus.sql"

try {
    $env:PGPASSWORD = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordBstr)
    $env:PGCLIENTENCODING = "UTF8"
    # psql error text in English so it is readable in a non-UTF8 console
    $env:LC_MESSAGES = "C"

    & $psql -h $DbHost -p $Port -U $User -d $CentralDatabase -tA -c "SELECT 1;" | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Cannot connect to $CentralDatabase at ${DbHost}:$Port (check password / pg_hba.conf / network)."
    }

    $tenantFilter = if ($TenantCode) { "AND t.tenant_code = '$TenantCode'" } else { "" }
    $tenants = & $psql -h $DbHost -p $Port -U $User -d $CentralDatabase -tA -F "|" -c @"
SELECT t.tenant_code, d.db_name FROM public.tb_tenant t
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
    Write-Host "Target $($tenants.Count) tenant DB(s)."

    $failed = @()
    foreach ($row in $tenants) {
        $code, $tenantDb = $row.Split("|")
        Write-Host "== $code ($tenantDb)"
        try {
            # Plan menus + ancestors, with parent referenced by menu_code (menu_id differs per DB).
            $exportSql = @"
COPY (
WITH RECURSIVE picked AS (
    SELECT m.menu_id, m.parent_menu_id
    FROM public.tb_tenant t
    JOIN public.tb_tenant_subscription ts ON ts.tenant_id = t.tenant_id AND ts.subscription_status = 'ACTIVE'
    JOIN public.tb_plan_menu pm ON pm.plan_id = ts.plan_id AND pm.use_at = 'Y'
    JOIN public.tb_menu m ON m.menu_code = pm.menu_code
    WHERE t.tenant_code = '$code'
    UNION
    SELECT p.menu_id, p.parent_menu_id
    FROM public.tb_menu p JOIN picked c ON p.menu_id = c.parent_menu_id
)
SELECT m.menu_code, m.menu_nm, m.menu_dc, m.menu_url, COALESCE(m.icon_nm, 'Menu'),
       COALESCE(m.menu_order, 0), parent.menu_code
FROM public.tb_menu m
JOIN (SELECT DISTINCT menu_id FROM picked) x ON x.menu_id = m.menu_id
LEFT JOIN public.tb_menu parent ON parent.menu_id = m.parent_menu_id
ORDER BY m.menu_order, m.menu_id
) TO STDOUT WITH CSV
"@
            & $psql -h $DbHost -p $Port -U $User -d $CentralDatabase -v ON_ERROR_STOP=1 -c $exportSql -o $csvFile
            if ($LASTEXITCODE -ne 0) {
                throw "Failed to export plan menus from central DB."
            }
            $menuCount = @(Get-Content $csvFile -Encoding UTF8 | Where-Object { $_ }).Count
            if ($menuCount -eq 0) {
                Write-Warning "   No plan menus for $code (no ACTIVE subscription?). Skipped."
                continue
            }

            Write-Host "   $menuCount menu(s):"
            Get-Content $csvFile -Encoding UTF8 | ForEach-Object { Write-Host "     $_" }
            if ($DryRun) {
                continue
            }

            $csvPath = $csvFile.Replace('\', '/')
            $tenantSql = @"
BEGIN;
CREATE TEMP TABLE src_menu (
    menu_code VARCHAR(50), menu_nm VARCHAR(100), menu_dc VARCHAR(500), menu_url VARCHAR(500),
    icon_nm VARCHAR(100), menu_order INT, parent_code VARCHAR(50)
) ON COMMIT DROP;
\copy src_menu FROM '$csvPath' WITH (FORMAT csv, ENCODING 'UTF8')

INSERT INTO tb_menu (menu_code, menu_nm, menu_dc, menu_url, icon_nm, menu_order, use_at, created_at, updated_at)
SELECT menu_code, menu_nm, menu_dc, menu_url, icon_nm, menu_order, 'Y', NOW(), NOW() FROM src_menu
ON CONFLICT (menu_code) DO UPDATE
SET menu_nm = EXCLUDED.menu_nm,
    menu_dc = EXCLUDED.menu_dc,
    menu_url = EXCLUDED.menu_url,
    icon_nm = EXCLUDED.icon_nm,
    menu_order = EXCLUDED.menu_order,
    use_at = 'Y',
    updated_at = NOW();

UPDATE tb_menu t
SET parent_menu_id = p.menu_id, updated_at = NOW()
FROM src_menu s
LEFT JOIN tb_menu p ON p.menu_code = s.parent_code
WHERE t.menu_code = s.menu_code
  AND t.parent_menu_id IS DISTINCT FROM p.menu_id;

UPDATE tb_menu
SET use_at = 'N', updated_at = NOW()
WHERE use_at = 'Y'
  AND menu_code NOT IN (SELECT menu_code FROM src_menu);

INSERT INTO tb_role_menu_permission (role_id, menu_id, permission_id)
SELECT r.role_id, m.menu_id, p.permission_id
FROM tb_role r
JOIN tb_permission p ON p.tenant_id = r.tenant_id AND p.permission_code = 'PERM_WRITE'
JOIN tb_menu m ON m.menu_code IN (SELECT menu_code FROM src_menu)
WHERE r.role_code = 'TENANT_ADMIN'
ON CONFLICT (role_id, menu_id, permission_id) DO NOTHING;
COMMIT;
"@
            [System.IO.File]::WriteAllText($tenantSqlFile, $tenantSql, (New-Object System.Text.UTF8Encoding($false)))

            & $psql -h $DbHost -p $Port -U $User -d $tenantDb -v ON_ERROR_STOP=1 -f $tenantSqlFile
            if ($LASTEXITCODE -ne 0) {
                throw "Failed to sync menus into tenant DB (rolled back)"
            }
            Write-Host "   synced"
        }
        catch {
            Write-Warning "   $code ($tenantDb): $_"
            $failed += "$code ($tenantDb)"
        }
    }

    if ($failed.Count -gt 0) {
        throw "Failed tenant(s): $($failed -join ', ')"
    }
    Write-Host "Menu sync completed for $($tenants.Count) tenant DB(s)."
}
finally {
    Remove-Item $csvFile, $tenantSqlFile -ErrorAction SilentlyContinue
    Remove-Item Env:\PGPASSWORD, Env:\PGCLIENTENCODING, Env:\LC_MESSAGES -ErrorAction SilentlyContinue
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordBstr)
}