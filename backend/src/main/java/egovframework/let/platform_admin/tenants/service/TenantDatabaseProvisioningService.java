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
}
