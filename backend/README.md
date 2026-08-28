# Platform Admin Backend

![java](https://img.shields.io/badge/java-007396?style=for-the-badge&logo=JAVA&logoColor=white)
![Spring_boot](https://img.shields.io/badge/Spring_Boot-F2F4F9?style=for-the-badge&logo=spring-boot)
![maven](https://img.shields.io/badge/Maven-C71A36?style=for-the-badge&logo=apache-maven&logoColor=white)
![swagger](https://img.shields.io/badge/swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)

플랫폼 관리자 초기화와 테넌트 분리를 위한 최소 백엔드만 유지한다. 공통코드, 스케줄러, 레거시 `haccp_`/`mes_` 호환 구조는 제외한다.

## 환경

| 프로그램 명 | 버전 명  |
| :---------- | :------- |
| java        | 1.8 이상 |
| maven       | 3.8.4    |

## 스키마 범위

현재 `backend/DATABASE/create_postgresql_schema_active_tables.sql` 기준으로 아래 활성 테이블만 유지한다.

- `tb_tenant` - 테넌트/업체
- `tb_tenant_domain` - 업체 이메일 도메인 매핑
- `tb_department` - 부서
- `tb_login_account` - 로그인 계정
- `tb_user` - 사용자
- `tb_role` - 역할
- `tb_login_account_role` - 계정-역할 매핑
- `tb_menu` - 메뉴
- `tb_permission` - 권한 작업
- `tb_role_menu_permission` - 역할-메뉴-권한 매핑
- `tb_login_history` - 로그인 이력
- `tb_schedulerconfig` - 스케줄러 설정

## 테넌트 DB 일괄 마이그레이션

테넌트마다 물리적으로 분리된 PostgreSQL DB(`tenant_<사업자번호>`)를 쓰기 때문에, 센트럴 스키마(`backend/DATABASE/create_postgresql_schema_active_tables.sql`)에 컬럼/테이블을 추가했으면 기존에 생성되어 있는 테넌트 DB에도 같은 변경을 적용하는 마이그레이션 스크립트를 별도로 작성해야 한다. 신규 테넌트는 가입 시 최신 스키마 파일을 그대로 적용받으므로 자동으로 반영된다.

1. `backend/DATABASE/migrate_postgresql_add_role_dc_column.sql`처럼 `ADD COLUMN IF NOT EXISTS` 형태의 멱등 마이그레이션 SQL을 작성한다.
2. `apply_migration_to_all_tenants.ps1`로 센트럴 DB(`tb_tenant_database` 레지스트리에 등록된) + 모든 테넌트 DB에 순서대로 적용한다.

```bash
cd backend/DATABASE
.\apply_migration_to_all_tenants.ps1 -MigrationFile .\migrate_postgresql_add_role_dc_column.sql
```

- `-PgBin`을 생략하면 PATH에 있는 `psql.exe`를 자동으로 찾는다.
- 센트럴에 이미 적용된 변경이면 `-SkipCentral`로 테넌트 DB만 대상으로 돌릴 수 있다 (멱등 SQL이면 안 붙여도 안전).
- 대상 DB 목록은 `tb_tenant_database.db_name` (use_at='Y') 기준이므로, 신규 테넌트가 늘어나도 스크립트 수정 없이 그대로 재사용 가능하다.

## 초기 로그인

플랫폼 초기 관리자 계정은 스키마 seed로 함께 생성한다.

- login id: `platform_admin`
- password seed: `Passw0rd!`
- role: `PLATFORM_ADMIN`

## 구동

### CLI

```bash
mvn spring-boot:run
```

### IDE

프로젝트 우클릭 후 Run As > Spring Boot App.

### Swagger

- Swagger UI: `http://localhost:포트번호/swagger-ui/index.html`
- GET 테스트는 JWT 없이 가능
- POST/PUT/DELETE 는 JWT 인증 필요
- 초기 로그인 후 받은 토큰으로 `Authorize`를 설정하면 된다.

## 관리 API

현재 플랫폼 관리자 화면 기준으로 남길 기능은 아래 4개다.

- 업체 등록 및 업체코드 부여
- 메뉴 등록
- 권한 등록
- 권한별 메뉴 등록

공통코드 화면은 이번 범위에서 제외한다.

## 실행

```bash
java -jar <jar파일명> --spring.profiles.active=<profile명>
```

## 운영 설정 분리 (권장)

운영 민감값(DB 계정/비밀번호, JWT, 암호화 키)은 깃에 커밋하지 않고 외부 파일에서 로딩한다.

1. 예시 파일 복사

```bash
cp backend/config/application-prod.properties.example backend/config/application-prod.properties
```

2. 실제 운영값 입력

- `backend/config/application-prod.properties`에 운영 DB/시크릿 값을 채운다.
- 이 파일은 `.gitignore`로 커밋 제외된다.

3. Tomcat에서 외부 파일 로딩

Windows `setenv.bat` 예시:

```bat
set "CATALINA_OPTS=%CATALINA_OPTS% -Dspring.profiles.active=prod"
set "CATALINA_OPTS=%CATALINA_OPTS% -Dspring.config.additional-location=file:/C:/haccp-cloud/config/"
```

위 경로에 `application-prod.properties`를 두면 WAR 내부 기본 설정을 외부 파일 값으로 덮어쓴다.
