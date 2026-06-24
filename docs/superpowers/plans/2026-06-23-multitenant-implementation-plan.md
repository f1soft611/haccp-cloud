# 멀티테넌트 시스템 구현 계획

**계획 작성일**: 2026-06-23  
**기준 설계**: 2026-06-23-multitenant-hiworks-design.md  
**총 예상 기간**: 9-15 업무일  
**상태**: 준비 중

---

## 1. 구현 개요

### 1.1 구현 목표

- 기존 tenantCode 기반 로그인을 Path/도메인 기반으로 전환
- 테이블 재설계 및 데이터 마이그레이션
- 통합 로그인 페이지 구현 (테넌트별 로고 표시)
- 백엔드/프론트엔드 통합 테스트 완료

### 1.2 구현 범위

- **백엔드**: 필터, 서비스, DAO, Mapper, 마이그레이션
- **프론트엔드**: 로그인 페이지, 온보딩 페이지
- **인프라**: 테이블 스키마 변경
- **테스트**: 통합 테스트 작성 및 검증

### 1.3 위험 요소 및 대응

| 위험               | 영향도 | 대응                                 |
| ------------------ | ------ | ------------------------------------ |
| 기존 데이터 손실   | 높음   | 마이그레이션 전 완전 백업, 검증 쿼리 |
| 로그인 API 호환성  | 높음   | 구 API 임시 유지 후 단계적 제거      |
| 테넌트 라우팅 버그 | 중간   | 현지화/도메인 부분 추출 테스트 강화  |

---

## 2. 작업 분해 (Work Breakdown Structure)

```
Phase 1: 준비 및 백업 (2일)
├── 1.1 기존 테이블 백업
├── 1.2 마이그레이션 스크립트 준비
└── 1.3 테스트 데이터 생성

Phase 2: 백엔드 구현 (5-7일)
├── 2.1 테이블 스키마 생성
├── 2.2 TenantContextFilter 구현
├── 2.3 TenantService 구현
├── 2.4 LoginService 리팩토링
├── 2.5 LoginVO 변경
├── 2.6 API 엔드포인트 추가 (/api/tenants/{domain})
└── 2.7 백엔드 통합 테스트

Phase 3: 프론트엔드 구현 (3-5일)
├── 3.1 LoginPage 리팩토링
├── 3.2 테넌트 로고 조회 로직
├── 3.3 온보딩 페이지 수정
└── 3.4 프론트엔드 E2E 테스트

Phase 4: 통합 테스트 및 QA (2-3일)
├── 4.1 전체 플로우 테스트
├── 4.2 멀티테넌트 격리 검증
├── 4.3 에러 시나리오 테스트
└── 4.4 성능 테스트

Phase 5: 배포 및 모니터링 (1-2일)
├── 5.1 dev 환경 배포
├── 5.2 prod 환경 배포 준비
└── 5.3 모니터링 설정
```

---

## 3. 상세 작업 계획

### **Phase 1: 준비 및 백업**

#### Task 1.1: 기존 테이블 백업

**담당**: BE 리드  
**예상**: 1시간  
**완료 기준**: 백업 파일 생성 + 행 수 검증

```bash
# 1. PostgreSQL 덤프 생성
pg_dump -U postgres -h localhost haccp_cloud > backups/pre_migration_$(date +%Y%m%d_%H%M%S).sql

# 2. 주요 테이블 행 수 확인
SELECT 'tb_tenant' as table_name, COUNT(*) as row_count FROM tb_tenant
UNION ALL
SELECT 'tb_login_account', COUNT(*) FROM tb_login_account
UNION ALL
SELECT 'tb_user', COUNT(*) FROM tb_user
UNION ALL
SELECT 'tb_authority', COUNT(*) FROM tb_authority;

# 결과 저장: migration_baseline.txt
```

**검증 체크리스트:**

- [ ] 백업 파일 크기 > 1MB (데이터 있는지 확인)
- [ ] 각 테이블 행 수 기록
- [ ] 백업 파일 복구 테스트 (다른 DB에서)

---

#### Task 1.2: 마이그레이션 스크립트 준비

**담당**: BE 리드  
**예상**: 2시간  
**결과물**: migration_v1_0.sql

```sql
-- 파일: backend/DATABASE/migrations/2026-06-23_multitenant_schema_redesign.sql

-- Step 1: 기존 테이블 백업 (Rename)
ALTER TABLE tb_tenant RENAME TO tb_tenant_old;
ALTER TABLE tb_login_account RENAME TO tb_login_account_old;
ALTER TABLE tb_user RENAME TO tb_user_old;
ALTER TABLE tb_authority RENAME TO tb_authority_old;
ALTER TABLE tb_role RENAME TO tb_role_old;
ALTER TABLE tb_department RENAME TO tb_department_old;

-- Step 2: 새 테이블 생성 (3. 데이터 모델 참조)
CREATE TABLE tb_tenant (...);
CREATE TABLE tb_login_account (...);
CREATE TABLE tb_user (...);
CREATE TABLE tb_authority (...);
CREATE TABLE tb_role (...);
CREATE TABLE tb_login_account_role (...);
CREATE TABLE tb_menu (...);
CREATE TABLE tb_role_menu_permission (...);

-- Step 3: 데이터 마이그레이션
INSERT INTO tb_tenant (
    tenant_code, tenant_nm, admin_email, corporate_number,
    business_type, business_category, onboarding_status, use_at
)
SELECT
    tenant_code, tenant_nm, admin_email, corporate_number,
    business_type, business_category, 'COMPLETED', use_at
FROM tb_tenant_old;

-- Step 4: 검증 및 정리
-- (아래 1.3 참조)
```

