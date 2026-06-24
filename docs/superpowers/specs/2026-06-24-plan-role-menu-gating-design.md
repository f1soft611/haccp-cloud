# 2026-06-24 Plan + Role Menu Gating Design

## 1. Goal

Current requirement:

- Separate menu visibility/permission by tenant role (admin vs user)
- Add SaaS plan differentiation (A/B/C)
- Keep current data model and implementation risk low

Key policy:

- Final permission = PLAN_ALLOW AND ROLE_ALLOW

This design intentionally avoids tenant-by-tenant menu duplication.

---

## 2. Current Schema Feasibility

### 2.1 Already possible with current tables

- Role-based menu/action control:
  - `tb_role`
  - `tb_menu`
  - `tb_permission`
  - `tb_role_menu_permission`
- Tenant scope exists on major auth/menu entities via `tenant_id`

### 2.2 Not enough yet

- No plan master table
- No tenant subscription state table
- No plan-feature matrix table

Conclusion:

- Role separation is already possible now.
- Plan differentiation requires minimal extension tables.

---

## 3. Minimal Extension Tables

Added draft SQL file:

- `backend/DATABASE/add_postgresql_plan_subscription_feature_tables.sql`

Tables:

1. `tb_plan`
2. `tb_plan_feature`
3. `tb_tenant_subscription`

Notes:

- Existing role/menu tables are reused as-is.
- A/B/C seed and sample feature matrix are included.
- Optional bootstrap inserts default ACTIVE plan A for tenants without subscription.

---

## 4. Admin/User Menu Matrix Sample

Permission legend:

- C: Create
- R: Read
- U: Update
- D: Delete

| Menu                 | TENANT_ADMIN | TENANT_USER | Notes              |
| -------------------- | ------------ | ----------- | ------------------ |
| Dashboard            | R            | R           | Shared             |
| User Management      | C/R/U/D      | R           | User can view only |
| Documents            | C/R/U/D      | C/R/U       | Delete admin only  |
| Approval Line Config | C/R/U/D      | -           | Admin only         |
| Audit Logs           | R            | -           | Admin only         |
| Account Password     | U (self)     | U (self)    | Shared             |

---

## 5. Plan A/B/C Feature Matrix Sample

| Feature Code         | A   | B   | C    |
| -------------------- | --- | --- | ---- |
| FEATURE_USER_MGMT    | Y   | Y   | Y    |
| FEATURE_DOC_WORKFLOW | N   | Y   | Y    |
| FEATURE_AUDIT_LOG    | N   | N   | Y    |
| FEATURE_API_EXPORT   | N   | Y   | Y    |
| LIMIT_USER_COUNT     | 20  | 100 | 1000 |

Combination examples:

| Case                             | Plan Allow | Role Allow | Final |
| -------------------------------- | ---------- | ---------- | ----- |
| User Management Read             | Y          | Y          | Allow |
| Approval Line Config (user role) | Y          | N          | Deny  |
| Audit Logs (plan A)              | N          | Y          | Deny  |
| API Export (plan B, admin)       | Y          | Y          | Allow |

---

## 6. Screen/Backend Check Pseudocode

### 6.1 Frontend gate (UX)

```text
INPUT: tenantId, roleCode, planCode, menuCode, action

planAllows = planFeatureCache.allows(planCode, featureOf(menuCode, action))
roleAllows = rolePermissionCache.allows(roleCode, menuCode, action)

IF NOT planAllows:
  hide menu or show upgrade CTA
ELSE IF NOT roleAllows:
  hide action button or render read-only
ELSE:
  render normal UI
```

### 6.2 Backend gate (security)

```text
INPUT: user, tenantId, menuCode, action

subscription = tenantSubscriptionRepo.findActive(tenantId, now)
IF subscription is null:
  return 403 SUBSCRIPTION_REQUIRED

planAllows = planFeatureRepo.allows(subscription.planId, featureOf(menuCode, action))
IF NOT planAllows:
  return 403 PLAN_NOT_ALLOWED

roleAllows = roleMenuPermissionRepo.allows(user.roleCode, tenantId, menuCode, action)
IF NOT roleAllows:
  return 403 ROLE_NOT_ALLOWED

IF featureOf(menuCode, action) is LIMIT type:
  quota = planFeatureRepo.limit(subscription.planId, featureCode)
  current = usageCounterRepo.current(tenantId, featureCode)
  IF current >= quota:
    return 403 QUOTA_EXCEEDED

return 200/next
```

---

## 7. Migration Sequence (Low Risk)

1. Add new tables only (`tb_plan`, `tb_plan_feature`, `tb_tenant_subscription`)
2. Seed A/B/C and feature matrix
3. Bootstrap default ACTIVE plan for existing tenants
4. Add read-only service to resolve plan and features
5. Add backend check middleware/interceptor for selected endpoints first
6. Add frontend menu/action gating with same feature codes
7. Expand backend checks to all protected endpoints
8. Add admin UI for tenant plan assignment/change
9. Add audit log for plan changes

Rollback strategy:

- Disable runtime plan checks via feature flag
- Keep role-based checks active
- New tables can stay without affecting legacy role permission flow

---

## 8. Feature Code Governance

Recommended naming:

- `FEATURE_*` for boolean toggles
- `LIMIT_*` for quota-based features

Examples:

- `FEATURE_USER_MGMT`
- `FEATURE_DOC_WORKFLOW`
- `FEATURE_AUDIT_LOG`
- `FEATURE_API_EXPORT`
- `LIMIT_USER_COUNT`

Rule:

- Feature codes are immutable keys once released.
- Change behavior by data, not by renaming code constants.

---

## 9. Open Decisions

1. Billing cycle and contract metadata needed now or later?
2. Grace period policy for expired subscription (hard block vs read-only)?
3. Plan upgrade prorating handled in-app or external billing system?
4. Override table needed at phase 1 or phase 2?

---

## 10. Immediate Next Step

Use this order:

1. Apply SQL in non-production DB
2. Implement backend `PlanAccessService` and endpoint guard
3. Wire frontend menu visibility with unified feature codes
4. Run integration test for 4 cases:
   - plan deny / role allow
   - plan allow / role deny
   - both allow
   - limit exceeded
