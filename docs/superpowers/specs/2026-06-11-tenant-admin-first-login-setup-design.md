# Tenant Admin First Login Setup Design

## 1. Goal

플랫폼관리자가 업체 코드를 발급하고 메일로 전달한 뒤,
업체관리자가 해당 업체 코드로 최초 로그인했을 때,
사용자 1명 이상과 부서 1개 이상을 설정하기 전까지 일반 업무 화면 진입을 제한하고
초기 설정 단계를 완료하도록 유도한다.

## 2. Confirmed Decisions

- 완료 기준은 사용자 1명 이상 + 부서 1개 이상 생성으로 확정한다.
- 최초 설정 진입 제어는 로그인 직후 강제 리다이렉트 방식으로 구현한다.
- 프론트 계산 로직보다 백엔드 판정값을 우선 신뢰하는 계약 중심 구조를 사용한다.
- 플랫폼관리자용 업체 등록 흐름과 업체관리자용 최초 설정 흐름을 분리한다.
- 플랫폼관리자 업체 코드 발급 후 메일 발송은 이번 단계에서 Mock(시뮬레이션)으로 구현한다.
- 데모 및 검증을 위해 업체 샘플 데이터를 함께 제공한다.

## 3. Information Architecture

### 3.1 Roles and Responsibilities

- PLATFORM_ADMIN
  - 업체 코드 발급 및 초기 업체 등록 담당
  - 관리자 이메일로 업체 코드 발송 요청 담당(Mock 발송 상태 확인)
  - 기존 업체 등록 온보딩 화면 사용
- TENANT_ADMIN
  - 최초 로그인 시 초기 설정 전용 화면에서 사용자/부서 설정 담당
- USER
  - 최초 설정 강제 플로우 대상 아님

### 3.2 Page Strategy

- 기존 업체 등록 온보딩 페이지는 플랫폼관리자 전용으로 유지한다.
- 플랫폼관리자 온보딩 화면에서 업체 코드 자동 발급, 관리자 이메일 입력, 발송 액션을 제공한다.
- 업체관리자 최초 설정 전용 페이지를 별도로 제공한다.
- 최초 설정 미완료 업체관리자는 대시보드, 문서 등 일반 업무 페이지로 직접 접근해도
  최초 설정 화면으로 복귀시킨다.

## 4. Routing and Access Rules

- 인증 경계는 기존 ProtectedRoute를 유지한다.
- 권한 경계는 기존 allowedRoles 정책을 유지한다.
- 추가 규칙
  - TENANT_ADMIN && onboardingRequired=true && 현재 경로가 최초 설정 경로가 아니면 최초 설정 경로로 이동
  - TENANT_ADMIN && onboardingRequired=false면 기존 라우팅 규칙대로 동작
  - PLATFORM_ADMIN은 업체관리자 최초 설정 화면에 접근 불가
  - USER는 업체관리자 최초 설정 화면에 접근 불가

## 5. Backend-Ready Data Contract

### 5.0 Tenant Code Issuance Contract (Platform Admin)

- 업체 코드 발급 API
  - 요청: companyName, adminName, adminEmail
  - 응답: tenantCode, companyName, adminEmail, mailDispatchStatus
- 메일 발송 상태
  - 이번 단계는 `MOCK_SENT` 상태를 반환하는 Mock 방식
  - 추후 실메일 연동 시 계약은 유지하고 상태 코드만 확장
- 샘플 데이터
  - 코드 발급 화면에서 바로 확인 가능한 샘플 업체 목록 제공
  - 샘플 항목: tenantCode, companyName, adminEmail, issuedAt

### 5.1 Login Response Contract

로그인 응답에 아래 필드를 포함한다.

- tenantCode: string
- userId: string
- role: PLATFORM_ADMIN | TENANT_ADMIN | USER
- accessToken: string
- onboardingRequired: boolean
- onboardingStatus: NOT_STARTED | IN_PROGRESS | COMPLETED (선택, 확장용)

프론트 호환성 규칙:

- onboardingRequired 누락 시 기본 false로 처리
- 누락 이벤트는 경고 로그로 기록해 계약 불일치를 조기에 탐지

### 5.2 Setup Status and Completion Contract

- 상태 조회 API
  - 현재 사용자 수, 부서 수, 완료 여부 반환
- 완료 API
  - 백엔드가 사용자 1명 이상 + 부서 1개 이상 조건 검증
  - 검증 성공 시 완료 상태 반영

프론트는 사용자/부서 개수를 자체 계산해 완료 처리하지 않고,
완료 여부는 백엔드 결과를 최종 기준으로 사용한다.