**검증 체크리스트:**

- [ ] 스크립트 문법 검사 (pgAdmin에서 사전 테스트)
- [ ] 마이그레이션 전 롤백 계획 작성
- [ ] 데이터 타입 변환 검증 (특히 날짜, 숫자)

---

#### Task 1.3: 마이그레이션 검증 쿼리 준비

**담당**: QA  
**예상**: 1시간  
**결과물**: validation_queries.sql

```sql
-- 파일: backend/DATABASE/migrations/validation_2026-06-23.sql

-- 1. 행 수 비교 (Before/After)
SELECT 'tb_tenant' as table_name, COUNT(*) as new_count,
       (SELECT COUNT(*) FROM tb_tenant_old) as old_count
FROM tb_tenant
UNION ALL
SELECT 'tb_login_account', COUNT(*),
       (SELECT COUNT(*) FROM tb_login_account_old)
FROM tb_login_account;

-- 2. 유니크 제약 위반 확인
SELECT admin_email, COUNT(*)
FROM tb_tenant
GROUP BY admin_email
HAVING COUNT(*) > 1;  -- 결과 0행이어야 함

SELECT tenant_id, login_code, COUNT(*)
FROM tb_login_account
GROUP BY tenant_id, login_code
HAVING COUNT(*) > 1;  -- 결과 0행이어야 함

-- 3. 외래키 무결성 확인
SELECT * FROM tb_login_account la
WHERE NOT EXISTS (SELECT 1 FROM tb_tenant t WHERE t.tenant_id = la.tenant_id)
LIMIT 10;  -- 결과 0행이어야 함

-- 4. admin_email 도메인 추출 검증
SELECT tenant_id, admin_email,
       SUBSTRING(admin_email, POSITION('@' IN admin_email) + 1) as domain
FROM tb_tenant
WHERE use_at = 'Y'
LIMIT 10;  -- 도메인 형식 확인

-- 5. null 값 검증
SELECT COUNT(*) as null_count
FROM tb_tenant
WHERE tenant_code IS NULL OR tenant_nm IS NULL OR admin_email IS NULL;  -- 결과 0행
```

**검증 체크리스트:**

- [ ] 모든 쿼리 문법 유효
- [ ] 예상 결과값 기록 (행 수, 값 범위)
- [ ] 쿼리 실행 순서 확인

---

### **Phase 2: 백엔드 구현**

#### Task 2.1: 테이블 스키마 생성

**담당**: BE 리드  
**예상**: 4시간  
**완료 기준**: 모든 테이블 생성 + 유니크/FK 제약 검증

**실행 단계:**

1. 마이그레이션 스크립트 PostgreSQL에서 실행
2. 테이블 구조 확인: `\d tb_tenant`, `\d tb_login_account` 등
3. 인덱스 생성 확인
4. FK 관계 확인: `SELECT constraint_name FROM information_schema.table_constraints WHERE table_name='tb_login_account'`

**검증 리스트:**

- [ ] 8개 테이블 모두 생성됨
- [ ] admin_email UNIQUE 제약 확인
- [ ] (tenant_id, login_code) UNIQUE 제약 확인
- [ ] FK 연쇄 삭제 설정 확인 (ON DELETE CASCADE)
- [ ] 타임스탬프 기본값 설정 확인

---

#### Task 2.2: TenantContextFilter 구현

**담당**: BE 개발자 1  
**예상**: 2시간  
**결과물**:

- `backend/src/main/java/egovframework/let/platforms/tenants/context/TenantContextFilter.java`
- `backend/src/main/java/egovframework/let/platforms/tenants/context/TenantContextHolder.java`

**구현 단계:**

```java
// 1. TenantContextHolder 생성 (ThreadLocal 기반)
public class TenantContextHolder {
    private static final ThreadLocal<Long> tenantIdHolder = new ThreadLocal<>();
    // setTenantId, getTenantId, clear 메서드
}

// 2. TenantContextFilter 구현
@Component
public class TenantContextFilter extends OncePerRequestFilter {
    // doFilterInternal: Path 파싱 → 테넌트 조회 → Context 설정
    // extractTenantDomain: /f1soft.co.kr/login → f1soft.co.kr 추출
}

// 3. FilterRegistration 설정
// SecurityConfig에서 filter chain에 추가
```

**테스트:**

```java
@Test
public void testTenantContextFilterSetsTenantId() {
    // Given: /f1soft.co.kr/login 요청
    // When: filter 실행
    // Then: TenantContextHolder.getTenantId() == 1
}
```

**검증 체크리스트:**

- [ ] URL 파싱 로직 정확 (특수문자, URL encoding 처리)
- [ ] null 도메인 처리 (finally 블록에서 clear)
- [ ] 테넌트 미존재 시 처리 (null 체크)

