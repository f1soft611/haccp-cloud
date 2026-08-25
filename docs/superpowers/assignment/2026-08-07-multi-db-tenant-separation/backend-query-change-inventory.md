# Backend Query Change Inventory

## Scope

This inventory lists the main backend files that must change if tenant runtime data moves from one shared database to one database per tenant.

## 1. Routing and DataSource Layer

- [backend/src/main/java/egovframework/com/config/EgovConfigAppDatasource.java](backend/src/main/java/egovframework/com/config/EgovConfigAppDatasource.java)
  - Replace single static DataSource with central DataSource plus tenant routing DataSource.
- [backend/src/main/java/egovframework/com/config/EgovConfigAppMapper.java](backend/src/main/java/egovframework/com/config/EgovConfigAppMapper.java)
  - Ensure MyBatis uses the routing DataSource for tenant-scoped mappers.
- New classes expected:
  - TenantDatabaseRegistryService
  - TenantRoutingDataSource
  - TenantConnectionInfo

## 2. Tenant Resolution and Authentication

- [backend/src/main/java/egovframework/let/platform_admin/tenants/context/TenantContextFilter.java](backend/src/main/java/egovframework/let/platform_admin/tenants/context/TenantContextFilter.java)
  - Resolve by Host or X-Forwarded-Host instead of URI segment.
- [backend/src/main/java/egovframework/let/platform_admin/tenants/context/TenantContextHolder.java](backend/src/main/java/egovframework/let/platform_admin/tenants/context/TenantContextHolder.java)
  - Expand context to include tenant code and routing db key.
- [backend/src/main/java/egovframework/com/security/SecurityConfig.java](backend/src/main/java/egovframework/com/security/SecurityConfig.java)
  - Keep tenant context filter early in the chain.
- [backend/src/main/java/egovframework/let/uat/uia/service/impl/EgovLoginServiceImpl.java](backend/src/main/java/egovframework/let/uat/uia/service/impl/EgovLoginServiceImpl.java)
  - Central DB lookup for tenant registry, tenant DB lookup for account auth.
- [backend/src/main/resources/egovframework/mapper/let/uat/uia/EgovLoginUsr_SQL_postgresql.xml](backend/src/main/resources/egovframework/mapper/let/uat/uia/EgovLoginUsr_SQL_postgresql.xml)
  - Remove shared-DB tenant joins once the tenant DB already scopes the request.
- [backend/src/main/java/egovframework/com/jwt/EgovJwtTokenUtil.java](backend/src/main/java/egovframework/com/jwt/EgovJwtTokenUtil.java)
  - Add routing-safe tenant claims only.

## 3. Central DB Tenant Registry and Onboarding

- [backend/src/main/java/egovframework/let/platform_admin/tenants/domain/repository/TenantInfoDAO.java](backend/src/main/java/egovframework/let/platform_admin/tenants/domain/repository/TenantInfoDAO.java)
- [backend/src/main/java/egovframework/let/platform_admin/tenants/domain/repository/TenantInfoJdbcDAO.java](backend/src/main/java/egovframework/let/platform_admin/tenants/domain/repository/TenantInfoJdbcDAO.java)
- [backend/src/main/resources/egovframework/mapper/let/platform_admin/tenants/PlatformTenantMapper_SQL_postgresql.xml](backend/src/main/resources/egovframework/mapper/let/platform_admin/tenants/PlatformTenantMapper_SQL_postgresql.xml)
  - Add `tb_tenant_database` CRUD and health lookup.
- [backend/src/main/java/egovframework/let/platform_admin/tenants/service/impl/PlatformTenantServiceImpl.java](backend/src/main/java/egovframework/let/platform_admin/tenants/service/impl/PlatformTenantServiceImpl.java)
  - Persist registry metadata during tenant registration.
- [backend/src/main/java/egovframework/let/platform_admin/tenants/service/impl/TenantOnboardingServiceImpl.java](backend/src/main/java/egovframework/let/platform_admin/tenants/service/impl/TenantOnboardingServiceImpl.java)
  - Provision tenant DB, run schema seed, create bootstrap admin account.

## 4. Platform-Only Authorization and Menus

- [backend/src/main/resources/egovframework/mapper/let/platform_admin/menus/PlatformMenuMapper_SQL_postgresql.xml](backend/src/main/resources/egovframework/mapper/let/platform_admin/menus/PlatformMenuMapper_SQL_postgresql.xml)
  - Decide whether this mapper stays on central tables or moves to `tb_platform_menu`.
