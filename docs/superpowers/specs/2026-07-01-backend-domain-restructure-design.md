# 백엔드 폴더 구조 재설계 (도메인 기반 정렬)

**Date:** 2026-07-01  
**Status:** Approved  
**Owner:** haccp-cloud team

---

## 목표

백엔드 Java 패키지 구조를 프론트엔드 페이지 구조에 맞춰 **도메인 기반**으로 재구성하여:

- 프론트/백엔드 간 도메인 명칭 일치
- 팀 소통 효율 향상
- 기능별 응집도 증가
- 새로운 기능 추가 시 패턴 명확화

---

## 현재 상태 분석

### 프론트엔드 구조 (기준)

```
pages/
├── platform-admin/
│   ├── tenants/
│   ├── menus/
│   ├── plans/
│   └── login-history/
├── organization/
│   ├── departments/
│   ├── users/
│   └── authorities/
└── documents/
    └── [향후 추가]
```

### 백엔드 현재 구조 (문제점)

```
let/
├── main/               # 모든 도메인이 혼재
│   ├── tenants/
│   ├── menus/
│   ├── users/
│   ├── departments/
│   ├── roles/
│   └── ...
├── uat/               # 기술명 기반
│   └── loginhistory/
├── uss/               # 기술명 기반
│   └── auth/
└── platforms/         # 불명확한 위치
```

**문제:**

- 도메인과 기술명이 섞여 있음
- 프론트/백엔드 도메인 명칭 불일치
- 새로운 기능 추가 시 어느 폴더에 넣을지 모호함

---

## 설계: 새로운 백엔드 구조

### 패키지 계층

```
backend/src/main/java/egovframework/let/

├── com/                              # 공통 패키지 (기존 유지)
│   ├── cmm/                          # 공통 유틸, 핸들러, VO
│   ├── config/                       # Bean, DataSource, Transaction 설정
│   ├── jwt/                          # JWT 토큰 처리
│   └── security/                     # Spring Security 설정
│
├── platform-admin/                   # 플랫폼 관리 도메인
│   ├── tenants/                      # 테넌트 관리
│   │   ├── TenantController.java
│   │   ├── domain/
│   │   │   └── TenantVO.java
│   │   ├── service/
│   │   │   └── TenantService.java
│   │   ├── mapper/
│   │   │   ├── TenantMapper.java
│   │   │   └── TenantMapper_SQL_postgresql.xml
│   │   └── TenantDto.java
│   │
│   ├── menus/                        # 메뉴 관리
│   │   ├── MenuController.java
│   │   ├── domain/
│   │   │   └── MenuVO.java
│   │   ├── service/
│   │   │   └── MenuService.java
│   │   ├── mapper/
│   │   │   ├── MenuMapper.java
│   │   │   └── MenuMapper_SQL_postgresql.xml
│   │   └── MenuDto.java
│   │
│   ├── plans/                        # 요금제/플랜 관리
│   │   ├── PlanController.java
│   │   ├── domain/
│   │   │   └── PlanVO.java
│   │   ├── service/
│   │   │   └── PlanService.java
│   │   ├── mapper/
│   │   │   ├── PlanMapper.java
│   │   │   └── PlanMapper_SQL_postgresql.xml
│   │   └── PlanDto.java
│   │
│   └── login-history/                # 로그인 이력
│       ├── LoginHistoryController.java
│       ├── domain/
│       │   └── LoginHistoryVO.java
│       ├── service/
│       │   └── LoginHistoryService.java
│       ├── mapper/
│       │   ├── LoginHistoryMapper.java
│       │   └── LoginHistoryMapper_SQL_postgresql.xml
│       └── LoginHistoryDto.java
│
├── organization/                     # 조직 관리 도메인
│   ├── departments/                  # 부서 관리
│   │   ├── DepartmentController.java
│   │   ├── domain/
│   │   │   └── DepartmentVO.java
│   │   ├── service/
│   │   │   └── DepartmentService.java
│   │   ├── mapper/
│   │   │   ├── DepartmentMapper.java
│   │   │   └── DepartmentMapper_SQL_postgresql.xml
│   │   └── DepartmentDto.java
│   │
│   ├── users/                        # 사용자 관리
│   │   ├── UserController.java
│   │   ├── domain/
│   │   │   └── UserVO.java
│   │   ├── service/
│   │   │   └── UserService.java
│   │   ├── mapper/
│   │   │   ├── UserMapper.java
│   │   │   └── UserMapper_SQL_postgresql.xml
│   │   └── UserDto.java
│   │
│   └── authorities/                  # 권한/역할 관리
│       ├── AuthorityController.java
│       ├── domain/
│       │   └── AuthorityVO.java
│       ├── service/
│       │   └── AuthorityService.java
│       ├── mapper/
│       │   ├── AuthorityMapper.java
│       │   └── AuthorityMapper_SQL_postgresql.xml
│       └── AuthorityDto.java
│
├── documents/                        # 문서 관리 도메인 (향후 확장)
│   └── [프론트에 페이지 추가 시 같은 패턴으로 생성]
│
├── scheduler/                        # 기술별 유틸 (기존 유지)
├── utl/                              # 유틸리티 (기존 유지)
└── common/                           # 기존 공통 도메인 로직 (기존 유지)
```