---

#### Task 2.3: TenantService 구현 및 DAO 추가

**담당**: BE 개발자 1  
**예상**: 3시간  
**결과물**:

- `backend/src/main/java/egovframework/let/platforms/tenants/service/TenantService.java`
- `backend/src/main/java/egovframework/let/platforms/tenants/service/impl/TenantServiceImpl.java` (수정)
- `backend/src/main/java/egovframework/let/platforms/tenants/domain/repository/TenantInfoDAO.java` (신규 메서드)
- `backend/src/main/resources/egovframework/mapper/let/platforms/tenants/PlatformTenantMapper_SQL_postgresql.xml` (신규 쿼리)

**구현 단계:**

**1. TenantService 인터페이스 (기존 확장)**

```java
public interface TenantService {
    // 기존 메서드
    Tenant registerTenant(TenantRequest request);
    Tenant findById(Long tenantId);

    // 신규 메서드
    Tenant findByAdminEmailDomain(String domain);
    void updateLogoImage(Long tenantId, String base64Image);
}
```

**2. TenantServiceImpl 구현**

```java
@Service
@Transactional
public class TenantServiceImpl implements TenantService {
    @Autowired private TenantInfoDAO tenantInfoDAO;

    @Override
    public Tenant findByAdminEmailDomain(String domain) {
        List<Tenant> result = tenantInfoDAO.selectByAdminEmailDomain(domain);
        if (result.isEmpty()) {
            throw new TenantNotFoundException("TENANT_NOT_FOUND");
        }
        if (result.size() > 1) {
            throw new InvalidTenantStateException("MULTIPLE_TENANTS_FOR_DOMAIN");
        }
        return result.get(0);
    }

    @Override
    public void updateLogoImage(Long tenantId, String base64Image) {
        Tenant tenant = tenantInfoDAO.select(tenantId);
        tenant.setLogoImage(base64Image);
        tenant.setUpdatedAt(LocalDateTime.now());
        tenantInfoDAO.update(tenant);
    }
}
```

**3. TenantInfoDAO 신규 메서드**

```java
public interface TenantInfoDAO extends EgovAbstractMapper {
    List<Tenant> selectByAdminEmailDomain(@Param("domain") String domain);
    // 기존 메서드 유지
}
```

**4. Mapper XML 쿼리**

```xml
<!-- PlatformTenantMapper_SQL_postgresql.xml -->
<select id="selectByAdminEmailDomain" resultMap="tenantResultMap">
    SELECT * FROM tb_tenant
    WHERE use_at = 'Y'
      AND SUBSTRING(admin_email, POSITION('@' IN admin_email) + 1) = #{domain}
</select>
```

**테스트:**

```java
@Test
public void testFindByAdminEmailDomain_Success() {
    // Given: admin_email = socra710@f1soft.co.kr
    // When: findByAdminEmailDomain("f1soft.co.kr")
    // Then: tenant_id = 1, tenant_nm = "F1Soft"
}

@Test
public void testFindByAdminEmailDomain_NotFound() {
    // Given: 존재하지 않는 도메인
    // When: findByAdminEmailDomain("notexist.com")
    // Then: TenantNotFoundException 발생
}
```

**검증 체크리스트:**

- [ ] SQL SUBSTRING/POSITION 문법 검증
- [ ] 도메인 구분 기호 '@' 처리 정확
- [ ] 대소문자 구분 (case-sensitive) 확인
- [ ] null 도메인 처리

---

#### Task 2.4: LoginService 리팩토링

**담당**: BE 개발자 2  
**예상**: 3시간  
**결과물**:

- `backend/src/main/java/egovframework/let/uat/uia/service/impl/LoginServiceImpl.java` (수정)
- `backend/src/main/resources/egovframework/mapper/let/uat/uia/EgovLoginUsr_SQL_postgresql.xml` (수정)

**기존 로직:**

```sql
SELECT li.login_code AS id, t.tenant_code AS tenantCode
FROM tb_login_account li
JOIN tb_tenant t ON li.tenant_id = t.tenant_id
WHERE li.login_code = #{id}
  AND li.password_hash = #{password}
  AND t.tenant_code = #{tenantCode};  -- ← tenantCode 명시 전달
```

**신규 로직:**

```sql
-- 변수: TenantContextHolder.getTenantId() 사용 (전달 파라미터 아님)
SELECT li.login_code AS id, li.tenant_id AS tenantId
FROM tb_login_account li
WHERE li.tenant_id = #{tenantId}  -- ← TenantContext에서 추출
  AND li.login_code = #{id}
  AND li.password_hash = #{password}
```

**구현 단계:**

**1. LoginVO 변경**

```java
// Before
public class LoginVO {
    private String id;
    private String password;
    private String tenantCode;  // ← 제거
}

// After
public class LoginVO {
    private String id;
    private String password;
    // tenantCode 제거 (backward compatibility: 받아도 무시)
}
```

**2. LoginServiceImpl.actionLogin() 수정**

