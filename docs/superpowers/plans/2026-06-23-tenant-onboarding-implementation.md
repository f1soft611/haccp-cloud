# 업체 온보딩 이메일 인증 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 업체 등록 후 관리자 이메일 인증을 통한 온보딩 프로세스 구현

**Architecture:**

- 온보딩 상태를 `tb_tenant.onboarding_status`(업체 레벨)와 `tb_login_account.onboarding_status`(계정 레벨)로 분리
- 이메일 인증 토큰을 `tb_tenant_auth_token` 테이블에서 독립 관리
- 기존 권한/사용자 시스템(`tb_user`, `tb_login_account`) 활용, 온보딩 완료 시 `use_at='Y'` 로 활성화

**Tech Stack:** Spring Boot, JPA/MyBatis, PostgreSQL/MySQL, Java 11+

---

## 📁 파일 구조

### 생성 파일

- `backend/src/main/java/egovframework/let/platforms/tenants/domain/model/TenantAuthTokenVO.java` - 토큰 VO
- `backend/src/main/java/egovframework/let/platforms/tenants/domain/model/TenantVerificationResponseVO.java` - 검증 응답 VO
- `backend/src/main/java/egovframework/let/platforms/tenants/domain/model/TenantOnboardingCompleteRequestVO.java` - 완료 요청 VO
- `backend/src/main/java/egovframework/let/platforms/tenants/domain/repository/TenantAuthTokenDAO.java` - 토큰 DAO 인터페이스
- `backend/src/main/java/egovframework/let/platforms/tenants/domain/repository/impl/TenantAuthTokenJdbcDAO.java` - 토큰 DAO 구현
- `backend/src/main/java/egovframework/let/platforms/tenants/service/OnboardingEmailService.java` - 이메일 발송 서비스 인터페이스
- `backend/src/main/java/egovframework/let/platforms/tenants/service/impl/OnboardingEmailServiceImpl.java` - 이메일 발송 구현
- `backend/src/main/java/egovframework/let/platforms/tenants/service/impl/TenantAuthTokenGenerator.java` - 토큰 생성 유틸
- `backend/src/main/resources/egovframework/mapper/let/platforms/tenants/TenantAuthToken_SQL_postgresql.xml` - PostgreSQL 쿼리
- `backend/src/main/resources/egovframework/mapper/let/platforms/tenants/TenantAuthToken_SQL_mysql.xml` - MySQL 쿼리

### 수정 파일

- `backend/src/main/java/egovframework/let/platforms/tenants/service/PlatformTenantService.java` - 인터페이스 메서드 추가
- `backend/src/main/java/egovframework/let/platforms/tenants/service/impl/PlatformTenantServiceImpl.java` - 구현 메서드 추가
- `backend/src/main/java/egovframework/let/platforms/tenants/controller/PlatformTenantApiController.java` - API 엔드포인트 추가

### 테스트 파일

- `backend/src/test/java/egovframework/let/platforms/tenants/service/impl/TenantAuthTokenGeneratorTest.java`
- `backend/src/test/java/egovframework/let/platforms/tenants/service/impl/PlatformTenantOnboardingServiceTest.java`

---

## 📋 구현 태스크

### Task 1: 데이터베이스 마이그레이션 실행

**Files:**

- Execute: `backend/DATABASE/migrations/2026-06-23_add_onboarding_support_tables_postgresql.sql`
- Execute: `backend/DATABASE/migrations/2026-06-23_add_onboarding_support_tables_mssql.sql`

- [ ] **Step 1: PostgreSQL 마이그레이션 실행**

```bash
psql -U postgres -d haccp_cloud -f backend/DATABASE/migrations/2026-06-23_add_onboarding_support_tables_postgresql.sql
```

Expected output: 마이그레이션 성공, 테이블 및 인덱스 생성됨

- [ ] **Step 2: 테이블 생성 확인**

```bash
psql -U postgres -d haccp_cloud -c "\dt tb_tenant_auth_token"
```

Expected: `tb_tenant_auth_token` 테이블이 조회됨

- [ ] **Step 3: 컬럼 확인**

```bash
psql -U postgres -d haccp_cloud -c "\d tb_login_account" | grep onboarding_status
```

Expected: `onboarding_status` 컬럼 확인됨

---

### Task 2: 토큰 VO 클래스 생성

**Files:**

- Create: `backend/src/main/java/egovframework/let/platforms/tenants/domain/model/TenantAuthTokenVO.java`

- [ ] **Step 1: TenantAuthTokenVO 클래스 생성**

```java
package egovframework.let.platforms.tenants.domain.model;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 테넌트 인증 토큰 VO
 */
@Getter
@Setter
@Builder
@AllArgsConstructor
public class TenantAuthTokenVO {

    @Schema(description = "토큰 ID")
    private Long authTokenId;

    @Schema(description = "테넌트 ID")
    private Long tenantId;

    @Schema(description = "로그인 계정 ID")
    private Long loginAccountId;

    @Schema(description = "테넌트 코드")
    private String tenantCode;

    @Schema(description = "인증 토큰", required = true)
    private String authToken;

    @Schema(description = "토큰 타입", example = "EMAIL_VERIFICATION")
    private String tokenType;

    @Schema(description = "만료 시간")
    private LocalDateTime expiresAt;

    @Schema(description = "토큰 사용 시간")
    private LocalDateTime usedAt;

    @Schema(description = "생성 시간")
    private LocalDateTime createdAt;

    public TenantAuthTokenVO() {}

    /**
     * 토큰이 유효한지 확인
     * @return 토큰이 유효하고 미사용 상태면 true
     */
    public boolean isValid() {
        return expiresAt.isAfter(LocalDateTime.now()) && usedAt == null;
    }
}
```

