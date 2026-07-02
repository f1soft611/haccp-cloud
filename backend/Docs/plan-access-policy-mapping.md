# Plan Access Policy Mapping

## Purpose

This document fixes the feature/menuUrl mapping used by `@PlanAccessPolicy`.
Any operation change must be reviewed with this table and validated by automated tests.

## Fixed Mapping Table

| Scope                           | API Endpoint Pattern                                                                                                                                 | menuUrl                   | featureCode                    | Required Level  | limitFeatureCode   |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ------------------------------ | --------------- | ------------------ |
| Platform Login History          | `/api/platform-admin/login-history/**`                                                                                                               | `/platform/login-history` | `FEATURE_AUDIT_LOG`            | `READ`          | `-`                |
| Platform Menu Management        | `/api/platform-admin/menus/**`                                                                                                                       | `/platform/menus`         | `FEATURE_PLATFORM_MENU_MGMT`   | `READ`, `WRITE` | `-`                |
| Platform Role Management        | `/api/platform-admin/roles/**`, `/api/platform-admin/role-menus/**`, `/api/platform-admin/role-menu-candidates`, `/api/platform-admin/user-menus/me` | `/org/roles`              | `FEATURE_PLATFORM_ROLE_MGMT`   | `READ`, `WRITE` | `-`                |
| Platform Tenant Registration    | `/api/platform-admin/tenants`                                                                                                                        | `/platform/tenants`       | `FEATURE_PLATFORM_TENANT_MGMT` | `WRITE`         | `-`                |
| Platform Dashboard              | `/api/platform-admin/dashboard/**`                                                                                                                   | `/platform/tenants`       | `FEATURE_PLATFORM_TENANT_MGMT` | `READ`          | `-`                |
| Platform Plan Access Management | `/api/platform-admin/plan-access/**`                                                                                                                 | `/platform/plans`         | `FEATURE_PLATFORM_TENANT_MGMT` | `READ`, `WRITE` | `-`                |
| Tenant Member Management        | `/members`, `/members/insert`, `/members/update/**`                                                                                                  | `/users`                  | `FEATURE_TENANT_USER_MGMT`     | `READ`, `WRITE` | `-`                |
| Tenant Member Creation Quota    | `/members/insert` (POST)                                                                                                                             | `/members`                | `FEATURE_TENANT_USER_MGMT`     | `WRITE`         | `LIMIT_USER_COUNT` |

## Automated Review Points

1. Annotation coverage check:
   - `PlatformAdminPolicyCoverageTest#allPlatformAdminEndpointsShouldDeclarePlanAccessPolicy`
2. Mapping snapshot check:
   - `PlatformAdminPolicyCoverageTest#planAccessPolicyMappingShouldMatchApprovedSnapshot`

## Change Checklist

1. If adding/changing a protected endpoint, update `@PlanAccessPolicy` on the handler method.
2. If `menuUrl` or `featureCode` changes, update this document table.
3. Update expected snapshot in `PlatformAdminPolicyCoverageTest` only after review approval.
4. Run tests before merge:

```bash
cd backend
mvn -Dtest=PlatformAdminPolicyCoverageTest test
```