- [backend/src/main/resources/egovframework/mapper/let/platform_admin/access/PlanAccessMapper_SQL_postgresql.xml](backend/src/main/resources/egovframework/mapper/let/platform_admin/access/PlanAccessMapper_SQL_postgresql.xml)
  - Keep central, because plan and subscription stay central.
- [backend/src/main/resources/egovframework/mapper/let/platform_admin/login-history/LoginHistoryMapper_SQL_postgresql.xml](backend/src/main/resources/egovframework/mapper/let/platform_admin/login-history/LoginHistoryMapper_SQL_postgresql.xml)
  - Split platform login audit from tenant login audit.

## 5. Tenant-Scoped User, Department, Role, Menu Queries

These mappers currently join `tb_tenant` or translate `tenantCode` to `tenant_id`. In a tenant DB model, most of those joins become unnecessary.

- [backend/src/main/resources/egovframework/mapper/let/organization/users/PlatformUserMapper_SQL_postgresql.xml](backend/src/main/resources/egovframework/mapper/let/organization/users/PlatformUserMapper_SQL_postgresql.xml)
  - Remove `JOIN tb_tenant` and `tenantCode -> tenant_id` lookup logic.
- [backend/src/main/resources/egovframework/mapper/let/organization/departments/DepartmentMapper_SQL_postgresql.xml](backend/src/main/resources/egovframework/mapper/let/organization/departments/DepartmentMapper_SQL_postgresql.xml)
  - Remove tenant ownership filters from department tree queries.
- [backend/src/main/resources/egovframework/mapper/let/organization/authorities/AuthorityMapper_SQL_postgresql.xml](backend/src/main/resources/egovframework/mapper/let/organization/authorities/AuthorityMapper_SQL_postgresql.xml)
  - Decide whether `tb_menu` and `tb_permission` are tenant-local copies or central templates.
- [backend/src/main/resources/egovframework/mapper/let/cmm/use/EgovCmmUse_SQL_postgresql.xml](backend/src/main/resources/egovframework/mapper/let/cmm/use/EgovCmmUse_SQL_postgresql.xml)
  - Group and department lookup should no longer depend on central tenant mapping.

## 6. Tenant-Scoped HACCP and Approval Queries

- [backend/src/main/resources/egovframework/mapper/let/dashboard/DashboardMapper_SQL_postgresql.xml](backend/src/main/resources/egovframework/mapper/let/dashboard/DashboardMapper_SQL_postgresql.xml)
  - Remove `JOIN tb_tenant` and tenant code subqueries.
- [backend/src/main/resources/egovframework/mapper/let/documents/haccpbase/HaccpBaseCategoryMapper_SQL_postgresql.xml](backend/src/main/resources/egovframework/mapper/let/documents/haccpbase/HaccpBaseCategoryMapper_SQL_postgresql.xml)
  - Remove tenant translation subqueries.
- [backend/src/main/resources/egovframework/mapper/let/documents/haccpbase/HaccpBaseWorkMapper_SQL_postgresql.xml](backend/src/main/resources/egovframework/mapper/let/documents/haccpbase/HaccpBaseWorkMapper_SQL_postgresql.xml)
  - Remove tenant joins and reduce condition objects.
- [backend/src/main/resources/egovframework/mapper/let/documents/haccpwork/HaccpWorkMapper_SQL_postgresql.xml](backend/src/main/resources/egovframework/mapper/let/documents/haccpwork/HaccpWorkMapper_SQL_postgresql.xml)
  - Highest-impact mapper. It contains repeated tenant joins and approval joins.
- [backend/src/main/resources/egovframework/mapper/let/documents/portal/HaccpPortalDocumentMapper_SQL_postgresql.xml](backend/src/main/resources/egovframework/mapper/let/documents/portal/HaccpPortalDocumentMapper_SQL_postgresql.xml)
  - Remove tenant join and simplify read path.

## 7. SQL Rewrite Patterns To Apply

Use these rules when migrating mappers:

1. Drop `JOIN tb_tenant t ON t.tenant_id = ...` from tenant DB mappers.
2. Drop subqueries such as `SELECT tenant_id FROM tb_tenant WHERE tenant_code = #{tenantCode}`.
3. Keep tenant code only in central DB flows.
4. Replace tenant ownership filters with direct table joins inside the tenant DB.
5. Separate platform-admin mappers from tenant-runtime mappers instead of branching inside one query.

## 8. Suggested First Migration Slice

1. Central registry DDL and DAO
2. Host-based tenant resolution
3. Login mapper and login service split
4. User and department tenant DB queries
5. Role and menu tenant DB queries
6. HACCP document and approval queries