```java
public LoginResponse actionLogin(LoginVO loginVO) {
    // 1. TenantContext에서 tenantId 추출
    Long tenantId = TenantContextHolder.getTenantId();
    if (tenantId == null) {
        throw new InvalidTenantException("INVALID_TENANT_DOMAIN");
    }

    // 2. 테넌트 활성화 확인
    Tenant tenant = tenantService.findById(tenantId);
    if (!"Y".equals(tenant.getUseAt())) {
        throw new TenantSuspendedException("TENANT_SUSPENDED");
    }

    // 3. 로그인 계정 조회 (tenantId 기반)
    LoginAccount account = loginAccountRepository.findByTenantIdAndLoginCode(
        tenantId,
        loginVO.getId()
    ).orElseThrow(() -> new AccountNotFoundException("ACCOUNT_NOT_FOUND"));

    // 4. 계정 잠금 확인
    if (account.getLockedAt() != null) {
        throw new AccountLockedException("ACCOUNT_LOCKED");
    }

    // 5. 비밀번호 검증
    if (!passwordEncoder.matches(loginVO.getPassword(), account.getPasswordHash())) {
        account.incrementLoginAttemptCount();
        if (account.getLoginAttemptCount() >= 5) {
            account.setLockedAt(LocalDateTime.now());
        }
        loginAccountRepository.save(account);
        throw new InvalidPasswordException("INVALID_PASSWORD");
    }

    // 6. 성공
    account.resetLoginAttemptCount();
    loginAccountRepository.save(account);

    String token = jwtTokenUtil.generateToken(account.getLoginCode(), tenantId);
    return new LoginResponse(token, tenantId);
}
```

**3. MyBatis Mapper 쿼리 수정**

```xml
<!-- EgovLoginUsr_SQL_postgresql.xml -->
<select id="selectLogin" resultType="loginVO">
    SELECT li.login_id, li.login_code AS id, li.tenant_id AS tenantId
    FROM tb_login_account li
    WHERE li.tenant_id = #{tenantId}
      AND li.login_code = #{id}
      AND li.password_hash = #{password}
      AND li.use_at = 'Y'
</select>
```

**테스트:**

```java
@Test
public void testActionLogin_Success() {
    // Given: TenantContextHolder.setTenantId(1)
    // When: actionLogin("socra710", "password123")
    // Then: JWT 토큰 반환, tenantId 포함
}

@Test
public void testActionLogin_NoTenantContext() {
    // Given: TenantContextHolder.getTenantId() == null
    // When: actionLogin()
    // Then: InvalidTenantException
}

@Test
public void testActionLogin_InvalidPassword() {
    // Given: 잘못된 비밀번호
    // When: actionLogin()
    // Then: login_attempt_count 증가, InvalidPasswordException
}

@Test
public void testActionLogin_AccountLocked() {
    // Given: login_attempt_count >= 5
    // When: actionLogin()
    // Then: AccountLockedException
}
```

**검증 체크리스트:**

- [ ] tenantCode 필드 제거/무시 처리
- [ ] 계정 잠금 로직 정확
- [ ] 비밀번호 해시 비교 정확
- [ ] JWT 토큰에 tenantId 포함

---

#### Task 2.5: 신규 API 엔드포인트 추가

**담당**: BE 개발자 2  
**예상**: 1시간  
**결과물**:

- `backend/src/main/java/egovframework/let/platforms/tenants/controller/PlatformTenantApiController.java` (신규 메서드)

**신규 엔드포인트:**

```java
@RestController
@RequestMapping("/api/tenants")
public class PlatformTenantApiController {

    @Autowired private TenantService tenantService;

    // 신규: 테넌트 정보 조회 (프론트에서 로고 가져올 때 사용)
    @GetMapping("/{domain}")
    public ResponseEntity<TenantInfoResponse> getTenantByDomain(@PathVariable String domain) {
        try {
            Tenant tenant = tenantService.findByAdminEmailDomain(domain);
            TenantInfoResponse response = new TenantInfoResponse(
                tenant.getTenantId(),
                tenant.getTenantNm(),
                tenant.getLogoImage(),
                tenant.getAdminEmail()
            );
            return ResponseEntity.ok(response);
        } catch (TenantNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // 신규: 로그인 페이지용 테넌트 정보 (간단 버전)
    @GetMapping("/{domain}/login-info")
    public ResponseEntity<LoginPageTenantInfo> getLoginPageInfo(@PathVariable String domain) {
        try {
            Tenant tenant = tenantService.findByAdminEmailDomain(domain);
            if (!"Y".equals(tenant.getUseAt())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new LoginPageTenantInfo("suspended", null, null));
            }
            LoginPageTenantInfo info = new LoginPageTenantInfo(
                "active",
                tenant.getTenantNm(),
                tenant.getLogoImage()
            );
            return ResponseEntity.ok(info);
        } catch (TenantNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new LoginPageTenantInfo("notfound", null, null));
        }
    }
}

// DTO
@Data
@NoArgsConstructor
public class LoginPageTenantInfo {
    private String status;  // active, suspended, notfound
    private String tenantName;
    private String logoImage;  // Base64

    public LoginPageTenantInfo(String status, String tenantName, String logoImage) {
        this.status = status;
        this.tenantName = tenantName;
        this.logoImage = logoImage;
    }
}
```

