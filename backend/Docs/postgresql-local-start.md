# PostgreSQL Local Start (Windows)

플랫폼 관리자 기준의 PostgreSQL 초기화 문서다. 현재 기준은 `backend/DATABASE/create_postgresql_schema_active_tables.sql` 이며, 활성 테이블만 생성한다.

## 1) 개발 프로필 DB 타입

아래 설정이 PostgreSQL인지 확인합니다.

- `backend/src/main/resources/application-dev.properties`
- `Globals.DbType=postgresql`

## 2) 로컬 DB 부트스트랩

PowerShell에서 아래 명령으로 DB 생성/스키마 적용을 실행합니다.

```powershell
Set-Location backend/DATABASE
.\bootstrap_postgresql.ps1
```

기본값:

- PostgreSQL bin 경로: `C:\Program Files\PostgreSQL\18\bin`
- DB 이름: 로컬 개발 DB
- 스키마 파일: `create_postgresql_schema_active_tables.sql`

설치 경로가 다르면 파라미터로 지정합니다.

```powershell
.\bootstrap_postgresql.ps1 -PgBin "C:\Program Files\PostgreSQL\17\bin"
```

## 3) 애플리케이션 접속 정보 확인

`backend/src/main/resources/application-dev.properties`의 아래 값을 로컬 DB와 일치시킵니다.

- `Globals.postgresql.Url`
- `Globals.postgresql.UserName`
- `Globals.postgresql.Password`

## 4) 백엔드 실행

Maven이 PATH에 잡혀 있으면 아래로 실행합니다.

```powershell
Set-Location backend
mvn -Pdev spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=dev"
```

Maven PATH가 없으면 Maven 설치 경로의 `bin`을 PATH에 추가한 뒤 재실행합니다.

## 5) 최소 seed 적용

초기 운영에 필요한 플랫폼 관리자 seed를 적용하려면 아래를 실행합니다.

```powershell
Set-Location backend/DATABASE
.\seed_postgresql_minimal_platform_admin.ps1
```

기본 seed 포함 내용:

- 테넌트: `PLATFORM` / `에프원소프트` / `socra710@f1soft.co.kr`
- 플랫폼 관리자 계정: `socra710 / Passw0rd!`
- 권한: `PLATFORM_ADMIN`, `TENANT_ADMIN`, `TENANT_USER`
- 메뉴: 메뉴 관리, 권한 관리, 업체 관리, 로그인 이력 관리
- 매핑: `PLATFORM_ADMIN` 역할에 위 메뉴 + `PERM_READ`, `PERM_WRITE` 권한 부여

## 6) 빠른 점검

- DB 점검: `tb_tenant`, `tb_tenant_domain`, `tb_department`, `tb_login_account`, `tb_user`, `tb_role`, `tb_login_account_role`, `tb_menu`, `tb_permission`, `tb_role_menu_permission`, `tb_login_history` 테이블 존재
- 초기 로그인 점검: `platform_admin / Passw0rd!` 로 로그인 가능
- 로그 점검: PostgreSQL Driver/URL 관련 예외 없음
- 기능 점검: 로그인 API 1건 호출 성공
