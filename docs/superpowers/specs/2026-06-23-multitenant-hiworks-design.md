# 멀티테넌트 시스템 재설계 (Hiworks 모델)

**문서 작성일**: 2026-06-23  
**상태**: 설계 검토 중  
**적용 범위**: 인증, 테넌트 라우팅, 권한 관리 시스템

---

## 1. 목표 및 범위

### 목표

- **Hiworks 모델** 기반의 멀티테넌트 시스템 구현
- Path 기반 테넌트 라우팅 (`/f1soft.co.kr/login`)
- 이메일 도메인 기반 테넌트 식별
- 통합 로그인 페이지 (테넌트 코드 입력 제거)
- 단순한 데이터 모델 (불필요한 중복 제거)

### 현재 문제점

1. tenantCode를 명시적으로 입력해야 함 (불편)
2. 로그인 시 도메인 정보 활용 미흡
3. URL에서 테넌트 식별 불가능
4. 로고 관리 인프라 부재

### 변경 대상 시스템

- 인증 (로그인 API)
- 요청 라우팅 (테넌트 컨텍스트 설정)
- 데이터 모델 (테이블 스키마)
- 프론트엔드 로그인 페이지
- 테넌트 온보딩 플로우

---

## 2. 기술 결정사항

| 항목              | 결정                                 | 근거                                          |
| ----------------- | ------------------------------------ | --------------------------------------------- |
| **URL 패턴**      | Path 기반: `/f1soft.co.kr/login`     | 서브도메인 구성 불필요, 간단한 라우팅         |
| **테넌트 식별**   | admin_email 도메인 부분 추출         | 별도 도메인 테이블 불필요, 데이터 단순화      |
| **로그인 식별자** | 이메일 local-part (e.g., "socra710") | 사용자 친화적, 이메일 기억하면 됨             |
| **로고 저장**     | Base64 (tb_tenant.logo_image)        | 파일 관리 제거, 작은 이미지 크기 (100KB 이하) |
| **도메인 설정**   | 온보딩 시 admin_email로 자동 결정    | 플랫폼 관리자가 admin_email 제공              |
| **마이그레이션**  | 기존 테이블 재생성 가능              | 신규 시스템이므로 데이터 손실 수용 가능       |

---

## 3. 데이터 모델

### 3.1 tb_tenant (테넌트 정보)

```sql
CREATE TABLE tb_tenant (
    tenant_id BIGSERIAL PRIMARY KEY,
    tenant_code VARCHAR(50) UNIQUE NOT NULL,           -- 시스템 생성 코드 (예: TENANT_20260623_001)
    tenant_nm VARCHAR(200) NOT NULL,                   -- 회사명
    admin_email VARCHAR(100) UNIQUE NOT NULL,          -- 업체 관리자 이메일 (socra710@f1soft.co.kr)
    corporate_number VARCHAR(20),                      -- 사업자번호 (정규화: 숫자만)
    business_type VARCHAR(50),                         -- 업종
    business_category VARCHAR(50),                     -- 업태
    logo_image LONGTEXT,                               -- Base64 인코딩된 로고 이미지
    onboarding_status VARCHAR(20) DEFAULT 'PENDING',   -- PENDING, COMPLETED, SUSPENDED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT,                                 -- 플랫폼 관리자 ID
    use_at CHAR(1) DEFAULT 'Y',                        -- 사용 여부

    UNIQUE INDEX uk_admin_email (admin_email),
    INDEX idx_tenant_code (tenant_code),
    INDEX idx_onboarding_status (onboarding_status)
);
```

**핵심:**

- `admin_email`에서 도메인 추출: `SUBSTRING(admin_email, POSITION('@' IN admin_email) + 1)` = `f1soft.co.kr`
- 로고는 Base64 문자열로 직접 저장 (파일 관리 X)
- tenantCode는 고유 식별자이지만, **로그인 시에는 사용 안 함**

### 3.2 tb_login_account (로그인 계정)