**테스트:**

```java
@Test
public void testGetTenantByDomain() throws Exception {
    mockMvc.perform(get("/api/tenants/f1soft.co.kr"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.tenantName").value("F1Soft"))
        .andExpect(jsonPath("$.logoImage").exists());
}

@Test
public void testGetLoginPageInfo_Active() throws Exception {
    mockMvc.perform(get("/api/tenants/f1soft.co.kr/login-info"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("active"));
}

@Test
public void testGetLoginPageInfo_NotFound() throws Exception {
    mockMvc.perform(get("/api/tenants/invalid.com/login-info"))
        .andExpect(status().isNotFound());
}
```

---

#### Task 2.6: 백엔드 통합 테스트 작성

**담당**: QA/BE  
**예상**: 3시간  
**결과물**:

- `backend/src/test/java/egovframework/let/MultiTenantLoginIntegrationTest.java`

**테스트 시나리오:**

1. ✅ 올바른 도메인 + 유효한 자격증명 → 로그인 성공
2. ✅ 올바른 도메인 + 잘못된 비밀번호 → 401
3. ✅ 존재하지 않는 도메인 → 400
4. ✅ 비활성화 테넌트 → 403
5. ✅ 계정 잠금 (5회 실패) → 401 ACCOUNT_LOCKED
6. ✅ 다중 테넌트 격리 (같은 login_code 다른 테넌트) → 테넌트별 독립 처리

```java
@SpringBootTest
@AutoConfigureMockMvc
public class MultiTenantLoginIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private TenantRepository tenantRepository;
    @Autowired private LoginAccountRepository loginAccountRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private Long tenant1Id, tenant2Id;

    @BeforeEach
    public void setUp() {
        // 테넌트 1: f1soft.co.kr
        Tenant t1 = new Tenant();
        t1.setTenantCode("TENANT_001");
        t1.setTenantNm("F1Soft");
        t1.setAdminEmail("socra710@f1soft.co.kr");
        t1.setUseAt("Y");
        Tenant savedT1 = tenantRepository.save(t1);
        tenant1Id = savedT1.getTenantId();

        LoginAccount a1 = new LoginAccount();
        a1.setTenantId(tenant1Id);
        a1.setLoginCode("socra710");
        a1.setPasswordHash(passwordEncoder.encode("password123"));
        a1.setUseAt("Y");
        loginAccountRepository.save(a1);

        // 테넌트 2: another.co.kr
        Tenant t2 = new Tenant();
        t2.setTenantCode("TENANT_002");
        t2.setTenantNm("Another Company");
        t2.setAdminEmail("admin@another.co.kr");
        t2.setUseAt("Y");
        Tenant savedT2 = tenantRepository.save(t2);
        tenant2Id = savedT2.getTenantId();

        LoginAccount a2 = new LoginAccount();
        a2.setTenantId(tenant2Id);
        a2.setLoginCode("admin");
        a2.setPasswordHash(passwordEncoder.encode("pass456"));
        a2.setUseAt("Y");
        loginAccountRepository.save(a2);
    }

    @Test
    public void testLoginFlow_Tenant1_Success() throws Exception {
        // Step 1: 로그인 페이지 접속
        mockMvc.perform(get("/f1soft.co.kr/login"))
            .andExpect(status().isOk());

        // Step 2: 로그인 요청
        mockMvc.perform(post("/auth/login-jwt")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "id": "socra710",
                  "password": "password123"
                }
            """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").exists())
            .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    public void testMultiTenantIsolation() throws Exception {
        // Tenant 1에서 로그인 페이지 접속
        mockMvc.perform(get("/f1soft.co.kr/login"))
            .andExpect(status().isOk());

        // Tenant 1의 계정("socra710")과 비밀번호로 로그인
        mockMvc.perform(post("/auth/login-jwt")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "id": "socra710",
                  "password": "password123"
                }
            """))
            .andExpect(status().isOk());

        // 이후 Tenant 2에서 로그인 페이지 접속 (컨텍스트 변경)
        mockMvc.perform(get("/another.co.kr/login"))
            .andExpect(status().isOk());

        // Tenant 1의 계정("socra710")으로 로그인 시도 → 실패 (Tenant 2에는 socra710이 없음)
        mockMvc.perform(post("/auth/login-jwt")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "id": "socra710",
                  "password": "password123"
                }
            """))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.errorCode").value("ACCOUNT_NOT_FOUND"));
    }

    @Test
    public void testLoginAttemptLocking() throws Exception {
        mockMvc.perform(get("/f1soft.co.kr/login"));

        // 5회 실패 시도
        for (int i = 0; i < 5; i++) {
            mockMvc.perform(post("/auth/login-jwt")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "id": "socra710",
                      "password": "wrongPassword"
                    }
                """))
                .andExpect(status().isUnauthorized());
        }

        // 6번째 시도 → 계정 잠금
        mockMvc.perform(post("/auth/login-jwt")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "id": "socra710",
                  "password": "password123"
                }
            """))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.errorCode").value("ACCOUNT_LOCKED"));
    }
}
```

**검증 체크리스트:**

