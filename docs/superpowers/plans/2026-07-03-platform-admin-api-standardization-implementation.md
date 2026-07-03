# Platform Admin API Standardization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Standardize platform_admin backend APIs to a single URI/versioning, HTTP method contract, and ResultVO-only response envelope.

**Architecture:** Keep existing domain services and repository layers intact, and normalize at controller boundary first. Apply endpoint/path/response changes in domain batches (menus -> tenants -> dashboard/login-history/access), then lock behavior with controller/service regression tests and OpenAPI sync.

**Tech Stack:** Java 8, Spring MVC (eGovFrame), MyBatis, JUnit 5, Mockito, MockMvc, Maven.

---

### Task 1: Menus API 표준화 (/api/v1 + ResultVO + PUT/PATCH 정리)

**Files:**

- Modify: `backend/src/main/java/egovframework/let/platform_admin/menus/controller/PlatformMenuApiController.java`
- Modify: `backend/src/main/java/egovframework/let/platform_admin/menus/service/PlatformMenuService.java`
- Modify: `backend/src/main/java/egovframework/let/platform_admin/menus/service/impl/PlatformMenuServiceImpl.java`
- Create: `backend/src/test/java/egovframework/let/platform_admin/menus/controller/PlatformMenuApiControllerTest.java`

- [ ] **Step 1: 메뉴 API 경로/반환 계약 실패 테스트 작성**

```java
// backend/src/test/java/egovframework/let/platform_admin/menus/controller/PlatformMenuApiControllerTest.java
@WebMvcTest(controllers = PlatformMenuApiController.class)
class PlatformMenuApiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean(name = "platformMenuService")
    private PlatformMenuService platformMenuService;

    @MockBean(name = "resultVoHelper")
    private ResultVoHelper resultVoHelper;

    @Test
    void listMenus_returnsResultVoEnvelope_onV1Path() throws Exception {
        ResultVO resultVO = new ResultVO();
        resultVO.setResultCode("200");
        resultVO.setResultMessage("SUCCESS");
        when(resultVoHelper.buildFromMap(anyMap(), any(ResponseCode.class))).thenReturn(resultVO);

        mockMvc.perform(get("/api/v1/platform-admin/menus"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.resultCode").value("200"));
    }
}
```

- [ ] **Step 2: 테스트 실행으로 실패 확인**

Run: `mvn "-Dtest=PlatformMenuApiControllerTest" test`
Expected: FAIL (기존 `/api/platform-admin/menus` 또는 List 반환으로 계약 불일치)

- [ ] **Step 3: 컨트롤러를 ResultVO-only로 최소 구현 변경**

```java
// PlatformMenuApiController.java (핵심 패턴)
@RestController
@RequestMapping("/api/v1/platform-admin/menus")
public class PlatformMenuApiController {

    @Resource(name = "resultVoHelper")
    private ResultVoHelper resultVoHelper;

    @GetMapping
    public ResultVO listMenus(
            @RequestParam(required = false) String menuNm,
            @RequestParam(required = false) Long parentMenuId) throws Exception {
        List<MenuInfoVO> menus = platformMenuService.listMenus(menuNm, parentMenuId);
        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("items", menus);
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    @PutMapping("/{menuId}")
    public ResultVO replaceMenu(@PathVariable Long menuId, @RequestBody MenuInfoVO menuInfoVO) throws Exception {
        MenuInfoVO updated = platformMenuService.updateMenu(menuId, menuInfoVO);
        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("menu", updated);
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    @PatchMapping("/{menuId}")
    public ResultVO patchMenu(@PathVariable Long menuId, @RequestBody MenuInfoVO menuInfoVO) throws Exception {
        MenuInfoVO patched = platformMenuService.patchMenu(menuId, menuInfoVO);
        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("menu", patched);
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }
}
```

- [ ] **Step 4: 테스트 재실행 및 통과 확인**

