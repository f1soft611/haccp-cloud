$ErrorActionPreference = 'Stop'

$sourceDb = 'haccp_cloud'
$targetDb = 'haccp_cloud_central'
$hostName = '218.155.74.34'
$port = 5433
$user = 'postgres'
if (-not $env:PGPASSWORD) {
    throw 'PGPASSWORD is required. Set it in the environment before running this script.'
}
$password = $env:PGPASSWORD
$tempDir = 'C:/temp'

New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

$env:PGPASSWORD = $password
$psql = 'C:\Program Files\PostgreSQL\18\bin\psql.exe'

$exportQueries = @(
    "\\copy (SELECT tenant_id, tenant_code, tenant_nm, admin_email, logo_image, onboarding_status, use_at, created_at, updated_at, created_by FROM public.tb_tenant WHERE tenant_code <> 'PLATFORM' ORDER BY tenant_id) TO '$tempDir/legacy_tb_tenant.csv' WITH CSV HEADER",
    "\\copy (SELECT tenant_domain_id, tenant_id, email_domain, is_primary, use_at, created_at, updated_at FROM public.tb_tenant_domain WHERE tenant_id IN (SELECT tenant_id FROM public.tb_tenant WHERE tenant_code <> 'PLATFORM') ORDER BY tenant_domain_id) TO '$tempDir/legacy_tb_tenant_domain.csv' WITH CSV HEADER",
    "\\copy (SELECT login_id, tenant_id, login_code, password_hash, profile_image, stamp_image, login_attempt_count, locked_at, password_changed_at, use_at, created_at, updated_at FROM public.tb_login_account WHERE tenant_id IN (SELECT tenant_id FROM public.tb_tenant WHERE tenant_code <> 'PLATFORM') ORDER BY login_id) TO '$tempDir/legacy_tb_login_account.csv' WITH CSV HEADER",
    "\\copy (SELECT role_id, tenant_id, role_code, role_nm, use_at, is_system_role, created_at, updated_at FROM public.tb_role WHERE tenant_id IN (SELECT tenant_id FROM public.tb_tenant WHERE tenant_code <> 'PLATFORM') ORDER BY role_id) TO '$tempDir/legacy_tb_role.csv' WITH CSV HEADER",
    "\\copy (SELECT permission_id, tenant_id, permission_code, permission_nm, use_at, created_at FROM public.tb_permission WHERE tenant_id IN (SELECT tenant_id FROM public.tb_tenant WHERE tenant_code <> 'PLATFORM') ORDER BY permission_id) TO '$tempDir/legacy_tb_permission.csv' WITH CSV HEADER",
    "\\copy (SELECT login_account_role_id, login_id, role_id, created_at FROM public.tb_login_account_role WHERE login_id IN (SELECT login_id FROM public.tb_login_account WHERE tenant_id IN (SELECT tenant_id FROM public.tb_tenant WHERE tenant_code <> 'PLATFORM')) ORDER BY login_account_role_id) TO '$tempDir/legacy_tb_login_account_role.csv' WITH CSV HEADER",
    "\\copy (SELECT menu_id, parent_menu_id, menu_code, menu_nm, menu_dc, menu_url, icon_nm, menu_order, use_at, created_at, updated_at FROM public.tb_menu ORDER BY menu_id) TO '$tempDir/legacy_tb_menu.csv' WITH CSV HEADER",
    "\\copy (SELECT role_menu_permission_id, role_id, menu_id, permission_id, created_at FROM public.tb_role_menu_permission WHERE role_id IN (SELECT role_id FROM public.tb_role WHERE tenant_id IN (SELECT tenant_id FROM public.tb_tenant WHERE tenant_code <> 'PLATFORM')) ORDER BY role_menu_permission_id) TO '$tempDir/legacy_tb_role_menu_permission.csv' WITH CSV HEADER"
)

foreach ($sql in $exportQueries) {
    $table = $sql.Split(' ')[1] -replace '^\(', ''
    Write-Host "Exporting $table from $sourceDb..."
    & $psql -h $hostName -p $port -U $user -d $sourceDb -v ON_ERROR_STOP=1 -c $sql | Out-Null
}

$importTargets = @(
    @{ Name = 'tb_tenant'; File = '$tempDir/legacy_tb_tenant.csv'; Columns = 'tenant_id, tenant_code, tenant_nm, admin_email, logo_image, onboarding_status, use_at, created_at, updated_at, created_by' },
    @{ Name = 'tb_tenant_domain'; File = '$tempDir/legacy_tb_tenant_domain.csv'; Columns = 'tenant_domain_id, tenant_id, email_domain, is_primary, use_at, created_at, updated_at' },
    @{ Name = 'tb_login_account'; File = '$tempDir/legacy_tb_login_account.csv'; Columns = 'login_id, tenant_id, login_code, password_hash, profile_image, stamp_image, login_attempt_count, locked_at, password_changed_at, use_at, created_at, updated_at' },
    @{ Name = 'tb_role'; File = '$tempDir/legacy_tb_role.csv'; Columns = 'role_id, tenant_id, role_code, role_nm, use_at, is_system_role, created_at, updated_at' },
    @{ Name = 'tb_permission'; File = '$tempDir/legacy_tb_permission.csv'; Columns = 'permission_id, tenant_id, permission_code, permission_nm, use_at, created_at' },
    @{ Name = 'tb_login_account_role'; File = '$tempDir/legacy_tb_login_account_role.csv'; Columns = 'login_account_role_id, login_id, role_id, created_at' },
    @{ Name = 'tb_menu'; File = '$tempDir/legacy_tb_menu.csv'; Columns = 'menu_id, parent_menu_id, menu_code, menu_nm, menu_dc, menu_url, icon_nm, menu_order, use_at, created_at, updated_at' },
    @{ Name = 'tb_role_menu_permission'; File = '$tempDir/legacy_tb_role_menu_permission.csv'; Columns = 'role_menu_permission_id, role_id, menu_id, permission_id, created_at' }
)

foreach ($target in $importTargets) {
    $file = $target.File
    $path = $ExecutionContext.InvokeCommand.ExpandString($file)
    if (-not (Test-Path $path)) {
        Write-Host "Skipping $($target.Name) because file not found: $path"
        continue
    }

    Write-Host "Importing $($target.Name) into $targetDb..."
    & $psql -h $hostName -p $port -U $user -d $targetDb -v ON_ERROR_STOP=1 -c "\\copy public.$($target.Name) ($($target.Columns)) FROM '$path' WITH CSV HEADER" | Out-Null
}

Write-Host '--- verification ---'
& $psql -h $hostName -p $port -U $user -d $targetDb -Atqc "SELECT 'tenant=' || count(*) FROM public.tb_tenant; SELECT 'tenant_domain=' || count(*) FROM public.tb_tenant_domain; SELECT 'login_account=' || count(*) FROM public.tb_login_account; SELECT 'role=' || count(*) FROM public.tb_role; SELECT 'permission=' || count(*) FROM public.tb_permission; SELECT 'login_account_role=' || count(*) FROM public.tb_login_account_role; SELECT 'role_menu_permission=' || count(*) FROM public.tb_role_menu_permission; SELECT 'menu=' || count(*) FROM public.tb_menu; SELECT 'tenant_ids=' || string_agg(tenant_id::text, ', ' ORDER BY tenant_id) FROM public.tb_tenant;"