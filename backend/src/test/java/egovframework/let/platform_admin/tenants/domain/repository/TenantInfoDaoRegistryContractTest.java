package egovframework.let.platform_admin.tenants.domain.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import egovframework.let.platform_admin.tenants.domain.model.TenantDatabaseInfoVO;

class TenantInfoDaoRegistryContractTest {

    @DisplayName("tenant DB registry DAO는 tenantId와 도메인 기반으로 레코드를 조회할 수 있다")
    @Test
    void registryLookupMethodsAreAvailable() {
        TenantInfoDAO tenantInfoDAO = mock(TenantInfoDAO.class);

        TenantDatabaseInfoVO byTenantId = new TenantDatabaseInfoVO();
        byTenantId.setTenantId(99L);
        byTenantId.setDbKey("TENANT_99");
        when(tenantInfoDAO.selectTenantDatabaseByTenantId(99L)).thenReturn(byTenantId);

        TenantDatabaseInfoVO byDomain = new TenantDatabaseInfoVO();
        byDomain.setTenantId(99L);
        byDomain.setDbKey("TENANT_99");
        when(tenantInfoDAO.selectTenantDatabaseByDomainHost("tenant.example.com")).thenReturn(byDomain);

        assertEquals("TENANT_99", tenantInfoDAO.selectTenantDatabaseByTenantId(99L).getDbKey());
        assertEquals("TENANT_99", tenantInfoDAO.selectTenantDatabaseByDomainHost("tenant.example.com").getDbKey());
    }
}
