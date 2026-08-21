# Multi-DB Tenant Separation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split shared tenant runtime data from the current main database into one central platform database plus one database per tenant.

**Architecture:** The backend keeps a central registry for tenant metadata, domain mapping, plan/subscription, provisioning status, and platform-admin auth. All tenant runtime auth, user, menu, and HACCP data move behind a routing DataSource that selects the target tenant database from request context.

**Tech Stack:** Spring Boot, eGovFrame, MyBatis, PostgreSQL, JWT, PowerShell bootstrap scripts

---

### Task 1: Establish the database boundary artifacts

**Files:**

- Modify: `backend/DATABASE/create_postgresql_schema_active_tables.sql`
- Create: `backend/DATABASE/create_platform_core_tables.sql`
- Create: `backend/DATABASE/create_tenant_core_tables.sql`
- Create: `backend/DATABASE/create_platform_tenant_database_registry.sql`

- [ ] **Step 1: Copy the current active-table DDL into platform and tenant draft files**

```sql
-- platform file keeps tb_tenant, tb_tenant_domain, tb_tenant_database,
-- tb_plan, tb_plan_feature, tb_plan_menu, tb_tenant_subscription,
-- tb_tenant_auth_token, and platform-only auth tables.

-- tenant file keeps tb_department, tb_login_account, tb_user, tb_role,
-- tb_permission, tb_menu, tb_login_account_role, tb_role_menu_permission,
-- tb_login_history, drafting tables, and approval tables.
```

- [ ] **Step 2: Remove tenant-scoped tables from the platform DDL**

Run: `rg "CREATE TABLE IF NOT EXISTS tb_(department|login_account|user|role|permission|menu|login_history|drafting|electronic_approval)" backend/DATABASE`
Expected: platform DDL only keeps central ownership tables.

- [ ] **Step 3: Remove `tenant_id` from tenant-runtime DDL where the database itself scopes the tenant**

```sql
ALTER TABLE tb_department DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE tb_login_account DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE tb_user DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE tb_role DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE tb_permission DROP COLUMN IF EXISTS tenant_id;
```

- [ ] **Step 4: Validate SQL syntax by running the scripts against local PostgreSQL**

Run: `powershell -NoProfile -ExecutionPolicy Bypass -File backend/DATABASE/bootstrap_postgresql.ps1`
Expected: the scripts execute without syntax errors after wiring them into the bootstrap flow.

### Task 2: Introduce central tenant database registry access

**Files:**

- Modify: `backend/src/main/java/egovframework/let/platform_admin/tenants/domain/repository/TenantInfoDAO.java`
- Modify: `backend/src/main/java/egovframework/let/platform_admin/tenants/domain/repository/TenantInfoJdbcDAO.java`
- Modify: `backend/src/main/resources/egovframework/mapper/let/platform_admin/tenants/PlatformTenantMapper_SQL_postgresql.xml`
- Create: `backend/src/main/java/egovframework/let/platform_admin/tenants/domain/model/TenantDatabaseInfoVO.java`

- [ ] **Step 1: Add registry read methods to the DAO interface**

```java
TenantDatabaseInfoVO selectTenantDatabaseByTenantId(Long tenantId);
TenantDatabaseInfoVO selectTenantDatabaseByDomainHost(String domainHost);
int insertTenantDatabase(TenantDatabaseInfoVO tenantDatabaseInfoVO);
```

- [ ] **Step 2: Add MyBatis statements for the new registry table**

```xml
<select id="TenantInfoDAO.selectTenantDatabaseByDomainHost" resultType="egovframework.let.platform_admin.tenants.domain.model.TenantDatabaseInfoVO">
    SELECT td.tenant_id,
           db.db_key,
           db.jdbc_url,
           db.jdbc_username,
           db.jdbc_password_secret_ref,
           db.schema_name,
           db.provisioning_status
      FROM tb_tenant_domain td
      JOIN tb_tenant_database db ON db.tenant_id = td.tenant_id
     WHERE td.domain_host = #{domainHost}
       AND td.use_at = 'Y'
       AND db.use_at = 'Y'
     LIMIT 1
</select>
```

- [ ] **Step 3: Run a narrow compile check**

Run: `mvn -f backend/pom.xml -DskipTests compile`
Expected: new VO and DAO signatures compile.

### Task 3: Add tenant routing DataSource infrastructure

**Files:**

- Modify: `backend/src/main/java/egovframework/com/config/EgovConfigAppDatasource.java`
- Create: `backend/src/main/java/egovframework/let/platform_admin/tenants/context/TenantRoutingDataSource.java`
- Create: `backend/src/main/java/egovframework/let/platform_admin/tenants/context/TenantConnectionContext.java`
- Create: `backend/src/main/java/egovframework/let/platform_admin/tenants/service/TenantDatabaseRegistryService.java`

- [ ] **Step 1: Write a focused unit test for routing-key selection**

```java
@Test
void determineCurrentLookupKeyReturnsPlatformWhenNoTenantContext() {
    TenantRoutingDataSource dataSource = new TenantRoutingDataSource();
    assertThat(dataSource.determineCurrentLookupKey()).isEqualTo("PLATFORM");
}
```

- [ ] **Step 2: Implement the routing DataSource**

```java
public class TenantRoutingDataSource extends AbstractRoutingDataSource {
    @Override
    protected Object determineCurrentLookupKey() {
        String dbKey = TenantConnectionContext.getDbKey();
        return StringUtils.hasText(dbKey) ? dbKey : "PLATFORM";
    }
}
```

- [ ] **Step 3: Wire central and routing DataSources in config**

