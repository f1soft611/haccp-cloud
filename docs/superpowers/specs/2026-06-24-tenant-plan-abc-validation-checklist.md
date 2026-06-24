# 2026-06-24 Tenant Plan A/B/C Validation Checklist

## 1. 목적

샘플 업체 테넌트 1개(`TENANT_SAMPLE`)에서 A/B/C 활성 플랜별로 보이는 메뉴 차이를 검증한다.

관련 SQL:

- `backend/DATABASE/seed_postgresql_sample_tenant_plan_validation.sql`

---

## 2. 사전 조건

1. `create_postgresql_schema_active_tables.sql` 적용
2. `add_postgresql_plan_subscription_feature_tables.sql` 적용
3. `seed_postgresql_sample_tenant_plan_validation.sql` 적용

---

## 3. 검증 절차

1. 샘플 테넌트의 ACTIVE 플랜을 A로 전환
2. 검증 쿼리 실행(파일 하단 Visibility verification query)
3. 메뉴 노출 결과 확인
4. 같은 방식으로 B, C 반복

---

## 4. 기대 결과 (TENANT_ADMIN 기준)

| 메뉴 URL            | A    | B    | C    |
| ------------------- | ---- | ---- | ---- |
| `/dashboard`        | SHOW | SHOW | SHOW |
| `/users`            | SHOW | SHOW | SHOW |
| `/documents`        | HIDE | SHOW | SHOW |
| `/document-history` | SHOW | SHOW | SHOW |

해석:

- `/documents`는 `FEATURE_DOC_WORKFLOW`가 A에서 N이므로 HIDE.
- `/users`는 `FEATURE_TENANT_USER_MGMT`가 A/B/C 모두 Y이므로 SHOW.

---

## 5. 플랫폼 테넌트와의 차별 포인트

PLATFORM 테넌트는 플랜 `P` 사용:

- `/platform/*` 계열 메뉴 허용
- `/users`, `/documents` 계열은 feature를 N으로 둬 기본 비노출

즉, 동일 역할 테이블을 사용해도 active plan + feature 분리로 메뉴 공통 노출을 방지한다.
