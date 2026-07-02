# 백엔드 도메인 기반 폴더 구조 재구성 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 백엔드 Java 패키지 구조를 프론트엔드 도메인(`platform-admin/`, `organization/`, `documents/`)에 맞춰 재구성하고, 기존 기능은 유지하되 폴더/패키지명만 정렬

**Architecture:**

1. 새로운 도메인 폴더 생성 (`platform-admin/`, `organization/`, `documents/`)
2. 기존 Java 파일들을 새 패키지로 이동 및 패키지명 변경
3. MyBatis 매퍼 파일 경로/이름 정렬
4. import 문 및 의존성 업데이트
5. 컴파일/테스트 검증

**Tech Stack:** Java, Maven, MyBatis, Spring Framework

---

## 마이그레이션 매핑 상세

### Java 소스 경로 변경

| 이전 경로                    | 새 경로                             | 비고                                                                                       |
| ---------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------ |
| `let/platforms/tenants/`     | `let/platform-admin/tenants/`       | 패키지: `egovframework.let.platforms.tenants` → `egovframework.let.platform_admin.tenants` |
| `let/platforms/menus/`       | `let/platform-admin/menus/`         | 패키지명 변경                                                                              |
| `let/platforms/dashboard/`   | `let/platform-admin/dashboard/`     | 패키지명 변경 (필요시 나중에 제거)                                                         |
| `let/uat/loginhistory/`      | `let/platform-admin/login-history/` | 패키지명 변경                                                                              |
| `let/platforms/users/`       | `let/organization/users/`           | 패키지명 변경                                                                              |
| `let/platforms/departments/` | `let/organization/departments/`     | 패키지명 변경                                                                              |
| `let/platforms/roles/`       | `let/organization/authorities/`     | 패키지명 + 클래스명 변경 (PlatformRole → Authority)                                        |

### MyBatis 매퍼 리소스 경로 변경

| 이전 경로                                                   | 새 경로                                                            |
| ----------------------------------------------------------- | ------------------------------------------------------------------ |
| `resources/egovframework/mapper/let/platforms/tenants/`     | `resources/egovframework/mapper/let/platform_admin/tenants/`       |
| `resources/egovframework/mapper/let/platforms/menus/`       | `resources/egovframework/mapper/let/platform_admin/menus/`         |
| `resources/egovframework/mapper/let/uat/loginhistory/`      | `resources/egovframework/mapper/let/platform_admin/login-history/` |
| `resources/egovframework/mapper/let/platforms/users/`       | `resources/egovframework/mapper/let/organization/users/`           |
| `resources/egovframework/mapper/let/platforms/departments/` | `resources/egovframework/mapper/let/organization/departments/`     |
| `resources/egovframework/mapper/let/platforms/roles/`       | `resources/egovframework/mapper/let/organization/authorities/`     |

---

## Task 1: platform-admin/tenants 마이그레이션

**Files:**

- Move & Rename: `backend/src/main/java/egovframework/let/platforms/tenants/` → `backend/src/main/java/egovframework/let/platform_admin/tenants/`
- Move & Rename: `backend/src/main/resources/egovframework/mapper/let/platforms/tenants/` → `backend/src/main/resources/egovframework/mapper/let/platform_admin/tenants/`
- Test: `backend/src/test/java/egovframework/let/platform_admin/tenants/` (새로 생성)

### Step 1: platform-admin 도메인 폴더 생성

```bash
# 터미널에서 실행
mkdir -p backend/src/main/java/egovframework/let/platform_admin/tenants/{controller,domain/model,domain/repository,domain/repository/impl,service,service/impl,context}
mkdir -p backend/src/main/resources/egovframework/mapper/let/platform_admin/tenants
```

### Step 2: Java 파일 이동 (tenants controller)

현재 파일 위치:

- `backend/src/main/java/egovframework/let/platforms/tenants/controller/PlatformTenantApiController.java`
- `backend/src/main/java/egovframework/let/platforms/tenants/controller/TenantOnboardingController.java`

새 위치:

- `backend/src/main/java/egovframework/let/platform_admin/tenants/controller/PlatformTenantApiController.java`
- `backend/src/main/java/egovframework/let/platform_admin/tenants/controller/TenantOnboardingController.java`

파일 이동 후 파일 내 패키지 선언 변경:

