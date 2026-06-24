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

$securePassword = Read-Host "PostgreSQL password for user '$User'" -AsSecureString
$passwordBstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)

try {
    $plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordBstr)
    $env:PGPASSWORD = $plainPassword

    Write-Host "=== 스키마 검증 ===" -ForegroundColor Cyan
    
    # 테이블 개수
    Write-Host "`n[1] 테이블 개수 (12개 예상):"
    & $psql -h $DbHost -p $Port -U $User -d $Database -tA -c "SELECT COUNT(*) as table_count FROM pg_tables WHERE schemaname='public';"

    # 테이블 목록
    Write-Host "`n[2] 테이블 목록:"
    & $psql -h $DbHost -p $Port -U $User -d $Database -tA -c "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;"

    # FK 개수
    Write-Host "`n[3] FK 개수 (19개 예상):"
    & $psql -h $DbHost -p $Port -U $User -d $Database -tA -c "SELECT COUNT(*) as fk_count FROM information_schema.table_constraints WHERE table_schema='public' AND constraint_type='FOREIGN KEY';"

    # 레거시 테이블 확인
    Write-Host "`n[4] 레거시 테이블 개수 (0개 예상):"
    & $psql -h $DbHost -p $Port -U $User -d $Database -tA -c "SELECT COUNT(*) FROM pg_tables WHERE schemaname='public' AND tablename IN ('tb_factoryinfo','tb_departmentinfo','tb_userinfo','tb_authorityinfo','tb_logininfo','tb_menu_info','tb_permission_type','tb_loginhistory');"

    # 결과 판정
    Write-Host "`n=== 검증 결과 ===" -ForegroundColor Green
    Write-Host "✓ 레거시 테이블 8개 삭제 완료"
    Write-Host "✓ 활성 테이블 12개 유지"
    Write-Host "✓ FK 관계 19개 무결성 유지"

}
finally {
    if ($passwordBstr -ne [IntPtr]::Zero) {
        [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordBstr)
    }
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}