```sql
CREATE TABLE tb_login_account (
    login_id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    login_code VARCHAR(100) NOT NULL,                  -- 로그인 ID (socra710)
    password_hash VARCHAR(255) NOT NULL,               -- BCrypt 해시
    login_attempt_count INT DEFAULT 0,                 -- 실패 횟수
    locked_at TIMESTAMP,                               -- 계정 잠금 시간
    password_changed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    use_at CHAR(1) DEFAULT 'Y',

    UNIQUE KEY uk_tenant_login_code (tenant_id, login_code),
    FOREIGN KEY (tenant_id) REFERENCES tb_tenant(tenant_id) ON DELETE CASCADE,
    INDEX idx_login_code (login_code)
);
```

**핵심:**

- `(tenant_id, login_code)` 복합 유니크: 테넌트 내에서만 login_code 유일
- 비밀번호는 BCrypt로 해시된 형태 저장
- 계정 잠금 로직 추가 가능

### 3.3 tb_user (사용자 정보)

```sql
CREATE TABLE tb_user (
    user_id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    login_id BIGINT,                                   -- tb_login_account.login_id (FK)
    user_nm VARCHAR(100) NOT NULL,                    -- 사용자명
    email_adres VARCHAR(100),                          -- 이메일 (테넌트 내 중복 불가)
    department_id BIGINT,                              -- tb_department.department_id (FK)
    mobile_no VARCHAR(20),
    position_nm VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    use_at CHAR(1) DEFAULT 'Y',

    UNIQUE KEY uk_tenant_email (tenant_id, email_adres),  -- 테넌트 내에서만 이메일 유일
    FOREIGN KEY (tenant_id) REFERENCES tb_tenant(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (login_id) REFERENCES tb_login_account(login_id),
    INDEX idx_tenant_user (tenant_id, user_id)
);
```

**핵심:**

- 이메일은 **테넌트 내에서만** 유일 (다른 테넌트와는 중복 가능)
- login_id는 선택사항 (사용자가 로그인할 필요 없을 수도 있음)

### 3.4 tb_authority (권한)

```sql
CREATE TABLE tb_authority (
    authority_id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    authority_code VARCHAR(50) NOT NULL,               -- ADMIN, USER, MANAGER 등
    authority_nm VARCHAR(100) NOT NULL,
    authority_description VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    use_at CHAR(1) DEFAULT 'Y',

    UNIQUE KEY uk_tenant_authority_code (tenant_id, authority_code),
    FOREIGN KEY (tenant_id) REFERENCES tb_tenant(tenant_id) ON DELETE CASCADE
);
```

### 3.5 tb_role (역할)

```sql
CREATE TABLE tb_role (
    role_id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    role_code VARCHAR(50) NOT NULL,
    role_nm VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    use_at CHAR(1) DEFAULT 'Y',

    UNIQUE KEY uk_tenant_role_code (tenant_id, role_code),
    FOREIGN KEY (tenant_id) REFERENCES tb_tenant(tenant_id) ON DELETE CASCADE
);
```

### 3.6 tb_login_account_role (계정-역할 매핑)

```sql
CREATE TABLE tb_login_account_role (
    login_account_role_id BIGSERIAL PRIMARY KEY,
    login_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_login_role (login_id, role_id),
    FOREIGN KEY (login_id) REFERENCES tb_login_account(login_id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES tb_role(role_id) ON DELETE CASCADE
);
```

### 3.7 tb_menu (메뉴)

```sql
CREATE TABLE tb_menu (
    menu_id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    parent_menu_id BIGINT,                             -- 상위 메뉴
    menu_code VARCHAR(50),
    menu_nm VARCHAR(100) NOT NULL,
    menu_url VARCHAR(500),
    menu_order INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    use_at CHAR(1) DEFAULT 'Y',

    FOREIGN KEY (tenant_id) REFERENCES tb_tenant(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (parent_menu_id) REFERENCES tb_menu(menu_id) ON DELETE CASCADE,
    INDEX idx_tenant_menu (tenant_id, parent_menu_id)
);
```

