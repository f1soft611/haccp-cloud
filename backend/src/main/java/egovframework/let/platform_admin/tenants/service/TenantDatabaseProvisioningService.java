package egovframework.let.platform_admin.tenants.service;

import java.util.List;

public interface TenantDatabaseProvisioningService {

    boolean databaseExists(String dbName);

    void provisionNewTenantDatabase(
            Long tenantId,
            String tenantCode,
            String dbName,
            String schemaName,
            String planCode,
            List<String> planMenuCodes);

    /** 관리자 계정으로 같은 PostgreSQL 서버의 dbName DB 에 접속한다. 호출자가 close 한다. */
    java.sql.Connection openDatabaseConnection(String dbName) throws Exception;

    /** Globals.postgresql.Url 에 지정된 central DB 이름. */
    String centralDatabaseName();
}