### 5.3 Backend Enforcement Principle

- 프론트 가드는 사용자 경험 제어를 담당한다.
- 실제 보안/정책 차단은 백엔드가 최종 강제한다.
- 즉, 최초 설정 미완료 업체관리자의 일반 업무 API 접근은
  백엔드 정책에서 차단 가능해야 한다.

## 6. Component-Level Changes

- frontend/src/services/authService.ts
  - 로그인 응답 타입에 onboardingRequired, onboardingStatus 반영
- frontend/src/services/tenantService.ts
  - 플랫폼관리자용 업체 코드 발급/메일 발송(Mock) 응답 타입 반영
- frontend/src/shared/store/authStore.ts
  - 인증 상태에 onboardingRequired, onboardingStatus 저장
- frontend/src/app/router/ProtectedRoute.tsx
  - 권한 체크 이후 최초 설정 강제 분기 추가
- frontend/src/app/router/AppRoutes.tsx
  - 업체관리자 최초 설정 전용 경로 추가 및 권한 정리
- frontend/src/pages/OnboardingPage.tsx
  - 플랫폼관리자 업체 코드 발급 + 관리자 이메일 발송(Mock) + 샘플 업체 목록 제공
- frontend/src/pages/tenant-admin 초기 설정 페이지 (신규)
  - 사용자/부서 설정 진행 및 완료 처리

## 7. Error and Fallback Behavior

- 로그인 계약 필드 누락
  - 기본값으로 안전 동작하고 경고 로그 기록
- 상태 조회 실패
  - 재시도 액션과 오류 안내 제공
- 코드 발급/메일 발송 실패(Mock 포함)
  - 업체 코드/메일 필드 검증 에러를 사용자 친화 문구로 표시
- 완료 API 409/422
  - 조건 미충족 안내: 사용자 1명 이상, 부서 1개 이상 필요
- 인증 만료 401
  - 로그인 화면으로 복귀
- 무한 리다이렉트 방지
  - 온보딩 상태 로딩 중에는 로딩 화면 노출
  - 로딩 완료 후에만 리다이렉트 판단

## 8. Testing Strategy

### 8.1 Unit and Component Tests

- 로그인 응답 파싱
  - onboardingRequired 존재/누락 케이스 검증
- 라우트 가드
  - TENANT_ADMIN + onboardingRequired=true: 최초 설정 경로 강제 이동
  - TENANT_ADMIN + onboardingRequired=false: 대시보드 정상 접근
  - PLATFORM_ADMIN/USER의 최초 설정 경로 접근 차단
- 플랫폼 관리자 코드 발급 화면
  - 코드 발급 시 Mock 메일 발송 상태 표시 검증
  - 샘플 업체 목록 노출 검증
- 최초 설정 화면
  - 사용자/부서 생성 동작
  - 조건 미충족 시 완료 실패 메시지
  - 조건 충족 후 완료 성공 플로우

### 8.2 Regression Tests

- 기존 권한 기반 라우트 보호 동작 유지 검증
- 기존 플랫폼관리자 업체 등록 온보딩 동작 유지 검증
- 대시보드 및 핵심 페이지 진입 회귀 검증

### 8.3 Verification Commands

- frontend 기준 검증
  - npm run lint
  - npm run test
  - npm run build

## 9. Scope

### Included

- 업체관리자 최초 로그인 강제 초기 설정 단계
- 플랫폼관리자 업체 코드 발급 + 메일 Mock 발송 단계
- 업체 샘플 데이터 제공
- 완료 기준(사용자 1명+, 부서 1개+) 반영
- 백엔드 계약 중심 상태 판정 구조
- 라우트 가드 및 테스트 갱신

### Excluded

- 권한 체계 자체 확장(새 역할 추가)
- 사용자/부서 도메인 정책 상세 변경
- 백엔드 비즈니스 로직 구현 상세

## 10. Risks and Mitigations

- Risk: 프론트/백엔드 배포 순서 불일치로 계약 필드 누락
  - Mitigation: 필드 누락 기본값 처리 + 경고 로깅
- Risk: 라우트 가드 분기 복잡도로 인한 리다이렉트 충돌
  - Mitigation: 역할/상태 조합별 테스트 케이스 명시
- Risk: 초기 설정 화면에서 중복 제출
  - Mitigation: 요청 중 버튼 비활성화 및 서버 응답 기준 갱신
- Risk: 프론트 우회 호출
  - Mitigation: 백엔드 최종 강제 원칙 유지
- Risk: Mock 메일 발송을 실제 발송으로 오해
  - Mitigation: UI/라벨/응답 상태에 `MOCK_SENT`를 명확히 표시