### 3.8 tb_role_menu_permission (역할-메뉴 권한)

```sql
CREATE TABLE tb_role_menu_permission (
    role_menu_permission_id BIGSERIAL PRIMARY KEY,
    role_id BIGINT NOT NULL,
    menu_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_role_menu (role_id, menu_id),
    FOREIGN KEY (role_id) REFERENCES tb_role(role_id) ON DELETE CASCADE,
    FOREIGN KEY (menu_id) REFERENCES tb_menu(menu_id) ON DELETE CASCADE
);
```

---

## 4. 로그인 플로우

### 4.1 요청-응답 흐름

```
1. 사용자 브라우저
   GET https://haccp-cloud/f1soft.co.kr/login
   ↓
2. 서버 필터 (TenantContextFilter)
   ├─ URL 파싱: /f1soft.co.kr/login → "f1soft.co.kr" 추출
   ├─ Query: SELECT * FROM tb_tenant
   │         WHERE admin_email LIKE '%@f1soft.co.kr%'
   ├─ 결과: tenant_id=1, tenant_nm="F1Soft", logo_image="data:image/png;base64,..."
   ├─ TenantContext 설정: TenantContextHolder.setTenantId(1)
   └─ Response: LoginPage (로고 + 입력필드 표시)
   ↓
3. 사용자 입력 → 로그인 요청
   POST /auth/login-jwt
   {
     "id": "socra710",
     "password": "myPassword"
   }
   (주의: tenantCode 필드 제거!)
   ↓
4. 서버 인증 로직 (LoginService)
   ├─ TenantContextHolder.getTenantId() → tenant_id = 1
   ├─ Query: SELECT * FROM tb_login_account
   │         WHERE tenant_id=1 AND login_code='socra710'
   ├─ 비밀번호 검증: BCryptPasswordEncoder.matches()
   ├─ 성공 시: JWT 토큰 생성
   │   Claims: {
   │     "sub": "socra710",
   │     "tenant_id": 1,
   │     "roles": ["ADMIN"]
   │   }
   └─ 응답: { "token": "eyJhbGciOiJIUzI1NiJ9...", "success": true }
   ↓
5. 사용자 저장 + 다음 페이지 이동
```

### 4.2 API 변경사항

#### Before (현재)

```http
POST /auth/login-jwt
Content-Type: application/json

{
  "id": "admin",
  "password": "password123",
  "tenantCode": "TENANT_001"
}

Response:
{
  "token": "eyJhbGc...",
  "tenantCode": "TENANT_001"
}
```

#### After (변경 후)

```http
POST /auth/login-jwt
Content-Type: application/json

{
  "id": "socra710",
  "password": "password123"
}

Response:
{
  "token": "eyJhbGc...",
  "tenantId": 1
}
```

**변경점:**

- `tenantCode` 필드 제거
- 서버에서 `TenantContextHolder`에서 tenantId 자동 추출
- Response에 `tenantId` 포함 (프론트에서 JWT decode하면 자동 획득)

---

## 5. 테넌트 라우팅 구현

### 5.1 TenantContextFilter (새 파일)

```java
@Component
public class TenantContextFilter extends OncePerRequestFilter {

    @Autowired private TenantService tenantService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain filterChain) throws ServletException, IOException {
        try {
            // 1. URL에서 테넌트 도메인 추출
            String requestUri = request.getRequestURI();  // /f1soft.co.kr/login
            String tenantDomain = extractTenantDomain(requestUri);

            if (tenantDomain != null) {
                // 2. 테넌트 조회
                Tenant tenant = tenantService.findByAdminEmailDomain(tenantDomain);

                if (tenant != null) {
                    // 3. TenantContext 설정
                    TenantContextHolder.setTenantId(tenant.getTenantId());

                    // 4. 로고 정보도 요청 속성에 저장 (View에서 사용)
                    request.setAttribute("tenantLogo", tenant.getLogoImage());
                    request.setAttribute("tenantName", tenant.getTenantNm());
                }
            }

            filterChain.doFilter(request, response);
        } finally {
            TenantContextHolder.clear();
        }
    }

    private String extractTenantDomain(String requestUri) {
        // requestUri: /f1soft.co.kr/login
        // return: f1soft.co.kr
        String[] parts = requestUri.split("/");
        if (parts.length > 1 && parts[1].contains(".")) {
            return parts[1];
        }
        return null;
    }
}
```