```java
@Bean(name = "routingDataSource")
public DataSource routingDataSource() {
    TenantRoutingDataSource dataSource = new TenantRoutingDataSource();
    dataSource.setDefaultTargetDataSource(platformDataSource());
    dataSource.setTargetDataSources(new HashMap<Object, Object>());
    return dataSource;
}
```

- [ ] **Step 4: Run a narrow compile check**

Run: `mvn -f backend/pom.xml -DskipTests compile`
Expected: DataSource config compiles with the new routing classes.

### Task 4: Switch tenant resolution from URI to host-based routing

**Files:**

- Modify: `backend/src/main/java/egovframework/let/platform_admin/tenants/context/TenantContextFilter.java`
- Modify: `backend/src/main/java/egovframework/let/platform_admin/tenants/context/TenantContextHolder.java`
- Test: `backend/src/test/java/.../TenantContextFilterTest.java`

- [ ] **Step 1: Write a filter test for `X-Forwarded-Host` precedence**

```java
mockRequest.addHeader("X-Forwarded-Host", "tenant.example.com");
filter.doFilter(mockRequest, mockResponse, chain);
assertThat(TenantContextHolder.getTenantId()).isEqualTo(expectedTenantId);
```

- [ ] **Step 2: Replace URI parsing with host parsing**

```java
String forwardedHost = request.getHeader("X-Forwarded-Host");
String hostHeader = StringUtils.hasText(forwardedHost) ? forwardedHost : request.getHeader("Host");
String tenantDomain = normalizeHost(hostHeader);
```

- [ ] **Step 3: Re-run the filter test**

Run: `mvn -f backend/pom.xml "-Dtest=TenantContextFilterTest" test`
Expected: PASS

### Task 5: Split login and onboarding between central and tenant DB paths

**Files:**

- Modify: `backend/src/main/java/egovframework/let/uat/uia/service/impl/EgovLoginServiceImpl.java`
- Modify: `backend/src/main/resources/egovframework/mapper/let/uat/uia/EgovLoginUsr_SQL_postgresql.xml`
- Modify: `backend/src/main/java/egovframework/let/platform_admin/tenants/service/impl/TenantOnboardingServiceImpl.java`

- [ ] **Step 1: Add a failing login-path test for tenant DB routing**

```java
@Test
void actionLoginUsesResolvedTenantDatabaseForTenantUser() {
    // central registry resolves dbKey, then login DAO runs on tenant DB
}
```

- [ ] **Step 2: Move tenant registry lookup to central DB and auth lookup to tenant DB**

```java
TenantDatabaseInfoVO databaseInfo = tenantRegistryService.resolveByDomain(domainHost);
TenantConnectionContext.setDbKey(databaseInfo.getDbKey());
LoginVO loginVO = loginDAO.actionLogin(vo);
```

- [ ] **Step 3: Update onboarding to provision tenant DB and seed bootstrap account**

```java
tenantProvisioningService.createDatabase(databaseInfo);
tenantProvisioningService.runTenantSchema(databaseInfo);
tenantProvisioningService.seedBootstrapAdmin(databaseInfo, payload);
```

- [ ] **Step 4: Run focused authentication tests**

Run: `mvn -f backend/pom.xml "-Dtest=EgovLoginApiControllerTest,EgovLoginServiceImplTest" test`
Expected: PASS

### Task 6: Remove tenant lookup joins from tenant-runtime mappers

**Files:**

- Modify: `backend/src/main/resources/egovframework/mapper/let/organization/users/PlatformUserMapper_SQL_postgresql.xml`
- Modify: `backend/src/main/resources/egovframework/mapper/let/organization/departments/DepartmentMapper_SQL_postgresql.xml`
- Modify: `backend/src/main/resources/egovframework/mapper/let/organization/authorities/AuthorityMapper_SQL_postgresql.xml`
- Modify: `backend/src/main/resources/egovframework/mapper/let/dashboard/DashboardMapper_SQL_postgresql.xml`
- Modify: `backend/src/main/resources/egovframework/mapper/let/documents/haccpbase/HaccpBaseCategoryMapper_SQL_postgresql.xml`
- Modify: `backend/src/main/resources/egovframework/mapper/let/documents/haccpbase/HaccpBaseWorkMapper_SQL_postgresql.xml`
- Modify: `backend/src/main/resources/egovframework/mapper/let/documents/haccpwork/HaccpWorkMapper_SQL_postgresql.xml`
- Modify: `backend/src/main/resources/egovframework/mapper/let/documents/portal/HaccpPortalDocumentMapper_SQL_postgresql.xml`

- [ ] **Step 1: Replace `tenantCode -> tenant_id` subqueries in one mapper at a time**

```sql
-- before
WHERE tenant_id = (SELECT tenant_id FROM tb_tenant WHERE tenant_code = #{tenantCode} LIMIT 1)

-- after
WHERE 1 = 1
```

- [ ] **Step 2: Remove direct joins to `tb_tenant` in tenant DB mappers**

```sql
-- before
JOIN tb_tenant t ON t.tenant_id = u.tenant_id

-- after
-- removed because the tenant DB already scopes the query
```

- [ ] **Step 3: Run mapper-sensitive test slices after each group**

Run: `mvn -f backend/pom.xml "-Dtest=PlatformUser*Test,Authority*Test,Dashboard*Test,Haccp*Test" test`
Expected: PASS for the touched slice before moving to the next mapper group.

## Self-Review

- Spec coverage: design, DDL split, routing, onboarding, auth, and mapper rewrites are covered.
- Placeholder scan: no TBD or TODO placeholders remain in task steps.
- Type consistency: new registry and routing types use consistent names across tasks.

Plan complete and saved to `docs/superpowers/plans/2026-08-07-multi-db-tenant-separation.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