- [ ] **Step 2: 클래스 컴파일 확인**

```bash
cd backend
mvn clean compile
```

Expected: BUILD SUCCESS

---

### Task 3: 검증 응답 VO 클래스 생성

**Files:**

- Create: `backend/src/main/java/egovframework/let/platforms/tenants/domain/model/TenantVerificationResponseVO.java`

- [ ] **Step 1: TenantVerificationResponseVO 클래스 생성**

```java
package egovframework.let.platforms.tenants.domain.model;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 테넌트 이메일 토큰 검증 응답 VO
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantVerificationResponseVO {

    @Schema(description = "테넌트 코드")
    private String tenantCode;

    @Schema(description = "테넌트명")
    private String tenantNm;

    @Schema(description = "관리자 이메일")
    private String adminEmail;

    @Schema(description = "로그인 계정 ID")
    private Long loginAccountId;

    @Schema(description = "검증 성공 여부")
    private boolean verified;

    @Schema(description = "메시지")
    private String message;
}
```

- [ ] **Step 2: 클래스 컴파일 확인**

```bash
mvn clean compile
```

Expected: BUILD SUCCESS

---

### Task 4: 온보딩 완료 요청 VO 클래스 생성

**Files:**

- Create: `backend/src/main/java/egovframework/let/platforms/tenants/domain/model/TenantOnboardingCompleteRequestVO.java`

- [ ] **Step 1: TenantOnboardingCompleteRequestVO 클래스 생성**

```java
package egovframework.let.platforms.tenants.domain.model;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 테넌트 온보딩 완료 요청 VO
 */
@Getter
@Setter
public class TenantOnboardingCompleteRequestVO {

    @Schema(description = "테넌트 코드", required = true)
    private String tenantCode;

    @Schema(description = "인증 토큰", required = true)
    private String authToken;

    @Schema(description = "비밀번호", required = true)
    private String password;

    @Schema(description = "전화번호")
    private String phoneNumber;
}
```

- [ ] **Step 2: 클래스 컴파일 확인**

```bash
mvn clean compile
```

Expected: BUILD SUCCESS

---

### Task 5: 토큰 DAO 인터페이스 생성

**Files:**

- Create: `backend/src/main/java/egovframework/let/platforms/tenants/domain/repository/TenantAuthTokenDAO.java`

- [ ] **Step 1: TenantAuthTokenDAO 인터페이스 생성**

```java
package egovframework.let.platforms.tenants.domain.repository;

import egovframework.let.platforms.tenants.domain.model.TenantAuthTokenVO;

/**
 * 테넌트 인증 토큰 DAO
 */
public interface TenantAuthTokenDAO {

    /**
     * 토큰 저장
     */
    void insertToken(TenantAuthTokenVO vo);

    /**
     * 토큰으로 조회
     */
    TenantAuthTokenVO selectTokenByValue(String authToken);

    /**
     * 토큰 사용 표시
     */
    void markTokenAsUsed(String authToken);

    /**
     * 테넌트의 미사용 토큰 조회
     */
    TenantAuthTokenVO selectActiveTokenByTenantCode(String tenantCode);

    /**
     * 테넌트의 이전 토큰 만료 처리
     */
    void expireTokensByTenantCode(String tenantCode);
}
```

- [ ] **Step 2: 인터페이스 컴파일 확인**

```bash
mvn clean compile
```

Expected: BUILD SUCCESS

---

### Task 6: 토큰 생성 유틸 클래스 생성

**Files:**

- Create: `backend/src/main/java/egovframework/let/platforms/tenants/service/impl/TenantAuthTokenGenerator.java`

- [ ] **Step 1: TenantAuthTokenGenerator 클래스 생성**

```java
package egovframework.let.platforms.tenants.service.impl;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 테넌트 인증 토큰 생성 유틸
 */
public class TenantAuthTokenGenerator {

    private static final SecureRandom random = new SecureRandom();

    /**
     * 인증 토큰 생성
     * 형식: 6자 숫자 + '-' + UUID
     * 예: 123456-550e8400-e29b-41d4-a716-446655440000
     * @return 생성된 토큰
     */
    public static String generateToken() {
        String randomSix = String.format("%06d", random.nextInt(1000000));
        String uuid = UUID.randomUUID().toString();
        return randomSix + "-" + uuid;
    }

    /**
     * 토큰 만료 시간 계산
     * @param hours 유효 시간 (일반적으로 24)
     * @return 만료 시간
     */
    public static LocalDateTime calculateExpiry(int hours) {
        return LocalDateTime.now().plusHours(hours);
    }

    /**
     * 토큰 만료 시간 계산 (기본값 24시간)
     * @return 만료 시간
     */
    public static LocalDateTime calculateExpiry() {
        return calculateExpiry(24);
    }

    /**
     * 토큰이 만료되었는지 확인
     * @param expiresAt 만료 시간
     * @return 만료되었으면 true
     */
    public static boolean isExpired(LocalDateTime expiresAt) {
        return LocalDateTime.now().isAfter(expiresAt);
    }
}
```