```java
// 이전
package egovframework.let.platforms.tenants.controller;

// 새로운
package egovframework.let.platform_admin.tenants.controller;
```

- [ ] **Step 2-1: tenants/controller 폴더 생성 및 파일 이동**

```bash
mkdir -p backend/src/main/java/egovframework/let/platform_admin/tenants/controller
mv backend/src/main/java/egovframework/let/platforms/tenants/controller/*.java \
   backend/src/main/java/egovframework/let/platform_admin/tenants/controller/
```

- [ ] **Step 2-2: PlatformTenantApiController.java 패키지명 변경**

파일: `backend/src/main/java/egovframework/let/platform_admin/tenants/controller/PlatformTenantApiController.java`

```java
// 이전
package egovframework.let.platforms.tenants.controller;

// 새로운
package egovframework.let.platform_admin.tenants.controller;
```

- [ ] **Step 2-3: TenantOnboardingController.java 패키지명 변경**

파일: `backend/src/main/java/egovframework/let/platform_admin/tenants/controller/TenantOnboardingController.java`

```java
// 이전
package egovframework.let.platforms.tenants.controller;

// 새로운
package egovframework.let.platform_admin.tenants.controller;
```

### Step 3: Java 파일 이동 (tenants domain/model)

- [ ] **Step 3-1: domain/model 폴더 이동**

```bash
mkdir -p backend/src/main/java/egovframework/let/platform_admin/tenants/domain/model
mv backend/src/main/java/egovframework/let/platforms/tenants/domain/model/*.java \
   backend/src/main/java/egovframework/let/platform_admin/tenants/domain/model/
```

- [ ] **Step 3-2: 모든 domain/model 파일의 패키지명 변경**

영향받는 파일들:

- `TenantVO.java`
- `TenantAuthTokenVO.java`
- `TenantIssueCodeRequestVO.java`
- `TenantIssueCodeResponseVO.java`
- `TenantOnboardingCompleteRequestVO.java`
- `TenantRegistrationRequestVO.java`
- `TenantRegistrationResultVO.java`
- `TenantVerificationResponseVO.java`
- `PlatformTenantDashboardItemVO.java`
- `PlatformTenantDashboardQueryVO.java`
- `PlatformTenantDashboardResultVO.java`
- `PlatformTenantDashboardSummaryVO.java`
- `SampleTenantVO.java`

각 파일에서:

```java
// 이전
package egovframework.let.platforms.tenants.domain.model;

// 새로운
package egovframework.let.platform_admin.tenants.domain.model;
```

### Step 4: Java 파일 이동 (tenants domain/repository)

- [ ] **Step 4-1: domain/repository 폴더 이동**

```bash
mkdir -p backend/src/main/java/egovframework/let/platform_admin/tenants/domain/repository
mkdir -p backend/src/main/java/egovframework/let/platform_admin/tenants/domain/repository/impl
mv backend/src/main/java/egovframework/let/platforms/tenants/domain/repository/*.java \
   backend/src/main/java/egovframework/let/platform_admin/tenants/domain/repository/
mv backend/src/main/java/egovframework/let/platforms/tenants/domain/repository/impl/*.java \
   backend/src/main/java/egovframework/let/platform_admin/tenants/domain/repository/impl/ 2>/dev/null || true
```

- [ ] **Step 4-2: domain/repository 파일 패키지명 변경**

영향받는 파일:

- `TenantInfoDAO.java`
- `TenantInfoJdbcDAO.java`
- `TenantAuthTokenDAO.java`
- `TenantAuthTokenJdbcDAO.java` (impl 폴더 내)

패키지 변경:

```java
// 이전
package egovframework.let.platforms.tenants.domain.repository;
// 또는
package egovframework.let.platforms.tenants.domain.repository.impl;

// 새로운
package egovframework.let.platform_admin.tenants.domain.repository;
// 또는
package egovframework.let.platform_admin.tenants.domain.repository.impl;
```

### Step 5: Java 파일 이동 (tenants service)

- [ ] **Step 5-1: service 폴더 이동**

```bash
mkdir -p backend/src/main/java/egovframework/let/platform_admin/tenants/service
mkdir -p backend/src/main/java/egovframework/let/platform_admin/tenants/service/impl
mv backend/src/main/java/egovframework/let/platforms/tenants/service/*.java \
   backend/src/main/java/egovframework/let/platform_admin/tenants/service/
mv backend/src/main/java/egovframework/let/platforms/tenants/service/impl/*.java \
   backend/src/main/java/egovframework/let/platform_admin/tenants/service/impl/ 2>/dev/null || true
```