- [ ] 모든 테스트 통과 (PASS)
- [ ] 다중 테넌트 격리 확인
- [ ] 계정 잠금 로직 정확
- [ ] 에러 코드 일관성

---

### **Phase 3: 프론트엔드 구현**

#### Task 3.1: LoginPage 컴포넌트 리팩토링

**담당**: FE 개발자  
**예상**: 3시간  
**결과물**:

- `frontend/src/pages/auth/LoginPage.tsx` (수정)
- `frontend/src/services/authService.ts` (수정)

**변경 사항:**

1. tenantCode 입력 필드 제거
2. 테넌트 정보(로고, 이름) 조회 로직 추가
3. Base64 이미지 렌더링

```typescript
// Before
export const LoginPage: React.FC = () => {
  const [tenantCode, setTenantCode] = useState("");  // ← 제거
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    await loginService.login({
      id,
      password,
      tenantCode,  // ← 제거
    });
  };
};

// After
export const LoginPage: React.FC = () => {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // URL에서 테넌트 도메인 추출
  const path = window.location.pathname;  // /f1soft.co.kr/login
  const tenantDomain = extractTenantDomain(path);

  // 테넌트 정보 조회 (로고 등)
  const { data: tenantInfo, isLoading: isTenantLoading } = useQuery(
    ['tenant', tenantDomain],
    () => fetch(`/api/tenants/${tenantDomain}/login-info`).then(r => r.json()),
    {
      enabled: !!tenantDomain,
      staleTime: 5 * 60 * 1000,  // 5분 캐시
    }
  );

  const loginMutation = useMutation(
    (credentials: { id: string; password: string }) =>
      authService.login(credentials),  // tenantCode 제거
    {
      onSuccess: (data) => {
        localStorage.setItem('token', data.token);
        window.location.href = '/dashboard';
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.message || '로그인 실패';
        setError(errorMessage);
      },
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      loginMutation.mutate({ id, password });
    } finally {
      setLoading(false);
    }
  };

  // 테넌트 미발견 처리
  if (tenantInfo?.status === 'notfound') {
    return <div className="error-page">존재하지 않는 회사입니다.</div>;
  }

  if (tenantInfo?.status === 'suspended') {
    return <div className="error-page">서비스 이용 불가능한 회사입니다.</div>;
  }

  return (
    <div className="login-container">
      {tenantInfo?.logoImage && (
        <img
          src={tenantInfo.logoImage}  // Base64 이미지
          alt={tenantInfo.tenantName}
          className="company-logo"
        />
      )}
      <h1>{tenantInfo?.tenantName || '로그인'}</h1>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="id">사용자 ID</label>
          <input
            id="id"
            type="text"
            placeholder="사용자 ID (이메일 로컬 부분)"
            value={id}
            onChange={(e) => setId(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">비밀번호</label>
          <input
            id="password"
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <button
          type="submit"
          disabled={loginMutation.isLoading || isTenantLoading}
        >
          {loginMutation.isLoading ? '로그인 중...' : '로그인'}
        </button>
      </form>
    </div>
  );
};

function extractTenantDomain(path: string): string {
  // /f1soft.co.kr/login → f1soft.co.kr
  const parts = path.split('/').filter(p => p);
  if (parts.length > 0 && parts[0].includes('.')) {
    return parts[0];
  }
  return '';
}
```

**테스트:**

```typescript
describe('LoginPage', () => {
  it('should display company logo and name', async () => {
    // Mock API 응답
    vi.mock('authService', () => ({
      login: vi.fn(),
    }));

    render(<LoginPage />);

    // 테넌트 정보 로드 대기
    await waitFor(() => {
      expect(screen.getByAltText('F1Soft')).toBeInTheDocument();
    });

    // 로고 이미지 확인
    const logo = screen.getByAltText('F1Soft') as HTMLImageElement;
    expect(logo.src).toMatch(/^data:image/);
  });

  it('should extract tenant domain from URL', () => {
    // /f1soft.co.kr/login → f1soft.co.kr
    const domain = extractTenantDomain('/f1soft.co.kr/login');
    expect(domain).toBe('f1soft.co.kr');
  });
});
```

---

#### Task 3.2: AuthService 수정

**담당**: FE 개발자  
**예상**: 1시간  
**결과물**:

- `frontend/src/services/authService.ts` (수정)

```typescript
// Before
export const authService = {
  login: async (credentials: LoginCredentials) => {
    const response = await fetch('/auth/login-jwt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: credentials.id,
        password: credentials.password,
        tenantCode: credentials.tenantCode, // ← 제거
      }),
    });
    return response.json();
  },
};

// After
interface LoginCredentials {
  id: string;
  password: string;
  // tenantCode 필드 제거
}

interface LoginResponse {
  token: string;
  tenantId: number; // ← 추가
  success: boolean;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await fetch('/auth/login-jwt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: credentials.id,
        password: credentials.password,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '로그인 실패');
    }

    return response.json();
  },
};
```

---

#### Task 3.3: 온보딩 페이지 수정

**담당**: FE 개발자  
**예상**: 2시간  
**결과물**:

- `frontend/src/pages/tenant-management/onboarding/OnboardingPage.tsx` (수정)

**변경 사항:**