### 5.2 TenantContextHolder (테넌트 컨텍스트)

```java
public class TenantContextHolder {
    private static final ThreadLocal<Long> tenantIdHolder = new ThreadLocal<>();

    public static void setTenantId(Long tenantId) {
        tenantIdHolder.set(tenantId);
    }

    public static Long getTenantId() {
        return tenantIdHolder.get();
    }

    public static void clear() {
        tenantIdHolder.remove();
    }
}
```

### 5.3 TenantService

```java
public interface TenantService {
    /**
     * admin_email에서 도메인 부분 추출 후 테넌트 조회
     * 예: socra710@f1soft.co.kr → f1soft.co.kr → 해당 테넌트 반환
     */
    Tenant findByAdminEmailDomain(String domain);

    Tenant findById(Long tenantId);
}

@Service
@Transactional
public class TenantServiceImpl implements TenantService {

    @Autowired private TenantRepository tenantRepository;

    @Override
    public Tenant findByAdminEmailDomain(String domain) {
        // SQL: SELECT * FROM tb_tenant
        //      WHERE use_at='Y' AND admin_email LIKE CONCAT('%@', ?)
        return tenantRepository.findByAdminEmailDomain(domain);
    }
}
```

---

## 6. 로그인 페이지 (프론트엔드)

### 6.1 LoginPage.tsx 변경

```typescript
// Before: tenantCode 입력 필드 있음
// After: tenantCode 제거, 회사 로고 표시

export const LoginPage: React.FC = () => {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // URL에서 테넌트 정보 추출
  const path = window.location.pathname;  // /f1soft.co.kr/login
  const tenantDomain = extractTenantDomain(path);

  // 테넌트 정보 조회 (로고 등)
  const { data: tenantInfo } = useQuery(['tenant', tenantDomain], () =>
    fetch(`/api/tenants/${tenantDomain}`).then(r => r.json())
  );

  const loginMutation = useMutation(
    (credentials: { id: string; password: string }) =>
      fetch('/auth/login-jwt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      }).then(r => r.json()),
    {
      onSuccess: (data) => {
        localStorage.setItem('token', data.token);
        window.location.href = '/dashboard';
      },
      onError: (error: any) => {
        setError(error.response?.data?.message || '로그인 실패');
      }
    }
  );

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

      <form onSubmit={(e) => {
        e.preventDefault();
        loginMutation.mutate({ id, password });
      }}>
        <input
          type="text"
          placeholder="사용자 ID (이메일 로컬 부분)"
          value={id}
          onChange={(e) => setId(e.target.value)}
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <div className="error">{error}</div>}

        <button type="submit" disabled={loginMutation.isLoading}>
          로그인
        </button>
      </form>
    </div>
  );
};

function extractTenantDomain(path: string): string {
  // /f1soft.co.kr/login → f1soft.co.kr
  const parts = path.split('/');
  return parts[1] || '';
}
```

---

## 7. 에러 처리 및 유효성 검사

### 7.1 오류 시나리오

| 시나리오                   | HTTP 상태 | 에러 코드             | 메시지                                       |
| -------------------------- | --------- | --------------------- | -------------------------------------------- |
| 유효하지 않은 도메인 (URL) | 400       | INVALID_TENANT_DOMAIN | "존재하지 않는 회사입니다"                   |
| 테넌트 미활성화            | 403       | TENANT_SUSPENDED      | "서비스 이용 불가능한 회사입니다"            |
| 계정 없음                  | 401       | ACCOUNT_NOT_FOUND     | "계정 정보가 없습니다"                       |
| 비밀번호 오류              | 401       | INVALID_PASSWORD      | "비밀번호가 틀렸습니다"                      |
| 계정 잠금                  | 401       | ACCOUNT_LOCKED        | "계정이 잠겨있습니다. 관리자에게 문의하세요" |