- [ ] **Step 2: 클래스 컴파일 확인**

```bash
mvn clean compile
```

Expected: BUILD SUCCESS

---

### Task 7: 토큰 생성 유틸 단위 테스트 작성

**Files:**

- Create: `backend/src/test/java/egovframework/let/platforms/tenants/service/impl/TenantAuthTokenGeneratorTest.java`

- [ ] **Step 1: 단위 테스트 작성**

```java
package egovframework.let.platforms.tenants.service.impl;

import org.junit.jupiter.api.Test;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class TenantAuthTokenGeneratorTest {

    @Test
    void generateToken_returnsValidFormat() {
        String token = TenantAuthTokenGenerator.generateToken();

        // 형식: 6자-UUID
        assertTrue(token.matches("\\d{6}-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"));
        assertEquals(47, token.length());
    }

    @Test
    void generateToken_returnsUniqueTokens() {
        String token1 = TenantAuthTokenGenerator.generateToken();
        String token2 = TenantAuthTokenGenerator.generateToken();

        assertNotEquals(token1, token2);
    }

    @Test
    void calculateExpiry_returns24HoursLater() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiry = TenantAuthTokenGenerator.calculateExpiry();

        assertTrue(expiry.isAfter(now.plusHours(23)));
        assertTrue(expiry.isBefore(now.plusHours(24).plusMinutes(1)));
    }

    @Test
    void isExpired_returnsTrueForPastTime() {
        LocalDateTime pastTime = LocalDateTime.now().minusHours(1);

        assertTrue(TenantAuthTokenGenerator.isExpired(pastTime));
    }

    @Test
    void isExpired_returnsFalseForFutureTime() {
        LocalDateTime futureTime = LocalDateTime.now().plusHours(1);

        assertFalse(TenantAuthTokenGenerator.isExpired(futureTime));
    }
}
```

- [ ] **Step 2: 테스트 실행**

```bash
mvn test -Dtest=TenantAuthTokenGeneratorTest
```

Expected: 5 tests passed

---

### Task 8: 토큰 DAO JDBC 구현 생성

**Files:**

- Create: `backend/src/main/java/egovframework/let/platforms/tenants/domain/repository/impl/TenantAuthTokenJdbcDAO.java`

- [ ] **Step 1: TenantAuthTokenJdbcDAO 구현 생성**

```java
package egovframework.let.platforms.tenants.domain.repository.impl;

import egovframework.let.platforms.tenants.domain.model.TenantAuthTokenVO;
import egovframework.let.platforms.tenants.domain.repository.TenantAuthTokenDAO;
import org.egovframe.rte.fdl.cmmn.EgovAbstractDAO;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

/**
 * 테넌트 인증 토큰 JDBC DAO
 */
@Repository("tenantAuthTokenDAO")
public class TenantAuthTokenJdbcDAO extends EgovAbstractDAO implements TenantAuthTokenDAO {

    /**
     * 토큰 저장
     */
    @Override
    public void insertToken(TenantAuthTokenVO vo) {
        insert("tenantAuthToken.insertToken", vo);
    }

    /**
     * 토큰으로 조회
     */
    @Override
    public TenantAuthTokenVO selectTokenByValue(String authToken) {
        return (TenantAuthTokenVO) selectOne("tenantAuthToken.selectTokenByValue", authToken);
    }

    /**
     * 토큰 사용 표시
     */
    @Override
    public void markTokenAsUsed(String authToken) {
        LocalDateTime now = LocalDateTime.now();
        update("tenantAuthToken.markTokenAsUsed", Map.of(
            "authToken", authToken,
            "usedAt", now
        ));
    }

    /**
     * 테넌트의 미사용 토큰 조회
     */
    @Override
    public TenantAuthTokenVO selectActiveTokenByTenantCode(String tenantCode) {
        return (TenantAuthTokenVO) selectOne("tenantAuthToken.selectActiveTokenByTenantCode", tenantCode);
    }

    /**
     * 테넌트의 이전 토큰 만료 처리
     */
    @Override
    public void expireTokensByTenantCode(String tenantCode) {
        update("tenantAuthToken.expireTokensByTenantCode", tenantCode);
    }
}
```

(참고: `import java.util.Map;` 추가 필요)

- [ ] **Step 2: 클래스 컴파일 확인**

```bash
mvn clean compile
```

Expected: BUILD SUCCESS

---

### Task 9: PostgreSQL 쿼리 매퍼 생성

**Files:**

- Create: `backend/src/main/resources/egovframework/mapper/let/platforms/tenants/TenantAuthToken_SQL_postgresql.xml`

- [ ] **Step 1: 쿼리 매퍼 생성**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
    "http://mybatis.org/dtd/mybatis-3-mapper.dtd">

