package egovframework.let.platform_admin.tenants.service;

public interface TenantDatabaseRegistryService {
    String resolveDbKeyByTenantId(Long tenantId);
    String resolveDbKeyByDomain(String domain);
}
