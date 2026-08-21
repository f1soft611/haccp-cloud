# Platform System Tenant Design

## Goal

Treat the platform administrator as an ordinary tenant-scoped principal while using `PLATFORM` as the canonical system tenant code.

## Rules

- `PLATFORM` is the canonical tenant code for platform administrators.
- Legacy `000001` is accepted only as an input/storage compatibility alias and is normalized to `PLATFORM` at application boundaries.
- Platform administrator login always resolves tenant context to `PLATFORM` and role `PLATFORM_ADMIN`.
- Tenant administrator and tenant user login continue to use their actual tenant code.
- Platform role, menu, feature, plan, and login-history lookups use the normalized `PLATFORM` tenant code.
- Database routing keeps the existing `PLATFORM` fallback for the system database and `TENANT_{tenantId}` for customer tenants.

## Implementation Surface

1. Add one shared backend normalization rule for platform tenant codes and apply it to login result/context and platform-admin access parameters.
2. Add one frontend normalization helper and use it when normalizing login responses, restoring persisted auth state, and building platform-admin tenant parameters.
3. Update frontend tests and mock login responses to assert `PLATFORM`.
4. Keep seed/reset SQL canonical on `PLATFORM`; do not rewrite unrelated tenant data or existing user changes.

## Validation

- Backend unit tests for login and tenant-context behavior cover `PLATFORM` and legacy `000001` compatibility.
- Frontend auth-service and app-shell tests cover canonical platform tenant state.
- Backend Maven tests and frontend Vitest/typecheck are run for the touched slices.
