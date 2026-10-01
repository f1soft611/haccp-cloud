# Multi-DB Tenant Separation Design

## Goal

Replace the current shared-database tenant model with a split model where platform control-plane data remains in one central database and each onboarded tenant gets its own runtime database.

## Current State

- One main backend DataSource is created at boot time.
- Tenant data is mostly separated by `tenant_id` or `tenantCode` inside the same database.
- Domain-based login exists at the UX layer, but the backend still assumes one main database.

## Recommended Architecture

### Central database responsibilities

- tenant master
- tenant domain mapping
- tenant database registry
- onboarding tokens and provisioning state
- plans and subscriptions
- platform-admin authentication and authorization
- platform-level scheduler metadata

### Tenant database responsibilities

- tenant login accounts
- tenant users and departments
- tenant roles, permissions, menus, and role-menu mapping
- tenant login history
- HACCP document categories
- electronic approval data and related audit data

## Routing Rules

1. Resolve tenant from `Host` or `X-Forwarded-Host`.
2. Read tenant registry from central DB.
3. Load tenant DB connection metadata from central DB.
4. Route tenant-scoped reads and writes to the tenant DB.
5. Keep platform-admin routes on central DB.

## Data Modeling Rule

Tenant runtime tables should not keep `tenant_id` after the split unless a table must support cross-tenant replication or central aggregation. One database already scopes a single tenant.

## Query Refactoring Rule

Tenant DB mappers should stop joining `tb_tenant` and stop translating `tenantCode` to `tenant_id`. That logic belongs only to the central registry path.

## Provisioning Flow

1. Register tenant in central DB.
2. Reserve tenant code and domain.
3. Create tenant DB.
4. Run tenant schema.
5. Seed tenant roles, permissions, menus, and bootstrap admin account.
6. Store DB registry row in central DB.
7. Mark onboarding as ready.

## Risks

- tenant routing cache consistency
- too many connection pools if every tenant DB stays hot
- partial provisioning failures
- duplicated platform-vs-tenant auth logic if boundaries are unclear

## Recommendation

Implement the change in layers: central registry first, routing second, new tenant provisioning third, tenant-scoped mappers after that.
