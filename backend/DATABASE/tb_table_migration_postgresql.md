# PostgreSQL TB\_\* Table Migration (Phase 1)

## Scope

This phase migrates currently used PostgreSQL HACCP tables to TB\_\* naming.

- haccp_departments -> TB_DepartmentInfo
- haccp_users -> TB_UserInfo
- haccp_login_history -> TB_LoginHistory
- haccp_common_code -> TB_CommonCode
- haccp_organization -> TB_OrganizationInfo
- SCHEDULER_CONFIG -> TB_SchedulerConfig

Compatibility views are created for legacy names to reduce cutover risk.

## Files

- rename script: `backend/DATABASE/rename_to_tb_postgresql.sql`
- rollback script: `backend/DATABASE/rollback_from_tb_postgresql.sql`

## Run migration

```powershell
$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
$env:PGPASSWORD = "<postgres-password>"
& $psql -h localhost -p 5432 -U postgres -d haccp_cloud -f .\rename_to_tb_postgresql.sql
```

## Verify key tables

```sql
SELECT to_regclass('public.tb_userinfo');
SELECT to_regclass('public.tb_departmentinfo');
SELECT to_regclass('public.tb_loginhistory');
SELECT to_regclass('public.tb_schedulerconfig');
```

## Rollback

```powershell
$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
$env:PGPASSWORD = "<postgres-password>"
& $psql -h localhost -p 5432 -U postgres -d haccp_cloud -f .\rollback_from_tb_postgresql.sql
```

## Notes

- This is the PostgreSQL-first implementation start.
- MySQL/MSSQL/HSQL variants are intentionally deferred to the next phase.
- External ERP integration tables are out of scope.
