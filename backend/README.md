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

현재 `backend/DATABASE/login_postgresql_schema.sql` 은 아래 테이블만 남기는 것을 기준으로 한다.

- `tb_factoryinfo` - 업체/테넌트 마스터
- `tb_logininfo` - 로그인 계정 및 초기 관리자 로그인
- `tb_authorityinfo` - 로그인 권한 3종
- `tb_departmentinfo` - 부서
- `tb_userinfo` - 사용자
- `tb_login_history` - 로그인 이력
- `tb_permission_type` - 메뉴 권한 타입
- `tb_menu_info` - 메뉴 트리
- `tb_role_menu_permission` - 권한별 메뉴 매핑

## 초기 로그인

플랫폼 초기 관리자 계정은 스키마 seed로 함께 생성한다.

- login id: `platform_admin`
- password seed: `Passw0rd!`
- authority: `PLATFORM_ADMIN`

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