<mapper namespace="tenantAuthToken">

    <!-- 토큰 삽입 -->
    <insert id="insertToken" parameterType="egovframework.let.platforms.tenants.domain.model.TenantAuthTokenVO">
        INSERT INTO tb_tenant_auth_token (
            tenant_id,
            login_account_id,
            tenant_code,
            auth_token,
            token_type,
            expires_at,
            created_at
        ) VALUES (
            #{tenantId},
            #{loginAccountId},
            #{tenantCode},
            #{authToken},
            #{tokenType},
            #{expiresAt},
            now()
        )
    </insert>

    <!-- 토큰으로 조회 -->
    <select id="selectTokenByValue" parameterType="java.lang.String"
            resultType="egovframework.let.platforms.tenants.domain.model.TenantAuthTokenVO">
        SELECT
            auth_token_id as authTokenId,
            tenant_id as tenantId,
            login_account_id as loginAccountId,
            tenant_code as tenantCode,
            auth_token as authToken,
            token_type as tokenType,
            expires_at as expiresAt,
            used_at as usedAt,
            created_at as createdAt
        FROM tb_tenant_auth_token
        WHERE auth_token = #{value}
        LIMIT 1
    </select>

    <!-- 토큰 사용 표시 -->
    <update id="markTokenAsUsed" parameterType="java.util.Map">
        UPDATE tb_tenant_auth_token
        SET used_at = #{usedAt}
        WHERE auth_token = #{authToken}
    </update>

    <!-- 테넌트의 미사용 토큰 조회 -->
    <select id="selectActiveTokenByTenantCode" parameterType="java.lang.String"
            resultType="egovframework.let.platforms.tenants.domain.model.TenantAuthTokenVO">
        SELECT
            auth_token_id as authTokenId,
            tenant_id as tenantId,
            login_account_id as loginAccountId,
            tenant_code as tenantCode,
            auth_token as authToken,
            token_type as tokenType,
            expires_at as expiresAt,
            used_at as usedAt,
            created_at as createdAt
        FROM tb_tenant_auth_token
        WHERE tenant_code = #{value}
          AND used_at IS NULL
          AND expires_at > now()
        ORDER BY created_at DESC
        LIMIT 1
    </select>

    <!-- 테넌트의 이전 토큰 만료 처리 -->
    <update id="expireTokensByTenantCode" parameterType="java.lang.String">
        UPDATE tb_tenant_auth_token
        SET expires_at = now()
        WHERE tenant_code = #{value}
          AND used_at IS NULL
    </update>

</mapper>
```

- [ ] **Step 2: 파일 저장 확인**

```bash
ls -la backend/src/main/resources/egovframework/mapper/let/platforms/tenants/
```

Expected: `TenantAuthToken_SQL_postgresql.xml` 파일 존재

---

### Task 10: 이메일 발송 서비스 인터페이스 생성

**Files:**

- Create: `backend/src/main/java/egovframework/let/platforms/tenants/service/OnboardingEmailService.java`

- [ ] **Step 1: OnboardingEmailService 인터페이스 생성**

```java
package egovframework.let.platforms.tenants.service;

/**
 * 온보딩 이메일 발송 서비스
 */
public interface OnboardingEmailService {

    /**
     * 인증 이메일 발송
     * @param adminEmail 관리자 이메일
     * @param tenantNm 테넌트명
     * @param adminName 관리자명
     * @param verificationLink 인증 링크
     */
    void sendVerificationEmail(String adminEmail, String tenantNm, String adminName, String verificationLink);
}
```

- [ ] **Step 2: 인터페이스 컴파일 확인**

```bash
mvn clean compile
```

Expected: BUILD SUCCESS

---

### Task 11: 이메일 발송 서비스 구현 생성

**Files:**

- Create: `backend/src/main/java/egovframework/let/platforms/tenants/service/impl/OnboardingEmailServiceImpl.java`

- [ ] **Step 1: OnboardingEmailServiceImpl 구현 생성**

```java
package egovframework.let.platforms.tenants.service.impl;

import egovframework.let.platforms.tenants.service.OnboardingEmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * 온보딩 이메일 발송 서비스 구현
 */
@Service("onboardingEmailService")
public class OnboardingEmailServiceImpl implements OnboardingEmailService {

    private static final Logger logger = LoggerFactory.getLogger(OnboardingEmailServiceImpl.class);

    private final JavaMailSender mailSender;

    @Value("${mail.from:noreply@haccp-cloud.local}")
    private String fromEmail;

    @Value("${app.onboarding.url:https://haccp-cloud.local/onboarding}")
    private String onboardingBaseUrl;

    public OnboardingEmailServiceImpl(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public void sendVerificationEmail(String adminEmail, String tenantNm, String adminName, String verificationLink) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(adminEmail);
            message.setSubject("[HACCP Cloud] 온보딩 인증 요청");

            String fullLink = onboardingBaseUrl + "?token=" + verificationLink;
            String body = String.format(
                """
                %s님 안녕하세요.

                업체명: %s

                아래 링크를 클릭하여 이메일을 인증하세요. 링크는 24시간 동안 유효합니다.

                인증 링크: %s

                감사합니다.
                HACCP Cloud 팀
                """,
                adminName, tenantNm, fullLink
            );

            message.setText(body);
            mailSender.send(message);
            logger.info("온보딩 이메일 발송 성공: {}", adminEmail);
        } catch (Exception e) {
            logger.error("온보딩 이메일 발송 실패: {}", adminEmail, e);
            throw new RuntimeException("이메일 발송에 실패했습니다.", e);
        }
    }
}
```

- [ ] **Step 2: 클래스 컴파일 확인**

```bash
mvn clean compile
```

Expected: BUILD SUCCESS

---

### Task 12: PlatformTenantService 인터페이스 확장

**Files:**

- Modify: `backend/src/main/java/egovframework/let/platforms/tenants/service/PlatformTenantService.java`

- [ ] **Step 1: 인터페이스에 새 메서드 추가**

```java
// 기존 메서드들 아래에 추가

