# 업체 온보딩 이메일 인증 설계 문서

**작성일**: 2026-06-23  
**상태**: 설계 완료  
**버전**: 1.0

---

## 1. 개요

업체가 플랫폼에 등록되면, 업체 관리자에게 이메일 인증 링크를 발송하여 인증 후 로그인할 수 있도록 하는 온보딩 프로세스 구현.

---

## 2. 상태 전환 흐름

```
┌─────────────────┐
│  EMAIL_QUEUED   │ ← 초기 상태 (등록 시)
└────────┬────────┘
         │ (코드 발급 API)
         ↓
┌─────────────────┐
│   EMAIL_SENT    │ ← 이메일 발송 + 토큰 생성
└────────┬────────┘
         │ (관리자 이메일 링크 클릭)
         ↓
┌──────────────────────────┐
│  EMAIL_VERIFIED          │ ← tb_login_account.onboarding_status
│  (로그인 계정 준비됨)     │
└────────┬─────────────────┘
         │ (기본정보 + 비밀번호 설정)
         ↓
┌──────────────────────────┐
│  FIRST_SETUP_COMPLETED   │ ← tb_login_account.onboarding_status
│  (tb_login_account       │
│   .use_at='Y')           │
└────────┬─────────────────┘
         │ (로그인 가능)
         ↓
┌─────────────────┐
│     ACTIVE      │ ← tb_tenant.onboarding_status (최종)
└─────────────────┘
```

---

## 3. 데이터베이스 스키마 변경

### 3.1 tb_login_account (기존 테이블 확장)

**추가 컬럼:**

```sql
ALTER TABLE tb_login_account
ADD COLUMN IF NOT EXISTS onboarding_status VARCHAR(50);
```

**목적:** 로그인 계정별 온보딩 단계 추적

- NULL: 일반 사용자
- 'EMAIL_VERIFIED': 이메일 인증 완료
- 'FIRST_SETUP_COMPLETED': 첫 설정 완료

---

### 3.2 tb_tenant_auth_token (새로운 테이블)

**스키마:**

```sql
CREATE TABLE tb_tenant_auth_token (
  auth_token_id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  login_account_id BIGINT NOT NULL,
  tenant_code VARCHAR(50) NOT NULL,
  auth_token VARCHAR(255) NOT NULL UNIQUE,
  token_type VARCHAR(50) DEFAULT 'EMAIL_VERIFICATION',
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  FOREIGN KEY (tenant_id) REFERENCES tb_tenant(tenant_id),
  FOREIGN KEY (login_account_id) REFERENCES tb_login_account(login_account_id)
);
```

**주요 필드:**

- `auth_token`: 인증 토큰 (UUID 또는 6자 + UUID 조합)
- `expires_at`: 만료 시간 (24시간 후)
- `used_at`: 사용 시간 (NULL = 미사용)

---

## 4. 데이터 관계도

```
tb_tenant (업체)
    ↓ onboarding_status = EMAIL_QUEUED/EMAIL_SENT/ACTIVE
    ├→ tb_department (부서 - 온보딩 시 자동 생성)
    │     └→ tb_user (관리자 사용자)
    │           └→ tb_login_account (로그인 계정 use_at='N')
    │                 └→ tb_tenant_auth_token (인증 토큰)
```

---

## 5. 서비스 레이어 메서드

### 5.1 PlatformTenantService 인터페이스

```java
// 1. 온보딩 등록 (기존)
TenantRegistrationResultVO registerTenant(TenantRegistrationRequestVO requestVO);
// 결과: tb_tenant + tb_department + tb_user + tb_login_account 생성
//      tb_tenant.onboarding_status = 'EMAIL_QUEUED'
//      tb_login_account.use_at = 'N'

// 2. 이메일 발송
void sendOnboardingEmail(String tenantCode);
// 결과: 토큰 생성, 이메일 발송, tb_tenant.onboarding_status = 'EMAIL_SENT'

// 3. 토큰 검증
TenantVerificationResponseVO verifyAuthToken(String authToken);
// 결과: 토큰 유효 시 tb_login_account.onboarding_status = 'EMAIL_VERIFIED'

// 4. 온보딩 완료 (기본정보 + 비밀번호 설정)
void completeOnboarding(TenantOnboardingCompleteRequestVO requestVO);
// 결과: tb_login_account.use_at = 'Y'
//      tb_login_account.onboarding_status = 'FIRST_SETUP_COMPLETED'
//      tb_tenant.onboarding_status = 'ACTIVE'

// 5. 이메일 재발송
void resendOnboardingEmail(String tenantCode);
// 결과: 새 토큰 생성, 이전 토큰 만료 처리
```

---

## 6. VO (Value Object) 정의

### 6.1 온보딩 등록 요청

```java
public class TenantOnboardingRequestVO {
    private String tenantNm;              // 업체명
    private String adminName;             // 관리자명
    private String adminEmail;            // 관리자이메일
    private String businessType;          // 업종
    private String businessCategory;      // 업태
}
```

### 6.2 온보딩 등록 응답

```java
public class TenantRegistrationResultVO {
    private Long tenantId;
    private String tenantCode;
    private String tenantNm;
    private String adminEmail;
    private Long userId;
    private Long loginAccountId;
    private LocalDateTime createdAt;
}
```

### 6.3 토큰 검증 응답

```java
public class TenantVerificationResponseVO {
    private String tenantCode;
    private String tenantNm;
    private String adminEmail;
    private Long loginAccountId;
    private boolean verified;
    private String message;
}
```

### 6.4 온보딩 완료 요청

```java
public class TenantOnboardingCompleteRequestVO {
    private String tenantCode;
    private String authToken;             // 인증 토큰
    private String password;              // 새 비밀번호
    private String phoneNumber;           // 전화번호
}
```

---

## 7. API 명세

### 7.1 이메일 발송 (또는 재발송)

**엔드포인트:** `POST /api/admin/tenants/{tenantCode}/send-verification-email`

**응답:**

```json
{
  "success": true,
  "message": "인증 이메일이 admin@company.com으로 발송되었습니다.",
  "tenantCode": "2606220001",
  "expiresIn": "24 hours"
}
```

---

### 7.2 토큰 검증

**엔드포인트:** `GET /api/tenants/verify-token?token=XXX`

**응답:**

```json
{
  "tenantCode": "2606220001",
  "tenantNm": "ABC 식품",
  "adminEmail": "admin@company.com",
  "verified": true,
  "message": "토큰이 유효합니다."
}
```

---

### 7.3 온보딩 완료

**엔드포인트:** `POST /api/tenants/complete-onboarding`

**요청:**

```json
{
  "tenantCode": "2606220001",
  "authToken": "550e8400-e29b-41d4-a716-446655440000",
  "password": "SecurePassword123!",
  "phoneNumber": "010-1234-5678"
}
```

---

## 8. 로그인 검증 조건

```sql
SELECT ... FROM tb_login_account
WHERE login_code = ?
  AND password_hash = ?
  AND use_at = 'Y'  -- 인증 완료된 계정만
  AND (onboarding_status IS NULL
       OR onboarding_status = 'FIRST_SETUP_COMPLETED')
```

---