Run: `mvn "-Dtest=PlatformMenuApiControllerTest" test`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add backend/src/main/java/egovframework/let/platform_admin/menus/controller/PlatformMenuApiController.java backend/src/main/java/egovframework/let/platform_admin/menus/service/PlatformMenuService.java backend/src/main/java/egovframework/let/platform_admin/menus/service/impl/PlatformMenuServiceImpl.java backend/src/test/java/egovframework/let/platform_admin/menus/controller/PlatformMenuApiControllerTest.java
git commit -m "refactor: standardize platform-admin menus API to v1 and ResultVO"
```

### Task 2: Tenant API 경로/응답 통일

**Files:**

- Modify: `backend/src/main/java/egovframework/let/platform_admin/tenants/controller/PlatformTenantApiController.java`
- Modify: `backend/src/test/java/egovframework/let/platforms/tenants/controller/PlatformTenantApiControllerTest.java`

- [ ] **Step 1: Tenant API 표준 계약 테스트 추가**

```java
// PlatformTenantApiControllerTest.java
@Test
void issueTenantCode_returnsResultVo_onV1PlatformAdminPath() throws Exception {
    ResultVO resultVO = new ResultVO();
    resultVO.setResultCode("200");
    when(resultVoHelper.buildFromMap(anyMap(), any(ResponseCode.class))).thenReturn(resultVO);

    mockMvc.perform(post("/api/v1/platform-admin/tenants/issue-code")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"companyName\":\"F1\",\"adminEmail\":\"a@f1.com\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.resultCode").value("200"));
}
```

- [ ] **Step 2: 테스트 실행으로 실패 확인**

Run: `mvn "-Dtest=PlatformTenantApiControllerTest" test`
Expected: FAIL (기존 base path `/api` 및 Map/List 직접 반환 엔드포인트 존재)

- [ ] **Step 3: Tenant 컨트롤러 표준화 구현**

```java
// PlatformTenantApiController.java (핵심 패턴)
@RestController
@RequestMapping("/api/v1/platform-admin/tenants")
public class PlatformTenantApiController {