- [ ] **Step 5-2: service 파일 패키지명 변경**

영향받는 파일:

- `PlatformTenantService.java`
- `TenantOnboardingService.java`
- `PlatformTenantServiceImpl.java` (impl)
- `TenantOnboardingServiceImpl.java` (impl)
- `TenantAuthTokenGenerator.java` (impl)
- `TenantCodeGenerator.java` (impl)

패키지 변경:

```java
// 이전
package egovframework.let.platforms.tenants.service;
// 또는
package egovframework.let.platforms.tenants.service.impl;

// 새로운
package egovframework.let.platform_admin.tenants.service;
// 또는
package egovframework.let.platform_admin.tenants.service.impl;
```

### Step 6: Java 파일 이동 (tenants context)

- [ ] **Step 6-1: context 폴더 이동**

```bash
mkdir -p backend/src/main/java/egovframework/let/platform_admin/tenants/context
mv backend/src/main/java/egovframework/let/platforms/tenants/context/*.java \
   backend/src/main/java/egovframework/let/platform_admin/tenants/context/
```

- [ ] **Step 6-2: context 파일 패키지명 변경**

영향받는 파일:

- `TenantContextFilter.java`
- `TenantContextHolder.java`

패키지 변경:

```java
// 이전
package egovframework.let.platforms.tenants.context;

// 새로운
package egovframework.let.platform_admin.tenants.context;
```

### Step 7: MyBatis 매퍼 파일 이동

- [ ] **Step 7-1: 매퍼 리소스 폴더 이동**

```bash
mkdir -p backend/src/main/resources/egovframework/mapper/let/platform_admin/tenants
mv backend/src/main/resources/egovframework/mapper/let/platforms/tenants/*.xml \
   backend/src/main/resources/egovframework/mapper/let/platform_admin/tenants/
```

### Step 8: tenants import 문 업데이트

이 단계에서는 tenants 파일 내에서 **다른 도메인**으로부터의 import를 확인해서 필요시 업데이트합니다. 예를 들어:

- 공통 패키지는 그대로 (`egovframework.com.*`)
- scheduler, utl 등도 그대로
- 다른 도메인 참조는 변경 필요

예시 (파일 내에서 찾아볼 것):

```java
// 변경 전
import egovframework.let.platforms.menus.service.PlatformMenuService;

// 변경 후
import egovframework.let.platform_admin.menus.service.MenuService;
```

- [ ] **Step 8-1: 모든 tenants Java 파일 grep으로 import 패턴 검색**

```bash
grep -r "import egovframework.let.platforms" backend/src/main/java/egovframework/let/platform_admin/tenants/
grep -r "import egovframework.let.uat" backend/src/main/java/egovframework/let/platform_admin/tenants/
grep -r "import egovframework.let.uss" backend/src/main/java/egovframework/let/platform_admin/tenants/
```

기타 도메인 import를 찾으면 다음 단계에서 수정

### Step 9: Spring 설정 파일에서 tenants 패키지 참조 업데이트

Spring XML 설정 파일들(예: `applicationContext.xml`, `servlet-context.xml` 등)에서 tenants 패키지 참조 확인:

- [ ] **Step 9-1: Spring XML 설정 파일에서 tenants 참조 검색**

```bash
grep -r "egovframework.let.platforms.tenants" backend/src/main/resources/
```

발견되면 다음과 같이 변경:

```xml
<!-- 이전 -->
<context:component-scan base-package="egovframework.let.platforms.tenants" />

<!-- 새로운 -->
<context:component-scan base-package="egovframework.let.platform_admin.tenants" />
```

### Step 10: pom.xml 또는 MyBatis 설정에서 리소스 경로 업데이트

- [ ] **Step 10-1: pom.xml에서 MyBatis 매퍼 경로 확인**

```bash
grep -A5 -B5 "platform.*tenant" backend/pom.xml
grep -A5 -B5 "mybatis-spring" backend/pom.xml
```

필요시 다음과 같이 업데이트:

```xml
<!-- 이전 -->
<Mapper.Package>egovframework.let.platforms.tenants</Mapper.Package>

<!-- 새로운 -->
<Mapper.Package>egovframework.let.platform_admin.tenants</Mapper.Package>
```