### 각 도메인 패키지 상세

**페이지별 표준 구조 (반복되는 패턴):**

```
domain-name/
├── {Domain}Controller.java          # REST API 엔드포인트
├── domain/
│   └── {Domain}VO.java              # 데이터 객체 (DB 매핑)
├── service/
│   └── {Domain}Service.java         # 비즈니스 로직
├── mapper/
│   ├── {Domain}Mapper.java          # MyBatis Mapper 인터페이스
│   └── {Domain}Mapper_SQL_postgresql.xml  # SQL 정의
└── {Domain}Dto.java                 # DTO (요청/응답 용)
```

**예시 (Tenant):**

```
platform-admin/tenants/
├── TenantController.java
├── domain/TenantVO.java
├── service/TenantService.java
├── mapper/
│   ├── TenantMapper.java
│   └── TenantMapper_SQL_postgresql.xml
└── TenantDto.java
```

---

## 마이그레이션 매핑

| 현재 위치               | 새 위치                             | 파일 예시                                                                                        |
| ----------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------ |
| `let/main/tenants/`     | `let/platform-admin/tenants/`       | `TenantController.java`                                                                          |
| `let/main/menus/`       | `let/platform-admin/menus/`         | `MenuController.java`, `PlatformMenuMapper_SQL_postgresql.xml` → `MenuMapper_SQL_postgresql.xml` |
| `let/main/departments/` | `let/organization/departments/`     | `DepartmentController.java`                                                                      |
| `let/main/users/`       | `let/organization/users/`           | `UserController.java`                                                                            |
| `let/main/roles/`       | `let/organization/authorities/`     | `RoleController.java` → `AuthorityController.java`                                               |
| `let/uat/loginhistory/` | `let/platform-admin/login-history/` | 통합 정리                                                                                        |
| `let/com/`, `com/`      | 그대로 유지                         | 공통 의존성 유지                                                                                 |

---

## 구현 범위

### Phase 1: 폴더/패키지 구조 재구성

- 각 도메인별 폴더 생성
- 기존 파일 이동 및 패키지명 변경

### Phase 2: 파일명 및 클래스명 일관성

- `XxxController.java`, `XxxService.java`, `XxxMapper.java`, `XxxVO.java`, `XxxDto.java` 명명 통일
- SQL 매퍼 파일명 통일 (`XxxMapper_SQL_postgresql.xml`)

### Phase 3: import 문 및 의존성 수정

- 변경된 패키지 경로에 따른 import 업데이트
- Maven/IDE 캐시 정리

### Phase 4: 테스트 및 검증

- 기존 기능 동작 확인 (회귀 테스트)
- 빌드 성공 확인

---

## 기대 효과

✅ **도메인 명칭 일치:** 프론트(`platform-admin/`) ↔ 백엔드(`platform-admin/`)  
✅ **응집도 향상:** 같은 도메인 모든 파일이 함께 위치  
✅ **패턴 명확화:** 새로운 페이지/기능 추가 시 위치 결정 명확  
✅ **소통 효율:** 팀원들이 "organization/users"로 바로 찾을 수 있음  
✅ **확장성:** `documents/` 도메인 추가 시 자동으로 같은 패턴 적용 가능

---

## 고려사항

### 1. 기존 테스트 코드

- 변경된 패키지/클래스명에 맞춰 테스트 import 업데이트 필요
- MockMvc, Repository 테스트 모두 포함

### 2. SQL Mapper 파일

- PostgreSQL SQL 파일 위치 변경 시 리소스 경로 재설정 필요
- `*Mapper_SQL_postgresql.xml` 명명 통일

### 3. 공통 의존성

- `com/cmm/` 등 공통 패키지는 모든 도메인에서 참조하므로 유지 필수
- 변경 없음 (backward compatible)

### 4. 점진적 마이그레이션 가능

- 한 번에 모든 도메인을 옮길 필요 없음
- `platform-admin/tenants/` → `organization/users/` → ... 순서로 진행 가능
- 각 단계마다 테스트 및 배포 가능

---

## 다음 단계

1. **구현 계획 수립** - 각 도메인별 마이그레이션 순서 및 일정
2. **개발 시작** - 폴더 구조 재구성 및 패키지명 변경
3. **테스트 및 검증** - 기존 기능 동작 확인
4. **배포** - 변경사항 메인 브랜치 병합
