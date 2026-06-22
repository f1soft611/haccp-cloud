package egovframework.let.platforms.tenants.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import egovframework.let.platforms.tenants.domain.model.TenantRegistrationRequestVO;
import egovframework.let.platforms.tenants.domain.model.TenantRegistrationResultVO;
import egovframework.let.platforms.tenants.domain.repository.TenantInfoDAO;

class PlatformTenantServiceImplTest {

    @DisplayName("업체 등록 시 법인번호/업종/업태 컬럼까지 저장한다")
    @Test
    void registerTenant_savesExtendedFields() {
        TenantInfoDAO tenantInfoDAO = mock(TenantInfoDAO.class);
        PlatformTenantServiceImpl service = new PlatformTenantServiceImpl();
        ReflectionTestUtils.setField(service, "tenantInfoDAO", tenantInfoDAO);

        when(tenantInfoDAO.selectMaxTenantCode()).thenReturn("000123");
        when(tenantInfoDAO.insertTenant(
                eq("000124"),
                eq("테스트업체"),
                eq("admin@test.com"),
                eq("CORP-001"),
                eq("식품제조"),
                eq("즉석조리식품")))
            .thenReturn(1);
        when(tenantInfoDAO.selectTenantIdByCode("TENANT_000124")).thenReturn(124L);

        TenantRegistrationRequestVO requestVO = new TenantRegistrationRequestVO();
        requestVO.setTenantNm("테스트업체");
        requestVO.setAdminEmail("admin@test.com");
        requestVO.setCorporateNumber("CORP-001");
        requestVO.setBusinessType("식품제조");
        requestVO.setBusinessCategory("즉석조리식품");

        TenantRegistrationResultVO result = service.registerTenant(requestVO);

        assertEquals(124L, result.getTenantId());
        assertEquals("TENANT_000124", result.getTenantCode());
        assertEquals("CORP-001", result.getCorporateNumber());
        assertEquals("식품제조", result.getBusinessType());
        assertEquals("즉석조리식품", result.getBusinessCategory());

        verify(tenantInfoDAO).insertTenant(
                eq("000124"),
                eq("테스트업체"),
                eq("admin@test.com"),
                eq("CORP-001"),
                eq("식품제조"),
                eq("즉석조리식품"));
    }

    @DisplayName("업체명 없으면 등록에 실패한다")
    @Test
    void registerTenant_requiresTenantName() {
        TenantInfoDAO tenantInfoDAO = mock(TenantInfoDAO.class);
        PlatformTenantServiceImpl service = new PlatformTenantServiceImpl();
        ReflectionTestUtils.setField(service, "tenantInfoDAO", tenantInfoDAO);

        TenantRegistrationRequestVO requestVO = new TenantRegistrationRequestVO();
        requestVO.setTenantNm("  ");

        assertThrows(IllegalArgumentException.class, () -> service.registerTenant(requestVO));
    }
}