또는 MyBatis 설정 파일 (`ApplicationContext-mybatis.xml` 등)에서:

```xml
<!-- 이전 -->
<bean class="org.mybatis.spring.mapper.MapperScannerConfigurer">
    <property name="basePackage" value="egovframework.let.platforms.tenants" />
</bean>

<!-- 새로운 -->
<bean class="org.mybatis.spring.mapper.MapperScannerConfigurer">
    <property name="basePackage" value="egovframework.let.platform_admin.tenants" />
</bean>
```

### Step 11: 컴파일 및 검증

- [ ] **Step 11-1: Maven 클린 빌드**

```bash
cd backend
mvn clean compile
```

**Expected output:**

```
[INFO] BUILD SUCCESS
```

오류가 발생하면:

- import 문 누락 확인
- 패키지명 불일치 확인
- 클래스명 오타 확인

### Step 12: 기존 tenants 폴더 정리

- [ ] **Step 12-1: 이전 폴더 삭제**

```bash
rm -rf backend/src/main/java/egovframework/let/platforms/tenants
```

### Step 13: Git Commit

- [ ] **Step 13-1: 변경사항 커밋**

```bash
cd backend
git add -A
git commit -m "refactor: migrate tenants from let/platforms to let/platform_admin

- Move Java source: let/platforms/tenants -> let/platform_admin/tenants
- Update package declarations: egovframework.let.platforms.tenants -> egovframework.let.platform_admin.tenants
- Move MyBatis resources: mapper/let/platforms/tenants -> mapper/let/platform_admin/tenants
- Update Spring configuration references
- Verify build with mvn clean compile"
```

---

## Task 2: platform-admin/menus 마이그레이션

**Files:**

- Move & Rename: `backend/src/main/java/egovframework/let/platforms/menus/` → `backend/src/main/java/egovframework/let/platform_admin/menus/`
- Move & Rename: `backend/src/main/resources/egovframework/mapper/let/platforms/menus/` → `backend/src/main/resources/egovframework/mapper/let/platform_admin/menus/`

(동일한 패턴으로 진행: Step 1~13을 반복)

- [ ] **Step 1: 폴더 생성**

```bash
mkdir -p backend/src/main/java/egovframework/let/platform_admin/menus/{controller,domain/model,domain/repository,service,service/impl}
mkdir -p backend/src/main/resources/egovframework/mapper/let/platform_admin/menus
```

- [ ] **Step 2~12: 파일 이동 및 패키지명 변경**

(Task 1과 동일한 절차, menus 폴더에 적용)

영향받는 파일들:

- Controller: `PlatformMenuApiController.java`
- Model: `PlatformMenuModelVO.java`, `PlatformMenuSearchConditionVO.java`
- Repository: `PlatformMenuDAO.java`, `PlatformMenuEgovDAO.java`
- Service: `PlatformMenuService.java`
- ServiceImpl: `PlatformMenuServiceImpl.java`
- Mapper: `PlatformMenuMapper_SQL_postgresql.xml`

- [ ] **Step 13: Git Commit**

```bash
cd backend
git add -A
git commit -m "refactor: migrate menus from let/platforms to let/platform_admin

- Move Java source: let/platforms/menus -> let/platform_admin/menus
- Update package: egovframework.let.platforms.menus -> egovframework.let.platform_admin.menus
- Move MyBatis mapper resources"
```

---

## Task 3: platform-admin/login-history 마이그레이션

**Files:**

- Move & Rename: `backend/src/main/java/egovframework/let/uat/loginhistory/` → `backend/src/main/java/egovframework/let/platform_admin/login-history/` (폴더명에서 하이픈 추가)
- Move & Rename: `backend/src/main/resources/egovframework/mapper/let/uat/loginhistory/` → `backend/src/main/resources/egovframework/mapper/let/platform_admin/login-history/`
- Update package: `egovframework.let.uat.loginhistory` → `egovframework.let.platform_admin.loginhistory` (패키지명은 하이픈 없음)

- [ ] **Step 1: 폴더 생성**

```bash
mkdir -p "backend/src/main/java/egovframework/let/platform_admin/login-history/{controller,domain/model,domain/repository,service,service/impl}"
mkdir -p "backend/src/main/resources/egovframework/mapper/let/platform_admin/login-history"
```