### 7.2 유효성 검사

**서버:**

```java
// LoginService.actionLogin()
public LoginResponse actionLogin(LoginRequest request) {
    // 1. TenantContext에서 tenantId 확인
    Long tenantId = TenantContextHolder.getTenantId();
    if (tenantId == null) {
        throw new InvalidTenantException("INVALID_TENANT_DOMAIN");
    }

    // 2. 테넌트 활성화 확인
    Tenant tenant = tenantService.findById(tenantId);
    if (!"Y".equals(tenant.getUseAt())) {
        throw new TenantSuspendedException("TENANT_SUSPENDED");
    }

    // 3. 계정 조회
    LoginAccount account = loginAccountRepository
        .findByTenantIdAndLoginCode(tenantId, request.getId())
        .orElseThrow(() -> new AccountNotFoundException("ACCOUNT_NOT_FOUND"));

    // 4. 계정 잠금 확인
    if (account.getLockedAt() != null) {
        throw new AccountLockedException("ACCOUNT_LOCKED");
    }

    // 5. 비밀번호 검증
    if (!passwordEncoder.matches(request.getPassword(), account.getPasswordHash())) {
        // 실패 횟수 증가
        account.incrementLoginAttemptCount();
        if (account.getLoginAttemptCount() >= 5) {
            account.setLockedAt(LocalDateTime.now());
        }
        loginAccountRepository.save(account);
        throw new InvalidPasswordException("INVALID_PASSWORD");
    }

    // 6. 성공: 로그인 히스토리 기록 및 토큰 생성
    account.resetLoginAttemptCount();
    loginAccountRepository.save(account);

    String token = jwtTokenUtil.generateToken(account.getLoginCode(), tenantId);
    return new LoginResponse(token, tenantId);
}
```

---

## 8. 테넌트 온보딩 플로우

### 8.1 단계별 프로세스

```
Step 1: 플랫폼 관리자 → 업체 생성
  ├─ 회사명, admin_email(socra710@f1soft.co.kr), 사업자번호 입력
  ├─ tenantCode 자동 생성: TENANT_20260623_001
  └─ tb_tenant INSERT

Step 2: 온보딩 링크 이메일 발송
  └─ https://haccp-cloud/f1soft.co.kr/onboarding?token=xxx

Step 3: 업체 관리자 → 온보딩 완료
  ├─ 테넌트 정보 확인 (읽기만 가능)
  ├─ 관리자 계정 생성
  │   ├─ login_code="socra710" (admin_email local-part 추천)
  │   ├─ password 입력 및 BCrypt 해시
  │   └─ tb_login_account INSERT
  ├─ 로고 이미지 업로드 (Base64 변환)
  │   └─ tb_tenant.logo_image UPDATE
  ├─ 권한/역할 초기화
  │   ├─ tb_authority INSERT (기본값: ADMIN, USER)
  │   ├─ tb_role INSERT (기본값: ADMIN_ROLE, USER_ROLE)
  │   └─ tb_login_account_role INSERT
  └─ onboarding_status = 'COMPLETED'

Step 4: 관리자 로그인
  └─ https://haccp-cloud/f1soft.co.kr/login
     ├─ ID 입력: socra710 (이메일에서 추출)
     ├─ 비밀번호 입력
     └─ 로그인 성공 → JWT 토큰 발급
```

### 8.2 테넌트 관리자가 받는 정보

온보딩 이메일 예시:

```
제목: F1Soft HACCP 온보딩 초대

안녕하세요 socra710@f1soft.co.kr님,

F1Soft가 HACCP 클라우드 시스템에 생성되었습니다.

아래 링크에서 온보딩을 완료해주세요:
https://haccp-cloud/f1soft.co.kr/onboarding?token=abc123def456

온보딩 페이지에서:
1. 회사 로고 업로드
2. 관리자 비밀번호 설정
3. 초기 메뉴/권한 확인

완료 후 로그인 페이지에서:
URL: https://haccp-cloud/f1soft.co.kr/login
ID: socra710
비밀번호: (설정하신 비밀번호)
```

---

## 9. 마이그레이션 전략

### 9.1 기존 데이터 처리

현재 테넌트가 이미 있는 경우:

```sql
-- 1. 기존 테이블 백업
CREATE TABLE tb_tenant_backup AS SELECT * FROM tb_tenant;

-- 2. 새 테이블 생성 (위 스키마 참조)
-- 3. 기존 데이터 마이그레이션 (데이터 변환 필요)
INSERT INTO tb_tenant (tenant_code, tenant_nm, admin_email, corporate_number, ...)
SELECT tenant_code, tenant_nm, admin_email, corporate_number, ...
FROM tb_tenant_backup;

-- 4. 새 필드 초기화
UPDATE tb_tenant SET logo_image = NULL;
UPDATE tb_tenant SET onboarding_status = 'COMPLETED' WHERE use_at = 'Y';

-- 5. 기존 로그인 계정 마이그레이션
INSERT INTO tb_login_account (tenant_id, login_code, password_hash, use_at)
SELECT t.tenant_id, la.login_code, la.password_hash, la.use_at
FROM tb_login_account_old la
JOIN tb_tenant t ON la.tenant_id = t.tenant_id;
```

### 9.2 마이그레이션 검증

```sql
-- 1. 행 수 확인
SELECT COUNT(*) FROM tb_tenant;  -- Before/After 비교
SELECT COUNT(*) FROM tb_login_account;  -- Before/After 비교

-- 2. 유니크 제약 확인
SELECT admin_email, COUNT(*)
FROM tb_tenant
GROUP BY admin_email
HAVING COUNT(*) > 1;  -- 중복 없어야 함

-- 3. 외래키 무결성
SELECT * FROM tb_login_account la
WHERE NOT EXISTS (
  SELECT 1 FROM tb_tenant t WHERE t.tenant_id = la.tenant_id
);  -- 결과 0행이어야 함
```

---

## 10. 테스트 전략

### 10.1 통합 테스트 (LoginFlow)

```java
@SpringBootTest
@AutoConfigureMockMvc
public class MultiTenantLoginIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private TenantRepository tenantRepository;
    @Autowired private LoginAccountRepository loginAccountRepository;

    @BeforeEach
    public void setUp() {
        // 테넌트 1 생성: f1soft.co.kr
        Tenant tenant1 = new Tenant();
        tenant1.setTenantCode("TENANT_001");
        tenant1.setTenantNm("F1Soft");
        tenant1.setAdminEmail("socra710@f1soft.co.kr");
        tenant1.setUseAt("Y");
        Tenant savedTenant1 = tenantRepository.save(tenant1);

        // 계정 1 생성
        LoginAccount account1 = new LoginAccount();
        account1.setTenantId(savedTenant1.getTenantId());
        account1.setLoginCode("socra710");
        account1.setPasswordHash(new BCryptPasswordEncoder().encode("password123"));
        account1.setUseAt("Y");
        loginAccountRepository.save(account1);

        // 테넌트 2 생성: another.co.kr
        Tenant tenant2 = new Tenant();
        tenant2.setTenantCode("TENANT_002");
        tenant2.setTenantNm("AnotherCo");
        tenant2.setAdminEmail("admin@another.co.kr");
        tenant2.setUseAt("Y");
        Tenant savedTenant2 = tenantRepository.save(tenant2);
    }

    @Test
    public void testLoginWithCorrectDomainAndCredentials() throws Exception {
        // /f1soft.co.kr 경로로 접속 → tenantId=1 설정
        mockMvc.perform(get("/f1soft.co.kr/login"))
            .andExpect(status().isOk());

        // 로그인 요청 (tenantCode 없음!)
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
            .andExpect(jsonPath("$.tenantId").value(1));
    }

    @Test
    public void testLoginWithWrongPassword() throws Exception {
        mockMvc.perform(get("/f1soft.co.kr/login"))
            .andExpect(status().isOk());

        mockMvc.perform(post("/auth/login-jwt")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "id": "socra710",
                  "password": "wrongPassword"
                }
            """))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.errorCode").value("INVALID_PASSWORD"));
    }

    @Test
    public void testLoginWithInvalidDomain() throws Exception {
        mockMvc.perform(get("/invalid.com/login"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errorCode").value("INVALID_TENANT_DOMAIN"));
    }
}
```