/**
 * 온보딩 이메일 발송
 * @param tenantCode 테넌트 코드
 */
void sendOnboardingEmail(String tenantCode);

/**
 * 온보딩 이메일 재발송
 * @param tenantCode 테넌트 코드
 */
void resendOnboardingEmail(String tenantCode);

/**
 * 인증 토큰 검증
 * @param authToken 인증 토큰
 * @return 검증 응답
 */
TenantVerificationResponseVO verifyAuthToken(String authToken);

/**
 * 온보딩 완료
 * @param requestVO 요청 VO
 */
void completeOnboarding(TenantOnboardingCompleteRequestVO requestVO);
```

- [ ] **Step 2: 인터페이스 컴파일 확인**

```bash
mvn clean compile
```

Expected: BUILD SUCCESS

---

### Task 13: PlatformTenantServiceImpl 구현 확장 - sendOnboardingEmail

**Files:**

- Modify: `backend/src/main/java/egovframework/let/platforms/tenants/service/impl/PlatformTenantServiceImpl.java`

- [ ] **Step 1: 의존성 주입 추가**

클래스 최상단의 `@Autowired` 필드들 아래에 추가:

```java
@Resource(name = "tenantAuthTokenDAO")
private TenantAuthTokenDAO tenantAuthTokenDAO;