1. admin_email에서 도메인 자동 추출 및 표시
2. 로고 이미지 업로드 UI (Base64 변환)
3. 온보딩 완료 후 로그인 페이지 링크 생성

```typescript
export const OnboardingPage: React.FC = () => {
  const [tenantData, setTenantData] = useState({
    tenantNm: '',
    adminEmail: '',
    logoImage: null as string | null,  // Base64
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // admin_email에서 도메인 추출
  const tenantDomain = tenantData.adminEmail
    ? tenantData.adminEmail.split('@')[1]
    : '';

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 크기 검증 (1MB 이하)
    if (file.size > 1024 * 1024) {
      alert('로고 이미지는 1MB 이하여야 합니다.');
      return;
    }

    // Base64 변환
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setTenantData(prev => ({ ...prev, logoImage: base64 }));
      setLogoPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const onboardingMutation = useMutation(
    (data: any) => tenantService.completeOnboarding(data),
    {
      onSuccess: (response) => {
        // 온보딩 완료 후 로그인 페이지로 이동
        const loginUrl = `https://${tenantDomain}/login`;
        window.location.href = loginUrl;
      },
    }
  );

  const handleSubmit = async () => {
    onboardingMutation.mutate({
      tenantNm: tenantData.tenantNm,
      adminEmail: tenantData.adminEmail,
      logoImage: tenantData.logoImage,  // Base64 전송
      onboardingStatus: 'COMPLETED',
    });
  };

  return (
    <div className="onboarding-container">
      <h1>온보딩</h1>

      {/* 도메인 표시 (읽기만) */}
      <div className="domain-info">
        <label>회사 도메인:</label>
        <input
          type="text"
          value={tenantDomain || '(이메일 입력 후 자동 생성)'}
          readOnly
        />
      </div>

      {/* 로그인 URL 미리보기 */}
      {tenantDomain && (
        <div className="login-url-preview">
          로그인 URL: <code>https://{tenantDomain}/login</code>
        </div>
      )}

      {/* 로고 업로드 */}
      <div className="form-group">
        <label htmlFor="logo">회사 로고</label>
        <input
          id="logo"
          type="file"
          accept="image/*"
          onChange={handleLogoUpload}
        />
        {logoPreview && (
          <div className="logo-preview">
            <img src={logoPreview} alt="로고 미리보기" />
          </div>
        )}
      </div>

      <button onClick={handleSubmit} disabled={onboardingMutation.isLoading}>
        온보딩 완료
      </button>
    </div>
  );
};
```

---

#### Task 3.4: 프론트엔드 E2E 테스트

**담당**: QA  
**예상**: 2시간  
**결과물**:

- `frontend/src/test/e2e/login.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Login Flow - Multi-tenant', () => {
  test('should login with correct credentials for tenant f1soft.co.kr', async ({
    page,
  }) => {
    // 1. 로그인 페이지 접속
    await page.goto('http://localhost:3000/f1soft.co.kr/login');

    // 2. 테넌트 정보 로드 확인 (로고 표시)
    const logo = page.locator('img.company-logo');
    await expect(logo).toBeVisible({ timeout: 5000 });

    // 3. 로그인 입력
    await page.fill('input[type="text"]', 'socra710');
    await page.fill('input[type="password"]', 'password123');

    // 4. 로그인 버튼 클릭
    await page.click('button:has-text("로그인")');

    // 5. 대시보드로 이동 확인
    await page.waitForNavigation();
    expect(page.url()).toContain('/dashboard');
  });

  test('should show error for non-existent tenant domain', async ({ page }) => {
    await page.goto('http://localhost:3000/notexist.com/login');

    // 에러 메시지 표시
    const errorMsg = page.locator('text=존재하지 않는 회사입니다');
    await expect(errorMsg).toBeVisible();
  });

  test('should isolate login accounts across tenants', async ({ page }) => {
    // Tenant 1 로그인
    await page.goto('http://localhost:3000/f1soft.co.kr/login');
    await page.fill('input[type="text"]', 'socra710');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("로그인")');
    await page.waitForNavigation();

    // 로그아웃
    await page.click('button:has-text("로그아웃")');

    // Tenant 2 로그인 시도 (다른 계정)
    await page.goto('http://localhost:3000/another.co.kr/login');
    await page.fill('input[type="text"]', 'socra710'); // Tenant 1 계정
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("로그인")');

    // 실패 확인
    const errorMsg = page.locator('text=계정 정보가 없습니다');
    await expect(errorMsg).toBeVisible();
  });
});
```

---

### **Phase 4: 통합 테스트 및 QA**

#### Task 4.1: 전체 플로우 테스트

**담당**: QA  
**예상**: 1일  
**체크리스트:**

- [ ] 1개 테넌트 로그인 성공
- [ ] 2개 이상 테넌트 동시 로그인 (멀티탭)
- [ ] 로그아웃 및 재로그인
- [ ] 비밀번호 변경 후 로그인
- [ ] 계정 잠금 해제 (관리자)

#### Task 4.2: 멀티테넌트 격리 검증

**담당**: QA  
**예상**: 4시간  
**테스트 시나리오:**

- [ ] Tenant A 계정으로 Tenant B 접근 불가
- [ ] Tenant A 데이터 Tenant B에서 조회 불가
- [ ] JWT 토큰 tenantId 검증
- [ ] API 요청 필터링

#### Task 4.3: 에러 시나리오 테스트

**담당**: QA  
**예상**: 4시간  
**시나리오:**

- [ ] 잘못된 URL 도메인
- [ ] 존재하지 않는 계정
- [ ] 틀린 비밀번호 (1~5회)
- [ ] 계정 잠금
- [ ] 비활성화 테넌트
- [ ] DB 연결 끊김

#### Task 4.4: 성능 테스트

**담당**: QA  
**예상**: 4시간  
**메트릭:**

- 로그인 응답 시간: < 500ms
- 대량 동시 로그인: 100명 이상
- 메모리 누수 확인 (TenantContext cleanup)

---

### **Phase 5: 배포 및 모니터링**

#### Task 5.1: dev 환경 배포

**담당**: DevOps/BE  
**예상**: 2시간  
**단계:**

1. 마이그레이션 스크립트 실행
2. 백엔드 빌드 및 배포
3. 프론트엔드 빌드 및 배포
4. 스모크 테스트

#### Task 5.2: prod 환경 배포 준비

**담당**: DevOps/BE  
**예상**: 2시간  
**체크리스트:**

- [ ] 롤백 계획 작성
- [ ] 배포 전 데이터 검증
- [ ] 모니터링 알림 설정
- [ ] 긴급 연락처 지정

#### Task 5.3: 모니터링 설정

**담당**: DevOps  
**예상**: 1시간  
**항목:**

- TenantContext 생성/소멸 로그
- 로그인 성공/실패율
- API 응답 시간
- 에러율

---

## 4. 의존성 및 선행 조건

### 선행 요구사항

- ✅ 설계 문서 최종 승인
- ✅ 기존 데이터 백업 완료
- ✅ 테스트 환경 준비 (dev DB)
- ✅ 팀 인원 할당 (BE 2-3명, FE 1-2명, QA 1명)

### 기술적 의존성

- Spring Boot 2.7.18 (기존)
- PostgreSQL 12+ (마이그레이션 스크립트)
- React 18+ (프론트엔드)
- Vitest (테스트 프레임워크)

---

## 5. 위험 관리

| 위험                 | 확률 | 영향도 | 감시 방법                     | 대응 방안                |
| -------------------- | ---- | ------ | ----------------------------- | ------------------------ |
| 데이터 손실          | 낮음 | 높음   | 마이그레이션 전/후 행 수 확인 | 백업 복구, 작업 재진행   |
| 성능 저하            | 중간 | 중간   | 로그인 응답 시간 모니터링     | 인덱스 최적화, 쿼리 튜닝 |
| 로그인 불가          | 낮음 | 높음   | 라이브 테스트                 | 긴급 롤백                |
| 멀티테넌트 격리 실패 | 낮음 | 높음   | 보안 테스트                   | 정책 재검토              |

---

## 6. 성공 기준

**Go-Live 전 체크리스트:**

- [ ] 모든 백엔드 테스트 통과 (> 90% 커버리지)
- [ ] 모든 프론트엔드 테스트 통과
- [ ] E2E 테스트 통과 (10개 시나리오)
- [ ] 성능 테스트 통과 (응답 시간 < 500ms)
- [ ] 보안 검수 통과 (멀티테넌트 격리 검증)
- [ ] 롤백 계획 승인
- [ ] 사용자 문서 작성 (온보딩 가이드)

---

## 7. 타임라인 (예상)

```
Week 1:
  Mon-Tue: Phase 1 (준비/백업)
  Wed-Fri: Phase 2 (백엔드 구현)

