package egovframework.let.platforms.factories.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import egovframework.let.platforms.factories.domain.model.FactoryRegistrationRequestVO;
import egovframework.let.platforms.factories.domain.model.FactoryRegistrationResultVO;
import egovframework.let.platforms.factories.domain.repository.FactoryInfoDAO;

class PlatformFactoryServiceImplTest {

    @DisplayName("업체 등록 시 법인번호/업종/업태 컬럼까지 저장한다")
    @Test
    void registerFactory_savesExtendedFields() {
        FactoryInfoDAO factoryInfoDAO = mock(FactoryInfoDAO.class);
        PlatformFactoryServiceImpl service = new PlatformFactoryServiceImpl();
        ReflectionTestUtils.setField(service, "factoryInfoDAO", factoryInfoDAO);

        when(factoryInfoDAO.selectMaxFactoryCode()).thenReturn("000123");
        when(factoryInfoDAO.insertFactory(
                eq("000124"),
                eq("테스트업체"),
                eq("TENANT_000124"),
                eq("admin@test.com"),
                eq("CORP-001"),
                eq("식품제조"),
                eq("즉석조리식품")))
            .thenReturn(1);

        FactoryRegistrationRequestVO requestVO = new FactoryRegistrationRequestVO();
        requestVO.setFactoryNm("테스트업체");
        requestVO.setAdminEmail("admin@test.com");
        requestVO.setCorporateNumber("CORP-001");
        requestVO.setBusinessType("식품제조");
        requestVO.setBusinessCategory("즉석조리식품");

        FactoryRegistrationResultVO result = service.registerFactory(requestVO);

        assertEquals("000124", result.getFactoryCode());
        assertEquals("TENANT_000124", result.getTenantCode());
        assertEquals("CORP-001", result.getCorporateNumber());
        assertEquals("식품제조", result.getBusinessType());
        assertEquals("즉석조리식품", result.getBusinessCategory());

        verify(factoryInfoDAO).insertFactory(
                eq("000124"),
                eq("테스트업체"),
                eq("TENANT_000124"),
                eq("admin@test.com"),
                eq("CORP-001"),
                eq("식품제조"),
                eq("즉석조리식품"));
    }

    @DisplayName("업체명 없으면 등록에 실패한다")
    @Test
    void registerFactory_requiresFactoryName() {
        FactoryInfoDAO factoryInfoDAO = mock(FactoryInfoDAO.class);
        PlatformFactoryServiceImpl service = new PlatformFactoryServiceImpl();
        ReflectionTestUtils.setField(service, "factoryInfoDAO", factoryInfoDAO);

        FactoryRegistrationRequestVO requestVO = new FactoryRegistrationRequestVO();
        requestVO.setFactoryNm("  ");

        assertThrows(IllegalArgumentException.class, () -> service.registerFactory(requestVO));
    }
}
