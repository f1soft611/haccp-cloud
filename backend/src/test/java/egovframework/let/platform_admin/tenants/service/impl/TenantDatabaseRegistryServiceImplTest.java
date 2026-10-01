package egovframework.let.platform_admin.tenants.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import egovframework.let.platform_admin.tenants.domain.model.TenantDatabaseInfoVO;
import egovframework.let.platform_admin.tenants.domain.repository.TenantInfoDAO;

class TenantDatabaseRegistryServiceImplTest {

    @DisplayName("테넌트 ID로 실제 db_key 레지스트리 값을 우선 사용한다")
    @Test
    void resolvesDbKeyFromTenantDatabaseRegistry() {
        TenantInfoDAO tenantInfoDAO = mock(TenantInfoDAO.class);
        TenantDatabaseInfoVO tenantDatabase = new TenantDatabaseInfoVO();
        tenantDatabase.setDbKey("TENANT_1234567899");
        when(tenantInfoDAO.selectTenantDatabaseByTenantId(24L)).thenReturn(tenantDatabase);

        TenantDatabaseRegistryServiceImpl service = new TenantDatabaseRegistryServiceImpl();
        ReflectionTestUtils.setField(service, "tenantInfoDAO", tenantInfoDAO);

        assertEquals("TENANT_1234567899", service.resolveDbKeyByTenantId(24L));
    }
}
