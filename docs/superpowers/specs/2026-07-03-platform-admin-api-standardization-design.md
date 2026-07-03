# Platform Admin API Standardization Design

## 1. Background and Goal

The current backend APIs under platform_admin are inconsistent in base paths, HTTP method semantics, and response envelopes. This causes maintenance friction and onboarding cost for collaboration.

This design standardizes platform_admin APIs with the following fixed decisions:

- Scope: platform_admin package first
- Compatibility: breaking changes are allowed
- Response contract: ResultVO only
- Update semantics: strict PUT (full replace) vs PATCH (partial update)
- Versioning and base path: /api/v1/platform-admin/*
- Migration strategy: domain-batch rollout (menus -> tenants -> dashboard/login-history/access)

## 2. Design Principles

### 2.1 Uniform Base Path

All platform_admin endpoints must use:

- /api/v1/platform-admin/*

Any mixed paths like /api/* or /api/platform-admin/* are migrated.

### 2.2 Resource-Oriented URI

- Use plural noun resources
- Remove verb-centric URI segments
- Keep hierarchy explicit for sub-resources

Examples:

- GET /api/v1/platform-admin/menus
- GET /api/v1/platform-admin/menus/{menuId}
- POST /api/v1/platform-admin/menus
- PUT /api/v1/platform-admin/menus/{menuId}
- PATCH /api/v1/platform-admin/menus/{menuId}
- DELETE /api/v1/platform-admin/menus/{menuId}

### 2.3 HTTP Method Semantics

- GET: read
- POST: create or command-style sub-resource creation
- PUT: full replacement update
- PATCH: partial update
- DELETE: deletion

PUT and PATCH must not be used interchangeably.

### 2.4 Response Envelope

All platform_admin controllers return ResultVO.

- Success:
  - resultCode: success code
  - resultMessage: standardized success message
  - result: payload map/object
- Failure:
  - resultCode: business/system error code
  - resultMessage: readable error message
  - result: optional structured error detail (errorCode, errorMessage, etc.)

ResponseEntity direct bodies are removed from platform_admin controllers.

## 3. Domain-Specific API Shape

### 3.1 Menus Domain

Target namespace:

- /api/v1/platform-admin/menus

Keep existing resource shape and align all endpoints to ResultVO responses where needed.

### 3.2 Tenants Domain

Target namespace:

- /api/v1/platform-admin/tenants

Onboarding endpoints are converged under tenant sub-resources:

- POST /api/v1/platform-admin/tenants/{tenantCode}/onboarding/verification-emails
- POST /api/v1/platform-admin/tenants/{tenantCode}/onboarding/verifications
- POST /api/v1/platform-admin/tenants/{tenantCode}/onboarding/completions

Legacy action routes outside /platform-admin are removed in this migration.

### 3.3 Dashboard, Login History, Access Domains

These domains are normalized after menus and tenants, using the same standards:

- /api/v1/platform-admin/dashboard/*
- /api/v1/platform-admin/login-history/*
- /api/v1/platform-admin/plan-access/*

## 4. Error Handling Standard

### 4.1 Controller-Level Strategy

Controllers should delegate business logic errors via domain exceptions and map to ResultVO through ResultVoHelper.

### 4.2 Error Code Consistency

Existing codes like BUSINESS_ERROR and INTERNAL_SERVER_ERROR stay, but payload key conventions are unified:

- errorCode
- errorMessage

### 4.3 Swagger Alignment

OpenAPI annotations must match:

- final path
- HTTP method
- actual response code semantics
- ResultVO payload behavior

## 5. Migration Plan (Domain-Batch)

### Batch 1: Menus

- Normalize base path to /api/v1/platform-admin/menus
- Ensure response consistency (ResultVO contract)
- Verify PUT/PATCH role is explicit in code and docs

### Batch 2: Tenants

- Migrate tenant and onboarding routes into /api/v1/platform-admin/tenants/*
- Replace ResponseEntity body patterns with ResultVO + ResultVoHelper
- Preserve business errors in standardized ResultVO format

### Batch 3: Dashboard, Login History, Access

- Align base paths and method semantics
- Unify ResultVO response and error mapping

## 6. Completion Criteria

A batch is complete only when all items pass:

1. All endpoints are under /api/v1/platform-admin/*
2. Controller responses are ResultVO-only
3. PUT vs PATCH semantics are explicit and documented
4. Swagger paths and responses match runtime behavior
5. Legacy mixed/verb routes in the target batch are removed

## 7. Testing Strategy

- Controller tests:
  - method/path correctness
  - ResultVO envelope shape
  - error code mapping
- Service tests:
  - domain exception behavior for mapping boundaries
- Regression checks:
  - tenant onboarding (email send, verification, completion)
- Smoke checks:
  - key platform_admin screens calling migrated APIs

## 8. Collaboration and Governance

For all new or changed platform_admin APIs, PR merge requires a checklist pass:

1. URI rule: /api/v1/platform-admin/* and resource naming
2. Method rule: PUT vs PATCH semantics are correct
3. Response rule: ResultVO-only
4. Error rule: standardized code/message keys
5. Docs rule: OpenAPI and implementation are synchronized

## 9. Affected Current Controllers (Reference)

- backend/src/main/java/egovframework/let/platform_admin/menus/controller/PlatformMenuApiController.java
- backend/src/main/java/egovframework/let/platform_admin/tenants/controller/PlatformTenantApiController.java
- backend/src/main/java/egovframework/let/platform_admin/tenants/controller/TenantOnboardingController.java
- backend/src/main/java/egovframework/let/platform_admin/dashboard/controller/PlatformDashboardApiController.java
- backend/src/main/java/egovframework/let/platform_admin/loginhistory/controller/LoginHistoryApiController.java
- backend/src/main/java/egovframework/let/platform_admin/access/controller/PlanAccessApiController.java
