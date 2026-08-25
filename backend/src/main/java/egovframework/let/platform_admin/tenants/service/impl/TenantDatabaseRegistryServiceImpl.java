package egovframework.let.platform_admin.tenants.service.impl;

import javax.annotation.Resource;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import egovframework.let.platform_admin.tenants.context.PlatformTenantCodes;
import egovframework.let.platform_admin.tenants.domain.model.TenantVO;
import egovframework.let.platform_admin.tenants.domain.repository.TenantInfoDAO;
import egovframework.let.platform_admin.tenants.service.TenantDatabaseRegistryService;

@Service
public class TenantDatabaseRegistryServiceImpl implements TenantDatabaseRegistryService {

    @Resource(name = "tenantInfoDAO")
    private TenantInfoDAO tenantInfoDAO;

    @Override
    public String resolveDbKeyByTenantId(Long tenantId) {
        if (tenantId == null || tenantId <= 0L) {
            return PlatformTenantCodes.CANONICAL;
        }

        if (tenantInfoDAO != null) {
            egovframework.let.platform_admin.tenants.domain.model.TenantDatabaseInfoVO registry = tenantInfoDAO.selectTenantDatabaseByTenantId(tenantId);
            if (registry != null && StringUtils.hasText(registry.getDbKey())) {
                return registry.getDbKey();
            }

            TenantVO tenant = tenantInfoDAO.selectById(tenantId);
            if (tenant != null && StringUtils.hasText(tenant.getTenantCode())) {
                String normalizedCode = PlatformTenantCodes.normalize(tenant.getTenantCode());
                if (StringUtils.hasText(normalizedCode) && !PlatformTenantCodes.isPlatform(normalizedCode)) {
                    return "TENANT_" + normalizedCode;
                }
            }
        }

        return "TENANT_" + tenantId;
    }

    @Override
    public String resolveDbKeyByDomain(String domain) {
        if (!StringUtils.hasText(domain)) {
            return PlatformTenantCodes.CANONICAL;
        }
        String normalized = domain.trim().toLowerCase();
        if (normalized.contains(":")) {
            normalized = normalized.split(":")[0];
        }
        if (normalized.startsWith("http://")) {
            normalized = normalized.replace("http://", "");
        }
        if (normalized.startsWith("https://")) {
            normalized = normalized.replace("https://", "");
        }
        return normalized.isEmpty() ? PlatformTenantCodes.CANONICAL : normalized;
    }
}