Week 2:
  Mon-Wed: Phase 2 계속 + Phase 3 (프론트엔드)
  Thu-Fri: Phase 4 (통합 테스트)

Week 3:
  Mon-Tue: Phase 4 계속
  Wed-Fri: Phase 5 (배포 준비)
```

**예상 총 기간: 9-15일** (팀 규모, 병렬 작업 여부에 따라 가변)

---

## 8. 커뮤니케이션 계획

| 대상       | 빈도   | 채널     | 내용                     |
| ---------- | ------ | -------- | ------------------------ |
| 이해관계자 | 주 1회 | 회의     | 진행 상황, 위험 요소     |
| 개발팀     | 일 1회 | 스탠드업 | 블로커, 완료 사항        |
| QA팀       | 수시   | Slack    | 테스트 결과, 버그 리포트 |

---

## 9. 문서화 계획

**작성 대상:**

- [ ] 운영 매뉴얼 (관리자용)
- [ ] API 문서 (개발자용)
- [ ] 온보딩 가이드 (최종 사용자)
- [ ] 트러블슈팅 가이드

---

## 10. 회고 및 개선 (사후)

**구현 후 1주일:**

- [ ] 팀 회고 진행
- [ ] 예상 vs 실제 소요 시간 비교
- [ ] 문제점 및 개선사항 기록
- [ ] 다음 유사 프로젝트 교훈 반영

---

**계획 검토 상태**: ⏳ 대기 중 (사용자 승인 필요)  
**최종 수정**: 2026-06-23