- [ ] **Step 2~12: 파일 이동 및 패키지명 변경**

(동일한 절차)

영향받는 파일들:

- Controller: `LoginHistoryApiController.java`
- Model: `LoginHistory.java`, `LoginHistoryVO.java`
- Repository: `LoginHistoryDAO.java`
- Service: `LoginHistoryService.java`, `LoginHistoryGovInterfaceService.java`
- ServiceImpl: `LoginHistoryServiceImpl.java`, `LoginHistoryGovInterfaceServiceImpl.java`, `GovLogResponseCodeEvaluator.java`
- Mapper: `LoginHistoryMapper_SQL_postgresql.xml`

패키지명 변경:

```java
// 이전
package egovframework.let.uat.loginhistory;

// 새로운
package egovframework.let.platform_admin.loginhistory;
```

- [ ] **Step 13: Git Commit**

```bash
cd backend
git commit -m "refactor: migrate login-history from let/uat to let/platform_admin

- Move Java source: let/uat/loginhistory -> let/platform_admin/login-history
- Update package: egovframework.let.uat.loginhistory -> egovframework.let.platform_admin.loginhistory
- Move MyBatis resources"
```

---

## Task 4: organization/departments 마이그레이션

**Files:**

- Move: `backend/src/main/java/egovframework/let/platforms/departments/` → `backend/src/main/java/egovframework/let/organization/departments/`
- Move: `backend/src/main/resources/egovframework/mapper/let/platforms/departments/` → `backend/src/main/resources/egovframework/mapper/let/organization/departments/`

패키지명: `egovframework.let.platforms.departments` → `egovframework.let.organization.departments`

- [ ] **Step 1: 폴더 생성**

```bash
mkdir -p backend/src/main/java/egovframework/let/organization/departments/{controller,domain/model,domain/repository,service,service/impl}
mkdir -p backend/src/main/resources/egovframework/mapper/let/organization/departments
```

- [ ] **Step 2~13: 파일 이동, 패키지명 변경, 커밋**

(동일한 절차, 패키지명만 변경)

---

## Task 5: organization/users 마이그레이션

**Files:**

- Move: `backend/src/main/java/egovframework/let/platforms/users/` → `backend/src/main/java/egovframework/let/organization/users/`
- Move: `backend/src/main/resources/egovframework/mapper/let/platforms/users/` → `backend/src/main/resources/egovframework/mapper/let/organization/users/`

패키지명: `egovframework.let.platforms.users` → `egovframework.let.organization.users`

(Task 4와 동일한 절차)

---

## Task 6: organization/authorities 마이그레이션 (roles → authorities 이름 변경)

**Files:**

- Move & Rename: `backend/src/main/java/egovframework/let/platforms/roles/` → `backend/src/main/java/egovframework/let/organization/authorities/`
- Move & Rename: `backend/src/main/resources/egovframework/mapper/let/platforms/roles/` → `backend/src/main/resources/egovframework/mapper/let/organization/authorities/`

패키지명 변경: `egovframework.let.platforms.roles` → `egovframework.let.organization.authorities`

**클래스명 변경:**

- `PlatformRoleApiController.java` → `AuthorityApiController.java`
- `PlatformRoleService.java` → `AuthorityService.java`
- `PlatformRoleServiceImpl.java` → `AuthorityServiceImpl.java`
- `PlatformRoleDAO.java` → `AuthorityDAO.java`
- `PlatformRoleEgovDAO.java` → `AuthorityEgovDAO.java`
- `PlatformRoleModelVO.java` → `AuthorityModelVO.java`
- `PlatformRoleMenuSaveRequestVO.java` → `AuthorityMenuSaveRequestVO.java`
- `PlatformRoleSearchConditionVO.java` → `AuthoritySearchConditionVO.java`
- Mapper: `PlatformRoleMapper_SQL_postgresql.xml` → `AuthorityMapper_SQL_postgresql.xml`

- [ ] **Step 1: 폴더 생성**

```bash
mkdir -p backend/src/main/java/egovframework/let/organization/authorities/{controller,domain/model,domain/repository,service,service/impl}
mkdir -p backend/src/main/resources/egovframework/mapper/let/organization/authorities
```

- [ ] **Step 2: 파일 이동 및 클래스명 변경 (controller)**