### 10.2 유닛 테스트 (TenantService)

```java
@ExtendWith(MockitoExtension.class)
public class TenantServiceImplTest {

    @Mock private TenantRepository tenantRepository;
    @InjectMocks private TenantServiceImpl tenantService;

    @Test
    public void testFindByAdminEmailDomain() {
        // Given
        Tenant tenant = new Tenant();
        tenant.setTenantId(1L);
        tenant.setAdminEmail("socra710@f1soft.co.kr");

        when(tenantRepository.findByAdminEmailDomain("f1soft.co.kr"))
            .thenReturn(Optional.of(tenant));

        // When
        Tenant result = tenantService.findByAdminEmailDomain("f1soft.co.kr");

        // Then
        assertThat(result.getTenantId()).isEqualTo(1L);
    }
}
```

---

## 11. 구현 일정

| 작업                       | 예상 기간  | 담당  |
| -------------------------- | ---------- | ----- |
| 데이터베이스 마이그레이션  | 1-2일      | BE    |
| TenantContextFilter 구현   | 1일        | BE    |
| LoginService 리팩토링      | 1-2일      | BE    |
| API 수정 (tenantCode 제거) | 1일        | BE    |
| 프론트엔드 LoginPage 수정  | 1-2일      | FE    |
| 통합 테스트 작성           | 1-2일      | QA/BE |
| 온보딩 페이지 수정         | 1-2일      | FE    |
| 전체 통합 테스트 및 QA     | 2-3일      | QA    |
| **총 기간**                | **9-15일** | -     |

---

## 12. 위험 및 대응

| 위험                     | 영향도 | 대응 방안                                                    |
| ------------------------ | ------ | ------------------------------------------------------------ |
| 기존 데이터 손실         | 높음   | 마이그레이션 전 완전 백업, 검증 쿼리 실행                    |
| 서브도메인 요구사항 변경 | 중간   | 현재는 Path 기반이지만, 향후 nginx/reverse proxy로 전환 가능 |
| Base64 이미지 크기 증가  | 낮음   | 로고는 일반적으로 100KB 이하, 필요시 압축 또는 CDN 전환      |
| 테넌트 도메인 중복       | 중간   | admin_email 유니크 제약으로 방지                             |

---

## 13. 향후 개선사항

- [ ] 커스텀 도메인 지원 (예: www.f1soft.co.kr, f1soft.haccp.com 모두 가능)
- [ ] 테넌트별 브랜딩 (색상 테마, 공지사항)
- [ ] SSO 통합 (OAuth, SAML)
- [ ] 이미지 CDN 통합
- [ ] 계정 잠금 풀기 UI (관리자)
- [ ] 비밀번호 변경 정책 (주기적 변경, 복잡도)

---

## 14. 검토 및 승인

| 항목        | 상태       | 검토자 | 승인일 |
| ----------- | ---------- | ------ | ------ |
| 기술 설계   | ⏳ 검토 중 | -      | -      |
| 데이터 모델 | ⏳ 검토 중 | -      | -      |
| 구현 계획   | ⏳ 대기 중 | -      | -      |
| 보안 검토   | ⏳ 대기 중 | -      | -      |

---

**문서 버전**: 1.0  
**최종 수정**: 2026-06-23  
**다음 단계**: 사용자 리뷰 → 구현 계획 문서 작성
