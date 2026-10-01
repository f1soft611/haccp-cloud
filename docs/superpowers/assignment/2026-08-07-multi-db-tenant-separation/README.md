# Multi-DB Tenant Separation Working Set

This folder collects the first-pass artifacts for splitting the current shared tenant database model into:

- one central platform database
- one tenant database per onboarded company

Contents:

- `central-db-ddl-draft.sql`: draft DDL for platform control-plane data
- `tenant-db-ddl-draft.sql`: draft DDL for tenant runtime data
- `backend-query-change-inventory.md`: backend code and mapper impact inventory
- `업무별-DB-경계-확정안.md`: 중앙 DB/tenant DB 경계를 업무 기준으로 확정한 한글 문서

Usage:

1. Finalize central-vs-tenant table ownership.
2. Review backend query inventory and mark the first migration slice.
3. Create actual migration SQL under `backend/DATABASE/` after design approval.
4. Implement routing and mapper changes in small vertical slices.

Current recommendation:

- Central DB owns tenant registry, domain routing, provisioning, plan/subscription, and platform-admin auth.
- Tenant DB owns tenant users, roles, menus, document categories, approvals, and tenant login history.

Korean confirmation document:

- See `업무별-DB-경계-확정안.md` for business-domain boundary decisions.
