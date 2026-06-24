param(
    [string]$PgBin = "C:\Program Files\PostgreSQL\18\bin",
    [string]$DbHost = "localhost",
    [int]$Port = 5432,
    [string]$User = "postgres",
    [string]$Database = "haccp_cloud",
    [switch]$Force
)

$psql = Join-Path $PgBin "psql.exe"

if (-not (Test-Path $psql)) {
    throw "psql.exe not found at: $psql"
}

$securePassword = Read-Host "PostgreSQL password for user '$User'" -AsSecureString
$passwordBstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)

try {
    $plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordBstr)
    $env:PGPASSWORD = $plainPassword

    # Legacy 테이블 목록 (제거 대상)
    $legacyTables = @(
        "tb_factoryinfo",
        "tb_departmentinfo",
        "tb_userinfo",
        "tb_authorityinfo",
        "tb_logininfo",
        "tb_menu_info",
        "tb_permission_type",
        "tb_loginhistory"
    )

    Write-Host "다음 레거시 테이블을 제거합니다:"
    $legacyTables | ForEach-Object { Write-Host " - $_" }

    if (-not $Force) {
        $confirm = Read-Host "Type YES to proceed with deletion"
        if ($confirm -ne "YES") {
            throw "Deletion cancelled by user."
        }
    }

    # 모든 테이블 삭제 (CASCADE로 안전하게)
    $dropStatements = ($legacyTables | ForEach-Object { "DROP TABLE IF EXISTS public.$_ CASCADE;" }) -join "`n"
    $dropSql = "BEGIN;`n$dropStatements`nCOMMIT;"

    Write-Host "실행 중..."
    & $psql -h $DbHost -p $Port -U $User -d $Database -v ON_ERROR_STOP=1 -c $dropSql
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to drop legacy tables."
    }

    Write-Host "레거시 테이블 삭제 완료."

    # 검증: 남아있는 테이블 확인
    Write-Host "`n검증 중..."
    $checkQuery = "SELECT COUNT(*) as legacy_count FROM pg_tables WHERE schemaname='public' AND tablename IN ('tb_factoryinfo','tb_departmentinfo','tb_userinfo','tb_authorityinfo','tb_logininfo','tb_menu_info','tb_permission_type','tb_loginhistory');"
    $result = & $psql -h $DbHost -p $Port -U $User -d $Database -tA -c $checkQuery
    
    if ($result -eq "0") {
        Write-Host "✓ 모든 레거시 테이블이 제거되었습니다."
    } else {
        Write-Host "✗ 경고: $result개의 레거시 테이블이 남아 있습니다."
    }

    # 현재 활성 테이블 목록 표시
    Write-Host "`n현재 활성 테이블:"
    $tableList = & $psql -h $DbHost -p $Port -U $User -d $Database -tA -c "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;"
    $tableList | ForEach-Object { if ($_ -ne "") { Write-Host " - $_" } }
}
finally {
    if ($passwordBstr -ne [IntPtr]::Zero) {
        [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordBstr)
    }
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}