```bash
mkdir -p backend/src/main/java/egovframework/let/organization/authorities/controller
mv backend/src/main/java/egovframework/let/platforms/roles/controller/PlatformRoleApiController.java \
   backend/src/main/java/egovframework/let/organization/authorities/controller/AuthorityApiController.java
```

파일 내용 변경:

```java
// PlatformRoleApiController.java → AuthorityApiController.java
public class AuthorityApiController {
    // ... 기존 코드
}

package egovframework.let.organization.authorities.controller;
```

- [ ] **Step 3~12: 나머지 파일 이동 및 클래스명 변경**

(동일한 절차로 service, domain, mapper 등 모두 변경)

- [ ] **Step 13: 이전 폴더 정리**

```bash
rm -rf backend/src/main/java/egovframework/let/platforms/roles
```

- [ ] **Step 14: Git Commit**

```bash
cd backend
git commit -m "refactor: migrate roles to organization/authorities with class rename

- Move Java source: let/platforms/roles -> let/organization/authorities
- Rename classes: PlatformRole* -> Authority*
- Update package: egovframework.let.platforms.roles -> egovframework.let.organization.authorities
- Move and rename MyBatis mapper"
```

---

## Task 7: 전체 import 문 및 의존성 업데이트

마이그레이션 완료 후 **다른 도메인에서 참조**하는 import 문들을 일괄 업데이트합니다.

- [ ] **Step 1: 변경된 패키지 참조 전체 검색**

```bash
grep -r "egovframework\.let\.platforms" backend/src/main/java/
grep -r "egovframework\.let\.uat\.loginhistory" backend/src/main/java/
grep -r "egovframework\.let\.platforms\.roles" backend/src/main/java/
```

- [ ] **Step 2: XML 설정 파일에서 패키지 참조 업데이트**

```bash
grep -r "egovframework.let.platforms" backend/src/main/resources/
```

발견된 항목들을 다음과 같이 변경:

```xml
<!-- 예시 1: tenants -->
<!-- 이전 -->
<context:component-scan base-package="egovframework.let.platforms.tenants" />
<!-- 새로운 -->
<context:component-scan base-package="egovframework.let.platform_admin.tenants" />

<!-- 예시 2: menus -->
<!-- 이전 -->
<context:component-scan base-package="egovframework.let.platforms.menus" />
<!-- 새로운 -->
<context:component-scan base-package="egovframework.let.platform_admin.menus" />

<!-- 예시 3: roles 마이그레이션 -->
<!-- 이전 -->
<context:component-scan base-package="egovframework.let.platforms.roles" />
<!-- 새로운 -->
<context:component-scan base-package="egovframework.let.organization.authorities" />
```

- [ ] **Step 3: Maven 빌드로 컴파일 오류 확인**

```bash
cd backend
mvn clean compile 2>&1 | grep -E "error|ERROR|\[ERROR\]" | head -20
```

오류가 있으면 해당 파일의 import 문을 찾아 수정

- [ ] **Step 4: 런타임 오류 확인을 위한 단위 테스트**

```bash
mvn test -Dtest="*Tenant*" -DfailIfNoTests=false
mvn test -Dtest="*Menu*" -DfailIfNoTests=false
mvn test -Dtest="*Authority*" -DfailIfNoTests=false
```

### Step 5: Git Commit

```bash
git add -A
git commit -m "refactor: update all package references after domain restructuring

- Update component-scan base packages in Spring XML
- Update import statements in Java files
- Update MyBatis mapper package declarations
- Verify compilation with mvn clean compile"
```

---

## Task 8: MyBatis 매퍼 Namespace 및 Mapper 인터페이스 확인

MyBatis XML 파일에서 namespace가 정확히 변경된 패키지를 가리키는지 확인합니다.

- [ ] **Step 1: 각 매퍼 XML 파일의 namespace 확인**

```bash
# 예시: tenants mapper
grep "namespace=" backend/src/main/resources/egovframework/mapper/let/platform_admin/tenants/PlatformTenantMapper_SQL_postgresql.xml
```

현재: `namespace="egovframework.let.platforms.tenants.domain.repository.TenantInfoDAO"`
변경: `namespace="egovframework.let.platform_admin.tenants.domain.repository.TenantInfoDAO"`

각 매퍼 파일에서 `<mapper namespace="...">` 를 확인하고 패키지명이 일치하는지 검증