@Resource(name = "onboardingEmailService")
private OnboardingEmailService onboardingEmailService;
```

- [ ] **Step 2: sendOnboardingEmail 메서드 구현**

메서드를 클래스에 추가:

```java
@Override
public void sendOnboardingEmail(String tenantCode) {
    // 1. 테넌트 조회
    TenantVO tenant = tenantInfoDAO.selectTenantByCode(tenantCode);
    if (tenant == null) {
        throw new IllegalArgumentException("테넌트를 찾을 수 없습니다: " + tenantCode);
    }

    // 2. 로그인 계정 조회 (관리자)
    TenantLoginAccountVO loginAccount = loginAccountDAO.selectByTenantIdForAdmin(tenant.getTenantId());
    if (loginAccount == null) {
        throw new IllegalArgumentException("관리자 계정을 찾을 수 없습니다: " + tenantCode);
    }

    // 3. 이전 토큰 만료 처리
    tenantAuthTokenDAO.expireTokensByTenantCode(tenantCode);

    // 4. 새 토큰 생성
    String authToken = TenantAuthTokenGenerator.generateToken();
    LocalDateTime expiresAt = TenantAuthTokenGenerator.calculateExpiry();

    TenantAuthTokenVO tokenVO = TenantAuthTokenVO.builder()
        .tenantId(tenant.getTenantId())
        .loginAccountId(loginAccount.getLoginAccountId())
        .tenantCode(tenantCode)
        .authToken(authToken)
        .tokenType("EMAIL_VERIFICATION")
        .expiresAt(expiresAt)
        .build();

    tenantAuthTokenDAO.insertToken(tokenVO);

    // 5. 이메일 발송
    try {
        onboardingEmailService.sendVerificationEmail(
            tenant.getAdminEmail(),
            tenant.getTenantNm(),
            loginAccount.getUserName(),
            authToken
        );
        logger.info("온보딩 이메일 발송 완료: {}", tenantCode);
    } catch (Exception e) {
        logger.error("온보딩 이메일 발송 실패: {}", tenantCode, e);
        throw e;
    }

    // 6. 테넌트 상태 업데이트
    updateOnboardingStatusByTenantCode(tenantCode, "EMAIL_SENT");
}
```

- [ ] **Step 3: 메서드 컴파일 확인**

```bash
mvn clean compile
```

Expected: BUILD SUCCESS

---

### Task 14: PlatformTenantServiceImpl 구현 확장 - resendOnboardingEmail

**Files:**

- Modify: `backend/src/main/java/egovframework/let/platforms/tenants/service/impl/PlatformTenantServiceImpl.java`

- [ ] **Step 1: resendOnboardingEmail 메서드 구현**

메서드를 클래스에 추가:

```java
@Override
public void resendOnboardingEmail(String tenantCode) {
    // sendOnboardingEmail과 동일하게 처리
    // 기존 토큰은 만료되고 새 토큰이 생성됨
    sendOnboardingEmail(tenantCode);
}
```

- [ ] **Step 2: 메서드 컴파일 확인**

```bash
mvn clean compile
```

Expected: BUILD SUCCESS

---

### Task 15: PlatformTenantServiceImpl 구현 확장 - verifyAuthToken

**Files:**

- Modify: `backend/src/main/java/egovframework/let/platforms/tenants/service/impl/PlatformTenantServiceImpl.java`

- [ ] **Step 1: verifyAuthToken 메서드 구현**

메서드를 클래스에 추가:

```java
@Override
public TenantVerificationResponseVO verifyAuthToken(String authToken) {
    // 1. 토큰 조회
    TenantAuthTokenVO tokenVO = tenantAuthTokenDAO.selectTokenByValue(authToken);
    if (tokenVO == null) {
        return TenantVerificationResponseVO.builder()
            .verified(false)
            .message("유효하지 않은 토큰입니다.")
            .build();
    }

    // 2. 토큰 유효성 확인
    if (!tokenVO.isValid()) {
        return TenantVerificationResponseVO.builder()
            .verified(false)
            .message("토큰이 만료되었습니다.")
            .build();
    }

    // 3. 테넌트 정보 조회
    TenantVO tenant = tenantInfoDAO.selectTenantById(tokenVO.getTenantId());
    if (tenant == null) {
        return TenantVerificationResponseVO.builder()
            .verified(false)
            .message("테넌트를 찾을 수 없습니다.")
            .build();
    }

    // 4. 토큰 사용 표시
    tenantAuthTokenDAO.markTokenAsUsed(authToken);

    // 5. 로그인 계정 상태 업데이트
    loginAccountDAO.updateOnboardingStatus(tokenVO.getLoginAccountId(), "EMAIL_VERIFIED");

    logger.info("토큰 검증 성공: {}", tenant.getTenantCode());

    // 6. 응답 반환
    return TenantVerificationResponseVO.builder()
        .tenantCode(tenant.getTenantCode())
        .tenantNm(tenant.getTenantNm())
        .adminEmail(tenant.getAdminEmail())
        .loginAccountId(tokenVO.getLoginAccountId())
        .verified(true)
        .message("이메일 인증이 완료되었습니다.")
        .build();
}
```

- [ ] **Step 2: 메서드 컴파일 확인**

```bash
mvn clean compile
```

Expected: BUILD SUCCESS

---

### Task 16: PlatformTenantServiceImpl 구현 확장 - completeOnboarding

**Files:**

- Modify: `backend/src/main/java/egovframework/let/platforms/tenants/service/impl/PlatformTenantServiceImpl.java`

- [ ] **Step 1: completeOnboarding 메서드 구현**

메서드를 클래스에 추가:

```java
@Override
public void completeOnboarding(TenantOnboardingCompleteRequestVO requestVO) {
    // 1. 테넌트 조회
    TenantVO tenant = tenantInfoDAO.selectByCode(requestVO.getTenantCode());
    if (tenant == null) {
        throw new IllegalArgumentException("테넌트를 찾을 수 없습니다.");
    }

    // 2. 토큰 검증 (중복 방지)
    TenantAuthTokenVO tokenVO = tenantAuthTokenDAO.selectTokenByValue(requestVO.getAuthToken());
    if (tokenVO == null || tokenVO.getUsedAt() == null) {
        throw new IllegalArgumentException("유효하지 않은 토큰입니다.");
    }

    // 3. 비밀번호 인코딩 (기존 로직에 맞춰서)
    String encodedPassword = encodePassword(requestVO.getPassword());

    // 4. 로그인 계정 업데이트
    TenantLoginAccountVO loginAccount = loginAccountDAO.selectById(tokenVO.getLoginAccountId());
    loginAccount.setPasswordHash(encodedPassword);
    loginAccount.setUseAt('Y');  // 계정 활성화
    loginAccountDAO.updateLoginAccount(loginAccount);

    // 5. tb_login_account.onboarding_status 업데이트
    loginAccountDAO.updateOnboardingStatus(
        tokenVO.getLoginAccountId(),
        "FIRST_SETUP_COMPLETED"
    );

    // 6. tb_tenant 상태 업데이트
    updateOnboardingStatusByTenantCode(requestVO.getTenantCode(), "ACTIVE");

    logger.info("온보딩 완료: {}", requestVO.getTenantCode());
}

/**
 * 비밀번호 인코딩 (기존 방식 따름)
 */
