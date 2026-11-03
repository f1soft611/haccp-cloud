# Create tb_workdate / tb_week in every tenant DB (DDL dumped from central as-is)
# and copy the rows from central.
#
# Source rows per tenant: central rows of that tenant_id if any exist,
# otherwise the platform tenant's rows (tenant_code PLATFORM / 000001, same rule as copyCommonCodes).
# tenant_id is rewritten to the target tenant, created_by/updated_by are NULL (user ids differ per DB).
# Re-runnable: existing tables are not recreated, existing rows are skipped (ON CONFLICT DO NOTHING).
#
# Usage:
#   .\migrate_tenant_workdate_week.ps1                     # all tenants
#   .\migrate_tenant_workdate_week.ps1 -TenantCode ACME    # one tenant
param(
    [string]$TenantCode = "",
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
$pgDump = Join-Path (Split-Path $psql) "pg_dump.exe"
if (-not (Test-Path $psql) -or -not (Test-Path $pgDump)) {
    throw "psql.exe / pg_dump.exe not found next to: $psql (pass -PgBin to point at your PostgreSQL bin directory)"
}

$securePassword = Read-Host "PostgreSQL password for user '$User'" -AsSecureString
$passwordBstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
$ddlFile = Join-Path $env:TEMP "migrate_workdate_week_ddl.sql"
$workdateCsv = Join-Path $env:TEMP "migrate_workdate.csv"
$weekCsv = Join-Path $env:TEMP "migrate_week.csv"
$dataSqlFile = Join-Path $env:TEMP "migrate_workdate_week_data.sql"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

try {
    $env:PGPASSWORD = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordBstr)
    $env:PGCLIENTENCODING = "UTF8"

    # Exact central DDL (columns, sequences, PK/UK/CHECK/FK, indexes, comments).
    & $pgDump -h $DbHost -p $Port -U $User -d $CentralDatabase --schema-only --no-owner --no-privileges `
        -t public.tb_workdate -t public.tb_week -f $ddlFile
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to dump tb_workdate / tb_week DDL from central DB."
    }

    $tenantFilter = if ($TenantCode) { "AND t.tenant_code = '$TenantCode'" } else { "" }
    $tenants = & $psql -h $DbHost -p $Port -U $User -d $CentralDatabase -tA -F "|" -c @"
SELECT t.tenant_id, t.tenant_code, d.db_name
FROM public.tb_tenant t
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
        $tenantId, $code, $db = $row.Split("|")
        Write-Host "== $code ($db), tenant_id=$tenantId"
        try {
            # Rows of this tenant in central, else the platform tenant's rows.
            $sourceTenant = @"
(SELECT CASE WHEN EXISTS (SELECT 1 FROM public.{0} WHERE tenant_id = $tenantId) THEN $tenantId
        ELSE (SELECT tenant_id FROM public.tb_tenant WHERE UPPER(tenant_code) IN ('PLATFORM', '000001') ORDER BY tenant_id LIMIT 1) END)
"@
            & $psql -h $DbHost -p $Port -U $User -d $CentralDatabase -v ON_ERROR_STOP=1 -o $workdateCsv -c @"
COPY (SELECT work_date, work_type, work_source, work_name, work_memo, created_at, updated_at FROM public.tb_workdate
      WHERE tenant_id = $($sourceTenant -f 'tb_workdate') ORDER BY work_date) TO STDOUT WITH CSV
"@
            if ($LASTEXITCODE -ne 0) { throw "export tb_workdate failed" }
            & $psql -h $DbHost -p $Port -U $User -d $CentralDatabase -v ON_ERROR_STOP=1 -o $weekCsv -c @"
COPY (SELECT year, from_date, to_date, week, created_at, updated_at FROM public.tb_week
      WHERE tenant_id = $($sourceTenant -f 'tb_week') ORDER BY year, week) TO STDOUT WITH CSV
"@
            if ($LASTEXITCODE -ne 0) { throw "export tb_week failed" }

            $exists = & $psql -h $DbHost -p $Port -U $User -d $db -tA -c `
                "SELECT (to_regclass('public.tb_workdate') IS NOT NULL)::int + (to_regclass('public.tb_week') IS NOT NULL)::int;"
            if ($LASTEXITCODE -ne 0) { throw "table check failed" }
            switch ("$exists".Trim()) {
                "0" {
                    & $psql -h $DbHost -p $Port -U $User -d $db -v ON_ERROR_STOP=1 -q -1 -f $ddlFile
                    if ($LASTEXITCODE -ne 0) { throw "DDL failed" }
                    Write-Host "   tables created"
                }
                "2" { Write-Host "   tables already exist, DDL skipped" }
                # ponytail: half-created state needs a look, not a guess
                default { throw "only one of tb_workdate / tb_week exists, fix manually" }
            }

            $workdatePath = $workdateCsv.Replace('\', '/')
            $weekPath = $weekCsv.Replace('\', '/')
            # 기존 -> 테이블이 이미 있으면 컬럼 변경 없이 데이터만 복사
            # 변경 -> 먼저 만들어진 테넌트 테이블에 work_source, work_name, work_memo 컬럼을 추가하고 함께 복사
            $dataSql = @"
BEGIN;
ALTER TABLE public.tb_workdate ADD COLUMN IF NOT EXISTS work_source VARCHAR(20);
ALTER TABLE public.tb_workdate ADD COLUMN IF NOT EXISTS work_name VARCHAR(100);
ALTER TABLE public.tb_workdate ADD COLUMN IF NOT EXISTS work_memo VARCHAR(100);
CREATE TEMP TABLE src_workdate (work_date DATE, work_type VARCHAR(50), work_source VARCHAR(20), work_name VARCHAR(100), work_memo VARCHAR(100), created_at TIMESTAMP, updated_at TIMESTAMP) ON COMMIT DROP;
CREATE TEMP TABLE src_week (year INT, from_date DATE, to_date DATE, week INT, created_at TIMESTAMP, updated_at TIMESTAMP) ON COMMIT DROP;
\copy src_workdate FROM '$workdatePath' WITH (FORMAT csv, ENCODING 'UTF8')
\copy src_week FROM '$weekPath' WITH (FORMAT csv, ENCODING 'UTF8')

INSERT INTO public.tb_workdate (tenant_id, work_date, work_type, work_source, work_name, work_memo, created_at, updated_at)
SELECT $tenantId, work_date, work_type, work_source, work_name, work_memo, created_at, updated_at FROM src_workdate
ON CONFLICT DO NOTHING;

INSERT INTO public.tb_week (tenant_id, year, from_date, to_date, week, created_at, updated_at)
SELECT $tenantId, year, from_date, to_date, week, created_at, updated_at FROM src_week
ON CONFLICT DO NOTHING;

SELECT (SELECT COUNT(*) FROM src_workdate) AS src_workdate, (SELECT COUNT(*) FROM public.tb_workdate WHERE tenant_id = $tenantId) AS tenant_workdate,
       (SELECT COUNT(*) FROM src_week) AS src_week, (SELECT COUNT(*) FROM public.tb_week WHERE tenant_id = $tenantId) AS tenant_week;
COMMIT;
"@
            [System.IO.File]::WriteAllText($dataSqlFile, $dataSql, $utf8NoBom)
            & $psql -h $DbHost -p $Port -U $User -d $db -v ON_ERROR_STOP=1 -f $dataSqlFile
            if ($LASTEXITCODE -ne 0) { throw "data copy failed (rolled back)" }
        }
        catch {
            Write-Warning "   $code ($db): $_"
            $failed += "$code ($db)"
        }
    }

    if ($failed.Count -gt 0) {
        throw "Failed tenant(s): $($failed -join ', ')"
    }
    Write-Host "tb_workdate / tb_week migrated to all target tenants."
}
finally {
    Remove-Item $ddlFile, $workdateCsv, $weekCsv, $dataSqlFile -ErrorAction SilentlyContinue
    Remove-Item Env:\PGPASSWORD, Env:\PGCLIENTENCODING -ErrorAction SilentlyContinue
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordBstr)
}
