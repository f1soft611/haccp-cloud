# 2026-06-24 F1soft(PLATFORM) Plan Bootstrap Matrix

## 1. 결론: 구조 변경은 크지 않음

현재 구조에서 필요한 변경은 최소 범위다.

- 기존 권한 체계 유지: `tb_role`, `tb_menu`, `tb_permission`, `tb_role_menu_permission`
- 추가 적용: `tb_plan`, `tb_plan_feature`, `tb_tenant_subscription`
- 정책 계산: `PLAN_ALLOW AND ROLE_ALLOW`

즉, 메뉴/권한/업체 관리는 기존 role-menu-permission을 그대로 쓰고, 플랜은 "추가 게이트"로만 동작한다.

---

## 2. F1soft(PLATFORM) 기준 즉시 운영 매트릭스

기본 운영안:

- 대상 테넌트: `tenant_code = 'PLATFORM'` (에프원소프트)
- 적용 플랜: `P (Platform Admin)`
- 목적: 업체 관리/권한 관리/메뉴 관리 즉시 운영

| 기능 영역       | 화면/URL                  | 필요 feature_code              | P 플랜 값 | 비고               |
| --------------- | ------------------------- | ------------------------------ | --------- | ------------------ |
| 업체 관리       | `/platform/tenants`       | `FEATURE_PLATFORM_TENANT_MGMT` | `Y`       | 플랫폼 전용        |
| 메뉴 관리       | `/platform/menus`         | `FEATURE_PLATFORM_MENU_MGMT`   | `Y`       | 플랫폼 전용        |
| 권한 관리       | `/platform/roles`         | `FEATURE_PLATFORM_ROLE_MGMT`   | `Y`       | 플랫폼 전용        |
| 권한-메뉴 매핑  | `/platform/role-menus`    | `FEATURE_PLATFORM_ROLE_MGMT`   | `Y`       | 플랫폼 전용        |
| 로그인 이력     | `/platform/login-history` | `FEATURE_AUDIT_LOG`            | `Y`       | 플랫폼 운영        |
| 업체 사용자관리 | `/users`, `/members/**`   | `FEATURE_TENANT_USER_MGMT`     | `Y`       | 플랫폼 운영자 허용 |
| 문서 워크플로우 | `/documents`              | `FEATURE_DOC_WORKFLOW`         | `Y`       | 플랫폼 운영자 허용 |

---

## 3. 권장 적용 순서

1. `add_postgresql_plan_subscription_feature_tables.sql` 선적용
2. `seed_postgresql_minimal_platform_admin.sql`로 플랫폼 기본 데이터 확인
3. `seed_postgresql_f1soft_plan_bootstrap.sql` 실행
4. 아래 검증 SQL로 ACTIVE 구독 + feature 값 확인

---

## 3.1 플랫폼 슈퍼테넌트 정책

플랫폼 관리자 테넌트(`PLATFORM`)는 P 플랜 기준으로 모든 운영 화면 접근을 허용한다.

- 플랫폼 전용 메뉴 허용: `/platform/*`
- 업체 운영 메뉴 허용: `/users`, `/documents` 등
- 구현 기준: role 조건 + feature_code 조건 동시 만족

---

## 4. 검증 쿼리

```sql
-- 1) PLATFORM 테넌트 ACTIVE 구독
SELECT t.tenant_code, p.plan_code, s.subscription_status, s.starts_at, s.ends_at
FROM tb_tenant_subscription s
JOIN tb_tenant t ON t.tenant_id = s.tenant_id
JOIN tb_plan p ON p.plan_id = s.plan_id
WHERE t.tenant_code = 'PLATFORM'
  AND s.subscription_status = 'ACTIVE';

-- 2) PLATFORM 테넌트 플랜 feature
SELECT t.tenant_code, p.plan_code, f.feature_code, f.feature_type, f.enabled_at, f.limit_value
FROM tb_tenant t
JOIN tb_tenant_subscription s
  ON s.tenant_id = t.tenant_id
 AND s.subscription_status = 'ACTIVE'
JOIN tb_plan p ON p.plan_id = s.plan_id
JOIN tb_plan_feature f ON f.plan_id = p.plan_id
WHERE t.tenant_code = 'PLATFORM'
ORDER BY f.feature_code;
```