- [ ] **Step 2: Maven 빌드 및 MyBatis 검증**

```bash
cd backend
mvn clean package -DskipTests
```

**Expected output:**

```
[INFO] BUILD SUCCESS
```

오류: `Mapper not found` 또는 `namespace mismatch` 에러가 있으면 namespace 재확인

- [ ] **Step 3: Git Commit**

```bash
git add -A
git commit -m "refactor: verify and fix MyBatis mapper namespaces

- Confirm all mapper namespace matches updated package names
- Verify compilation with mvn clean package
- No functional changes, structural alignment only"
```

---

## Task 9: 통합 테스트 및 최종 검증

마이그레이션 완료 후 전체 시스템이 정상 동작하는지 검증합니다.

- [ ] **Step 1: 전체 단위 테스트 실행**

```bash
cd backend
mvn test
```

**Expected output:**

```
[INFO] BUILD SUCCESS
[INFO] Tests run: XXX, Failures: 0, Errors: 0, Skipped: 0
```

실패 시:

- 패키지명 불일치 재확인
- import 문 누락 확인
- 클래스명 오타 확인

- [ ] **Step 2: 통합 빌드 (WAR 생성)**

```bash
cd backend
mvn clean package -DskipTests
```

생성된 WAR 파일 위치: `backend/target/haccp-cloud.war`

**Expected:**

- 빌드 성공
- WAR 파일 크기 > 100MB (정상적으로 리소스 포함)

- [ ] **Step 3: 폴더 구조 최종 확인**

```bash
# 새로운 폴더 구조 존재 확인
ls -la backend/src/main/java/egovframework/let/platform_admin/
ls -la backend/src/main/java/egovframework/let/organization/
ls -la backend/src/main/resources/egovframework/mapper/let/platform_admin/
ls -la backend/src/main/resources/egovframework/mapper/let/organization/
```

**Expected:**

```
platform_admin/:
  tenants/
  menus/
  login-history/
  [dashboard/ - 선택적]

organization/:
  departments/
  users/
  authorities/
```

- [ ] **Step 4: 이전 폴더 완전 정리 확인**

```bash
# 이전 폴더들이 완전히 삭제되었는지 확인
ls backend/src/main/java/egovframework/let/platforms/ 2>&1 | grep -E "No such file|cannot access"
ls backend/src/main/java/egovframework/let/uat/loginhistory 2>&1 | grep -E "No such file|cannot access"
```

- [ ] **Step 5: 최종 Git Commit**

```bash
cd backend
git add -A
git commit -m "refactor: complete backend domain restructuring

Summary of changes:
- Migrated platform-admin domain:
  * tenants (from let/platforms)
  * menus (from let/platforms)
  * login-history (from let/uat)

- Migrated organization domain:
  * departments (from let/platforms)
  * users (from let/platforms)
  * authorities (from let/platforms/roles, with class rename)

- All imports and references updated
- All tests passing
- WAR builds successfully
- Structure now matches frontend: platform-admin, organization, documents (future)"
```

- [ ] **Step 6: Git Log 확인**

```bash
git log --oneline -10
```

마이그레이션 관련 커밋 6개가 보여야 함

---

## 롤백 전략 (필요시)

만약 마이그레이션 중 문제가 발생하면:

```bash
# 이전 커밋으로 롤백
git reset --hard HEAD~6

# 또는 특정 커밋으로 롤백
git checkout <commit-hash>

# 또는 새 브랜치에서 시작
git checkout -b retry-migration
```

---

## 검증 체크리스트

마이그레이션 완료 후 최종 확인:

- [ ] `mvn clean compile` 성공
- [ ] `mvn clean package -DskipTests` 성공
- [ ] `mvn test` 모두 통과
- [ ] 프론트/백엔드 도메인명 일치 확인
- [ ] Spring 의존성 주입 정상 작동 확인
- [ ] API 엔드포인트 접근 가능 확인 (필요시 실행 후 테스트)
- [ ] 이전 폴더 완전 삭제 확인
- [ ] 모든 변경사항 커밋 완료

---

## 다음 단계

마이그레이션 완료 후:

1. 메인 브랜치로 병합 (또는 PR 생성)
2. 스테이징 환경 배포
3. 통합 테스트 및 검증
4. 프로덕션 배포