private String encodePassword(String password) {
    // 기존 코드베이스의 비밀번호 인코딩 방식 사용
    // 예: SHA256, bcrypt 등
    return PasswordUtil.encode(password);  // PasswordUtil은 기존 프로젝트의 유틸 사용
}
```

- [ ] **Step 2: 메서드 컴파일 확인**

```bash
mvn clean compile
```

Expected: BUILD SUCCESS

---

### Task 17: PlatformTenantApiController 확장 - 이메일 발송 API

**Files:**

- Modify: `backend/src/main/java/egovframework/let/platforms/tenants/controller/PlatformTenantApiController.java`

- [ ] **Step 1: 이메일 발송 API 엔드포인트 추가**

클래스에 다음 메서드를 추가:

```java
@PostMapping("/admin/tenants/{tenantCode}/send-verification-email")
@Operation(
    summary = "온보딩 이메일 발송",
    description = "테넌트에 온보딩 인증 이메일을 발송합니다.",
    security = {@SecurityRequirement(name = "Authorization")}
)
public ResultVO sendOnboardingEmail(
    @PathVariable String tenantCode
) {
    try {
        platformTenantService.sendOnboardingEmail(tenantCode);

        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("tenantCode", tenantCode);
        resultMap.put("message", "인증 이메일이 발송되었습니다.");
        resultMap.put("expiresIn", "24 hours");

        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    } catch (IllegalArgumentException e) {
        Map<String, Object> errorMap = new HashMap<>();
        errorMap.put("errorCode", "TENANT_NOT_FOUND");
        errorMap.put("message", e.getMessage());
        return resultVoHelper.buildFromMap(errorMap, ResponseCode.NOT_FOUND);
    }
}
```

- [ ] **Step 2: 이메일 재발송 API 엔드포인트 추가**

클래스에 다음 메서드를 추가:

```java
@PostMapping("/admin/tenants/{tenantCode}/resend-verification-email")
@Operation(
    summary = "온보딩 이메일 재발송",
    description = "테넌트에 온보딩 인증 이메일을 재발송합니다.",
    security = {@SecurityRequirement(name = "Authorization")}
)
public ResultVO resendOnboardingEmail(
    @PathVariable String tenantCode
) {
    try {
        platformTenantService.resendOnboardingEmail(tenantCode);

        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("tenantCode", tenantCode);
        resultMap.put("message", "인증 이메일이 재발송되었습니다.");

        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    } catch (IllegalArgumentException e) {
        Map<String, Object> errorMap = new HashMap<>();
        errorMap.put("errorCode", "TENANT_NOT_FOUND");
        errorMap.put("message", e.getMessage());
        return resultVoHelper.buildFromMap(errorMap, ResponseCode.NOT_FOUND);
    }
}
```

- [ ] **Step 3: 컨트롤러 컴파일 확인**

```bash
mvn clean compile
```

Expected: BUILD SUCCESS

---

### Task 18: PlatformTenantApiController 확장 - 토큰 검증 API

**Files:**

- Modify: `backend/src/main/java/egovframework/let/platforms/tenants/controller/PlatformTenantApiController.java`

- [ ] **Step 1: 토큰 검증 API 엔드포인트 추가**

클래스에 다음 메서드를 추가:

```java
@GetMapping("/tenants/verify-token")
@Operation(
    summary = "온보딩 토큰 검증",
    description = "이메일 링크에서 사용하는 토큰을 검증합니다."
)
public TenantVerificationResponseVO verifyToken(
    @RequestParam(name = "token") String authToken
) {
    return platformTenantService.verifyAuthToken(authToken);
}
```

- [ ] **Step 2: 컨트롤러 컴파일 확인**

```bash
mvn clean compile
```

Expected: BUILD SUCCESS

---

### Task 19: PlatformTenantApiController 확장 - 온보딩 완료 API

**Files:**

- Modify: `backend/src/main/java/egovframework/let/platforms/tenants/controller/PlatformTenantApiController.java`

- [ ] **Step 1: 온보딩 완료 API 엔드포인트 추가**

클래스에 다음 메서드를 추가:

```java
@PostMapping("/tenants/complete-onboarding")
@Operation(
    summary = "온보딩 완료",
    description = "비밀번호 및 기본정보를 설정하여 온보딩을 완료합니다."
)
public ResultVO completeOnboarding(
    @RequestBody TenantOnboardingCompleteRequestVO requestVO
) {
    try {
        platformTenantService.completeOnboarding(requestVO);

        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("success", true);
        resultMap.put("message", "온보딩이 완료되었습니다. 이제 로그인 가능합니다.");
        resultMap.put("tenantCode", requestVO.getTenantCode());
        resultMap.put("status", "ACTIVE");

        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    } catch (IllegalArgumentException e) {
        Map<String, Object> errorMap = new HashMap<>();
        errorMap.put("success", false);
        errorMap.put("errorCode", "INVALID_REQUEST");
        errorMap.put("message", e.getMessage());
        return resultVoHelper.buildFromMap(errorMap, ResponseCode.BAD_REQUEST);
    }
}
```

- [ ] **Step 2: 컨트롤러 컴파일 확인**

```bash
mvn clean compile
```

Expected: BUILD SUCCESS

---

### Task 20: 단위 테스트 작성 - PlatformTenantOnboardingServiceTest

**Files:**

- Create: `backend/src/test/java/egovframework/let/platforms/tenants/service/impl/PlatformTenantOnboardingServiceTest.java`

- [ ] **Step 1: 단위 테스트 작성**

```java
package egovframework.let.platforms.tenants.service.impl;

