# PostgreSQL Local Start (Windows)

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
- DB 이름: `haccp_cloud`
- 스키마 파일: `login_postgresql_schema.sql`

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

## 5) 빠른 점검

- DB 점검: `haccp_departments`, `haccp_users`, `haccp_login_history` 테이블 존재
- 로그 점검: PostgreSQL Driver/URL 관련 예외 없음
- 기능 점검: 로그인 API 1건 호출 성공