    @PostMapping
    public ResultVO registerTenant(@RequestBody TenantRegistrationRequestVO requestVO) {
        TenantRegistrationResultVO created = platformTenantService.registerTenant(requestVO);
        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("tenant", created);
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    @PostMapping("/issue-code")
    public ResultVO issueTenantCode(@RequestBody TenantIssueCodeRequestVO requestVO) {
        TenantRegistrationRequestVO serviceRequest = new TenantRegistrationRequestVO();
        serviceRequest.setTenantNm(requestVO.getCompanyName());
        serviceRequest.setAdminEmail(requestVO.getAdminEmail());
        serviceRequest.setAdminName(requestVO.getAdminName());
        TenantRegistrationResultVO created = platformTenantService.registerTenant(serviceRequest);
        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("tenantCode", created.getTenantCode());
        resultMap.put("companyName", created.getTenantNm());
        resultMap.put("adminEmail", created.getAdminEmail());
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    @GetMapping("/{tenantCode}")
    public ResultVO getTenantDetail(@PathVariable String tenantCode) {
        PlatformTenantDashboardItemVO tenant = platformTenantService.findDashboardTenantByCode(tenantCode);
        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("tenant", tenant);
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }
}
```

- [ ] **Step 4: 테스트 재실행 및 통과 확인**

Run: `mvn "-Dtest=PlatformTenantApiControllerTest" test`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add backend/src/main/java/egovframework/let/platform_admin/tenants/controller/PlatformTenantApiController.java backend/src/test/java/egovframework/let/platforms/tenants/controller/PlatformTenantApiControllerTest.java
git commit -m "refactor: normalize platform-admin tenants API paths and ResultVO responses"
```

### Task 3: Tenant Onboarding 컨트롤러 ResponseEntity 제거

**Files:**

- Modify: `backend/src/main/java/egovframework/let/platform_admin/tenants/controller/TenantOnboardingController.java`
- Modify: `backend/src/test/java/egovframework/let/platforms/tenants/controller/TenantOnboardingControllerTest.java`

- [ ] **Step 1: 온보딩 API ResultVO-only 테스트 작성**

```java
// TenantOnboardingControllerTest.java
@Test
void verifyEmail_returnsResultVo_onStandardizedPath() throws Exception {
    when(tenantOnboardingService.verifyEmailToken("token-1"))
        .thenReturn(new TenantVerificationResponseVO());

    mockMvc.perform(post("/api/v1/platform-admin/tenants/TENANT001/onboarding/verifications")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"authToken\":\"token-1\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.resultCode").exists())
        .andExpect(jsonPath("$.resultMessage").exists());
}
```

- [ ] **Step 2: 테스트 실행으로 실패 확인**

Run: `mvn "-Dtest=TenantOnboardingControllerTest" test`
Expected: FAIL (기존 `/api/v1/tenants/onboarding` + ResponseEntity<Map> 반환)

- [ ] **Step 3: 온보딩 엔드포인트/응답 통일 구현**

```java
// TenantOnboardingController.java (핵심 패턴)
@RestController
@RequestMapping("/api/v1/platform-admin/tenants")
public class TenantOnboardingController {

    @Resource(name = "resultVoHelper")
    private ResultVoHelper resultVoHelper;

    @PostMapping("/{tenantCode}/onboarding/verification-emails")
    public ResultVO dispatchVerificationEmail(@PathVariable String tenantCode) {
        tenantOnboardingService.dispatchVerificationEmail(tenantCode, null);
        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("tenantCode", tenantCode);
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    @PostMapping("/{tenantCode}/onboarding/verifications")
    public ResultVO verifyEmail(@PathVariable String tenantCode, @RequestBody Map<String, String> body) {
        String authToken = body.get("authToken");
        TenantVerificationResponseVO verified = tenantOnboardingService.verifyEmailToken(authToken);
        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("tenantCode", tenantCode);
        resultMap.put("verification", verified);
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    @PostMapping("/{tenantCode}/onboarding/completions")
    public ResultVO completeOnboarding(@PathVariable String tenantCode, @RequestBody TenantOnboardingCompleteRequestVO requestVO) {
        requestVO.setTenantCode(tenantCode);
        tenantOnboardingService.completeOnboarding(requestVO);
        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("tenantCode", tenantCode);
        resultMap.put("completed", true);
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }
}
```

- [ ] **Step 4: 테스트 재실행 및 통과 확인**

Run: `mvn "-Dtest=TenantOnboardingControllerTest" test`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add backend/src/main/java/egovframework/let/platform_admin/tenants/controller/TenantOnboardingController.java backend/src/test/java/egovframework/let/platforms/tenants/controller/TenantOnboardingControllerTest.java
git commit -m "refactor: migrate tenant onboarding endpoints to platform-admin v1 ResultVO contract"
```

### Task 4: Dashboard/LoginHistory/PlanAccess API 정렬

**Files:**

- Modify: `backend/src/main/java/egovframework/let/platform_admin/dashboard/controller/PlatformDashboardApiController.java`
- Modify: `backend/src/main/java/egovframework/let/platform_admin/loginhistory/controller/LoginHistoryApiController.java`
- Modify: `backend/src/main/java/egovframework/let/platform_admin/access/controller/PlanAccessApiController.java`
- Create: `backend/src/test/java/egovframework/let/platform_admin/dashboard/controller/PlatformDashboardApiControllerTest.java`
- Create: `backend/src/test/java/egovframework/let/platform_admin/loginhistory/controller/LoginHistoryApiControllerTest.java`
- Create: `backend/src/test/java/egovframework/let/platform_admin/access/controller/PlanAccessApiControllerTest.java`

- [ ] **Step 1: 3개 도메인 경로/응답 회귀 테스트 작성**

```java
// 예: PlatformDashboardApiControllerTest.java
@WebMvcTest(controllers = PlatformDashboardApiController.class)
class PlatformDashboardApiControllerTest {
    @Test
    void getKpis_usesV1Path_andResultVo() throws Exception {
        mockMvc.perform(get("/api/v1/platform-admin/dashboard/kpis"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.resultCode").exists());
    }
}
```

- [ ] **Step 2: 테스트 실행으로 실패 확인**

Run: `mvn "-Dtest=PlatformDashboardApiControllerTest,LoginHistoryApiControllerTest,PlanAccessApiControllerTest" test`
Expected: FAIL (일부 경로/응답 혼합)

- [ ] **Step 3: 컨트롤러 경로/응답 최소 변경 구현**

```java
// 공통 패턴
@RequestMapping("/api/v1/platform-admin/dashboard")
@RequestMapping("/api/v1/platform-admin/login-history")
@RequestMapping("/api/v1/platform-admin/plan-access")

// 반환 형태
Map<String, Object> resultMap = new HashMap<String, Object>();
resultMap.put("data", data);
return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
```

- [ ] **Step 4: 테스트 재실행 및 통과 확인**

Run: `mvn "-Dtest=PlatformDashboardApiControllerTest,LoginHistoryApiControllerTest,PlanAccessApiControllerTest" test`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add backend/src/main/java/egovframework/let/platform_admin/dashboard/controller/PlatformDashboardApiController.java backend/src/main/java/egovframework/let/platform_admin/loginhistory/controller/LoginHistoryApiController.java backend/src/main/java/egovframework/let/platform_admin/access/controller/PlanAccessApiController.java backend/src/test/java/egovframework/let/platform_admin/dashboard/controller/PlatformDashboardApiControllerTest.java backend/src/test/java/egovframework/let/platform_admin/loginhistory/controller/LoginHistoryApiControllerTest.java backend/src/test/java/egovframework/let/platform_admin/access/controller/PlanAccessApiControllerTest.java
git commit -m "refactor: standardize platform-admin dashboard login-history and plan-access APIs"
```

### Task 5: OpenAPI 문서/어노테이션 동기화

**Files:**

- Modify: `backend/src/main/java/egovframework/let/platform_admin/menus/controller/PlatformMenuApiController.java`
- Modify: `backend/src/main/java/egovframework/let/platform_admin/tenants/controller/PlatformTenantApiController.java`
- Modify: `backend/src/main/java/egovframework/let/platform_admin/tenants/controller/TenantOnboardingController.java`
- Modify: `backend/src/main/java/egovframework/let/platform_admin/dashboard/controller/PlatformDashboardApiController.java`
- Modify: `backend/src/main/java/egovframework/let/platform_admin/loginhistory/controller/LoginHistoryApiController.java`
- Modify: `backend/src/main/java/egovframework/let/platform_admin/access/controller/PlanAccessApiController.java`

- [ ] **Step 1: OpenAPI 경로/응답 계약 검증 테스트 작성(스모크)**

```java
// Controller test에서 operation 경로 호출 검증 예시
mockMvc.perform(get("/api/v1/platform-admin/plan-access/plans"))
    .andExpect(status().isOk())
    .andExpect(jsonPath("$.resultCode").exists());
```

- [ ] **Step 2: 테스트 실행으로 실패 확인**

Run: `mvn "-Dtest=PlatformMenuApiControllerTest,PlatformTenantApiControllerTest,TenantOnboardingControllerTest,PlatformDashboardApiControllerTest,LoginHistoryApiControllerTest,PlanAccessApiControllerTest" test`
Expected: FAIL if annotation/path mismatch remains

- [ ] **Step 3: 어노테이션 및 응답코드 문구 정합성 수정**

```java
@Operation(summary = "테넌트 상세 조회", description = "테넌트 코드로 상세 조회")
@ApiResponses(value = {
    @ApiResponse(responseCode = "200", description = "조회 성공"),
    @ApiResponse(responseCode = "400", description = "요청 오류"),
    @ApiResponse(responseCode = "500", description = "서버 오류")
})
```

- [ ] **Step 4: 테스트 재실행 및 통과 확인**

Run: `mvn "-Dtest=PlatformMenuApiControllerTest,PlatformTenantApiControllerTest,TenantOnboardingControllerTest,PlatformDashboardApiControllerTest,LoginHistoryApiControllerTest,PlanAccessApiControllerTest" test`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add backend/src/main/java/egovframework/let/platform_admin/menus/controller/PlatformMenuApiController.java backend/src/main/java/egovframework/let/platform_admin/tenants/controller/PlatformTenantApiController.java backend/src/main/java/egovframework/let/platform_admin/tenants/controller/TenantOnboardingController.java backend/src/main/java/egovframework/let/platform_admin/dashboard/controller/PlatformDashboardApiController.java backend/src/main/java/egovframework/let/platform_admin/loginhistory/controller/LoginHistoryApiController.java backend/src/main/java/egovframework/let/platform_admin/access/controller/PlanAccessApiController.java
git commit -m "docs: align platform-admin OpenAPI annotations with standardized API contract"
```

### Task 6: 최종 검증 및 레거시 경로 제거 확인

**Files:**

- Modify: `docs/superpowers/specs/2026-07-03-platform-admin-api-standardization-design.md` (필요 시 완료 상태 반영)

- [ ] **Step 1: 레거시 경로 잔존 여부 검증 커맨드 추가**

```bash
# /api/platform-admin 또는 /api/v1/tenants/onboarding 잔존 점검
findstr /s /n /i "@RequestMapping(\"/api/platform-admin @RequestMapping(\"/api/v1/tenants/onboarding" backend\src\main\java\*.java
```

- [ ] **Step 2: 전체 테스트 실행**

Run: `mvn test`
Expected: PASS

- [ ] **Step 3: 최종 패키징 검증**

Run: `mvn package`
Expected: BUILD SUCCESS

- [ ] **Step 4: 변경사항 요약 문서 업데이트**

```markdown
- platform_admin APIs standardized to /api/v1/platform-admin/\*
- ResultVO-only response envelope applied
- PUT/PATCH semantics separated and enforced
```

- [ ] **Step 5: 최종 커밋**

```bash
git add docs/superpowers/specs/2026-07-03-platform-admin-api-standardization-design.md
git commit -m "chore: finalize platform-admin API standardization verification"
```