import egovframework.let.platforms.tenants.domain.model.TenantOnboardingCompleteRequestVO;
import egovframework.let.platforms.tenants.domain.model.TenantVerificationResponseVO;
import egovframework.let.platforms.tenants.domain.repository.TenantAuthTokenDAO;
import egovframework.let.platforms.tenants.service.OnboardingEmailService;
import egovframework.let.platforms.tenants.service.PlatformTenantService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PlatformTenantOnboardingServiceTest {

    @Mock
    private TenantAuthTokenDAO tenantAuthTokenDAO;

    @Mock
    private OnboardingEmailService onboardingEmailService;

    @InjectMocks
    private PlatformTenantServiceImpl platformTenantService;

    @BeforeEach
    void setUp() {
        // Mock 설정
    }

    @Test
    void sendOnboardingEmail_shouldThrowExceptionWhenTenantNotFound() {
        String tenantCode = "INVALID_CODE";

        assertThrows(IllegalArgumentException.class, () -> {
            platformTenantService.sendOnboardingEmail(tenantCode);
        });
    }

    @Test
    void verifyAuthToken_shouldReturnFailedResponseForInvalidToken() {
        String authToken = "invalid-token";
        when(tenantAuthTokenDAO.selectTokenByValue(authToken)).thenReturn(null);

        TenantVerificationResponseVO response = platformTenantService.verifyAuthToken(authToken);

        assertFalse(response.isVerified());
        assertEquals("유효하지 않은 토큰입니다.", response.getMessage());
    }

    @Test
    void completeOnboarding_shouldThrowExceptionForInvalidToken() {
        TenantOnboardingCompleteRequestVO request = new TenantOnboardingCompleteRequestVO();
        request.setTenantCode("TEST001");
        request.setAuthToken("invalid");
        request.setPassword("Test@123");

        assertThrows(IllegalArgumentException.class, () -> {
            platformTenantService.completeOnboarding(request);
        });
    }
}
```

- [ ] **Step 2: 테스트 실행**

```bash
mvn test -Dtest=PlatformTenantOnboardingServiceTest
```

Expected: 테스트 3개 PASS

---

### Task 21: 로그인 검증 쿼리 수정

**Files:**

- Modify: `backend/src/main/resources/egovframework/mapper/let/uat/uia/EgovLoginUsr_SQL_postgresql.xml`

- [ ] **Step 1: actionLogin 쿼리 수정**

쿼리를 다음과 같이 수정 (WHERE 절에 로그인 계정 검증 조건 추가):

```xml
<!-- 기존 -->
<select id="actionLogin" parameterType="map" resultType="com.cmm.LoginVO">
    SELECT ... FROM tb_login_account
    WHERE login_code = #{userId}
      AND password_hash = #{password}
</select>

<!-- 수정 후 -->
<select id="actionLogin" parameterType="map" resultType="com.cmm.LoginVO">
    SELECT ... FROM tb_login_account
    WHERE login_code = #{userId}
      AND password_hash = #{password}
      AND use_at = 'Y'
      AND (onboarding_status IS NULL
           OR onboarding_status = 'FIRST_SETUP_COMPLETED')
</select>
```

- [ ] **Step 2: 쿼리 문법 확인**

```bash
# XML 구문 검증 (Maven 빌드 시 자동 검증됨)
mvn clean compile
```

Expected: BUILD SUCCESS

---

### Task 22: 최종 빌드 및 테스트

**Files:**

- All modified and created files

- [ ] **Step 1: 전체 빌드**

```bash
mvn clean build
```

Expected: BUILD SUCCESS

- [ ] **Step 2: 모든 테스트 실행**

```bash
mvn test
```

Expected: 모든 테스트 PASS (최소 5개 이상)

- [ ] **Step 3: 전체 컴파일 확인**

```bash
mvn clean compile
```

Expected: BUILD SUCCESS (에러 없음)

---

### Task 23: Git 커밋

**Files:**

- All created and modified files

- [ ] **Step 1: 추가된 파일 스테이징**

```bash
git add backend/src/main/java/egovframework/let/platforms/tenants/domain/model/
git add backend/src/main/java/egovframework/let/platforms/tenants/domain/repository/
git add backend/src/main/java/egovframework/let/platforms/tenants/service/
git add backend/src/main/resources/egovframework/mapper/let/platforms/tenants/
git add backend/src/test/java/egovframework/let/platforms/tenants/
git add backend/DATABASE/migrations/2026-06-23_add_onboarding_support_tables_*.sql
git add docs/superpowers/specs/2026-06-23-tenant-onboarding-design.md
```

- [ ] **Step 2: 수정된 파일 스테이징**

```bash
git add backend/src/main/java/egovframework/let/platforms/tenants/service/PlatformTenantService.java
git add backend/src/main/java/egovframework/let/platforms/tenants/service/impl/PlatformTenantServiceImpl.java
git add backend/src/main/java/egovframework/let/platforms/tenants/controller/PlatformTenantApiController.java
git add backend/src/main/resources/egovframework/mapper/let/uat/uia/EgovLoginUsr_SQL_postgresql.xml
```

- [ ] **Step 3: 커밋**

```bash
git commit -m "feat: implement tenant onboarding email verification

- Add tb_tenant_auth_token table for email token management
- Add onboarding_status column to tb_login_account
- Implement TenantAuthTokenVO, VO models for onboarding
- Implement TenantAuthTokenDAO and JDBC implementation
- Implement OnboardingEmailService for email sending
- Implement TenantAuthTokenGenerator for secure token generation
- Extend PlatformTenantService with onboarding methods
- Add API endpoints: send-verification-email, verify-token, complete-onboarding
- Update login verification to check onboarding_status and use_at
- Add unit tests for token generation and onboarding flow"
```

- [ ] **Step 4: 커밋 확인**

```bash
git log -1 --oneline
```

Expected: 커밋이 로그에 표시됨

---

## ✅ 구현 완료 체크리스트

- [ ] 마이그레이션 스크립트 실행 완료
- [ ] 모든 VO 클래스 생성 완료
- [ ] DAO 및 JDBC 구현 완료
- [ ] 서비스 메서드 구현 완료
- [ ] API 엔드포인트 추가 완료
- [ ] 모든 테스트 통과
- [ ] 전체 빌드 성공
- [ ] Git 커밋 완료

---
