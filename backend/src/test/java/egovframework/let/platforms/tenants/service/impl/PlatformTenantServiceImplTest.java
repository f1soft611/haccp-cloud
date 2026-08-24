package egovframework.let.platform_admin.tenants.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.test.util.ReflectionTestUtils;

import egovframework.let.platform_admin.tenants.domain.model.TenantRegistrationRequestVO;
import egovframework.let.platform_admin.tenants.domain.model.TenantRegistrationResultVO;
import egovframework.let.platform_admin.tenants.domain.repository.TenantInfoDAO;
import egovframework.let.platform_admin.tenants.service.TenantDatabaseProvisioningService;

class PlatformTenantServiceImplTest {

    private static final String BRN = "123-45-67890";
    private static final String TENANT_CODE = "1234567890";

    @DisplayName("업체 등록 시 법인번호/업종/업태 컬럼까지 저장한다")
    @Test
    void registerTenant_savesExtendedFields() {
        TenantInfoDAO tenantInfoDAO = mock(TenantInfoDAO.class);
        PlatformTenantServiceImpl service = new PlatformTenantServiceImpl();
        ReflectionTestUtils.setField(service, "tenantInfoDAO", tenantInfoDAO);

        when(tenantInfoDAO.selectActiveTenantCountByCorporateNumber("1234561234567")).thenReturn(0);
        when(tenantInfoDAO.insertTenantWithBusinessInfo(
                eq(TENANT_CODE),
                eq("테스트업체"),
                eq("admin@test.com"),
            eq("123-45-67890"),
                eq("123456-1234567"),
                eq("식품제조"),
            eq("즉석조리식품"),
            eq("2026-08-19")))
            .thenReturn(1);
        when(tenantInfoDAO.selectTenantIdByCode(TENANT_CODE)).thenReturn(124L);

        TenantRegistrationRequestVO requestVO = new TenantRegistrationRequestVO();
        requestVO.setTenantNm("테스트업체");
        requestVO.setAdminEmail("admin@test.com");
        requestVO.setBusinessRegistrationNumber("123-45-67890");
        requestVO.setCorporateNumber("123456-1234567");
        requestVO.setBusinessType("식품제조");
        requestVO.setBusinessCategory("즉석조리식품");
        requestVO.setRegistrationDate("2026-08-19");

        TenantRegistrationResultVO result = service.registerTenant(requestVO);

        assertEquals(124L, result.getTenantId());
        assertEquals(TENANT_CODE, result.getTenantCode());
        assertEquals("123456-1234567", result.getCorporateNumber());
        assertEquals("123-45-67890", result.getBusinessRegistrationNumber());
        assertEquals("식품제조", result.getBusinessType());
        assertEquals("즉석조리식품", result.getBusinessCategory());
        assertEquals("2026-08-19", result.getRegistrationDate());

        verify(tenantInfoDAO).selectActiveTenantCountByCorporateNumber("1234561234567");
        verify(tenantInfoDAO).insertTenantWithBusinessInfo(
            eq(TENANT_CODE),
                eq("테스트업체"),
                eq("admin@test.com"),
            eq("123-45-67890"),
                eq("123456-1234567"),
                eq("식품제조"),
            eq("즉석조리식품"),
            eq("2026-08-19"));
    }

    @DisplayName("법인번호가 10자리 또는 13자리면 업체 등록을 허용한다")
    @Test
    void registerTenant_acceptsCommonCorporateNumberLengths() {
        TenantInfoDAO tenantInfoDAO = mock(TenantInfoDAO.class);
        PlatformTenantServiceImpl service = new PlatformTenantServiceImpl();
        ReflectionTestUtils.setField(service, "tenantInfoDAO", tenantInfoDAO);

        when(tenantInfoDAO.selectActiveTenantCountByCorporateNumber("1234567890")).thenReturn(0);
        when(tenantInfoDAO.insertTenantWithBusinessInfo(
                eq(TENANT_CODE),
                eq("테스트업체"),
                eq("admin@test.com"),
                eq("123-45-67890"),
                eq("1234567890"),
                eq("식품제조"),
                eq("즉석조리식품"),
                eq("2026-08-19")))
            .thenReturn(1);
        when(tenantInfoDAO.selectTenantIdByCode(TENANT_CODE)).thenReturn(124L);

        TenantRegistrationRequestVO requestVO = new TenantRegistrationRequestVO();
        requestVO.setTenantNm("테스트업체");
        requestVO.setAdminEmail("admin@test.com");
        requestVO.setBusinessRegistrationNumber("123-45-67890");
        requestVO.setCorporateNumber("1234567890");
        requestVO.setBusinessType("식품제조");
        requestVO.setBusinessCategory("즉석조리식품");
        requestVO.setRegistrationDate("2026-08-19");

        TenantRegistrationResultVO result = service.registerTenant(requestVO);

        assertEquals(124L, result.getTenantId());
        assertEquals("1234567890", result.getCorporateNumber());
    }

    @DisplayName("법인번호가 10자리/13자리 외이면 업체 등록을 거부한다")
    @Test
    void registerTenant_rejectsInvalidCorporateNumberLength() {
        TenantInfoDAO tenantInfoDAO = mock(TenantInfoDAO.class);
        PlatformTenantServiceImpl service = new PlatformTenantServiceImpl();
        ReflectionTestUtils.setField(service, "tenantInfoDAO", tenantInfoDAO);

        TenantRegistrationRequestVO requestVO = new TenantRegistrationRequestVO();
        requestVO.setTenantNm("테스트업체");
        requestVO.setAdminEmail("admin@test.com");
        requestVO.setBusinessRegistrationNumber("123-45-67890");
        requestVO.setCorporateNumber("123456");
        requestVO.setBusinessType("식품제조");
        requestVO.setBusinessCategory("즉석조리식품");

        assertThrows(IllegalArgumentException.class, () -> service.registerTenant(requestVO));
    }

    @DisplayName("사업자번호가 없으면 업체 등록을 거부한다")
    @Test
    void registerTenant_requiresBusinessRegistrationNumber() {
        TenantInfoDAO tenantInfoDAO = mock(TenantInfoDAO.class);
        PlatformTenantServiceImpl service = new PlatformTenantServiceImpl();
        ReflectionTestUtils.setField(service, "tenantInfoDAO", tenantInfoDAO);

        TenantRegistrationRequestVO requestVO = new TenantRegistrationRequestVO();
        requestVO.setTenantNm("테스트업체");
        requestVO.setAdminEmail("admin@test.com");
        requestVO.setBusinessType("식품제조");
        requestVO.setBusinessCategory("즉석조리식품");

        assertThrows(IllegalArgumentException.class, () -> service.registerTenant(requestVO));
    }

    @DisplayName("사업자번호가 10자리가 아니면 업체 등록을 거부한다")
    @Test
    void registerTenant_rejectsInvalidBusinessRegistrationNumber() {
        TenantInfoDAO tenantInfoDAO = mock(TenantInfoDAO.class);
        PlatformTenantServiceImpl service = new PlatformTenantServiceImpl();
        ReflectionTestUtils.setField(service, "tenantInfoDAO", tenantInfoDAO);

        TenantRegistrationRequestVO requestVO = new TenantRegistrationRequestVO();
        requestVO.setTenantNm("테스트업체");
        requestVO.setAdminEmail("admin@test.com");
        requestVO.setBusinessRegistrationNumber("123-45-678");
        requestVO.setBusinessType("식품제조");
        requestVO.setBusinessCategory("즉석조리식품");

        assertThrows(IllegalArgumentException.class, () -> service.registerTenant(requestVO));
    }

    @DisplayName("업체 등록은 사업자 등록일을 등록 결과에 유지한다")
    @Test
    void registerTenant_preservesRegistrationDate() {
        TenantInfoDAO tenantInfoDAO = mock(TenantInfoDAO.class);
        PlatformTenantServiceImpl service = new PlatformTenantServiceImpl();
        ReflectionTestUtils.setField(service, "tenantInfoDAO", tenantInfoDAO);

        when(tenantInfoDAO.selectActiveTenantCountByCorporateNumber("1234561234567")).thenReturn(0);
        when(tenantInfoDAO.insertTenantWithBusinessInfo(
                anyString(),
                eq("등록일업체"),
                eq("date@test.com"),
                eq("123-45-67890"),
                eq("123456-1234567"),
                eq("식품제조"),
                eq("즉석조리식품"),
                eq("2026-08-19")))
            .thenReturn(1);
        when(tenantInfoDAO.selectTenantIdByCode(anyString())).thenReturn(null);

        TenantRegistrationRequestVO requestVO = new TenantRegistrationRequestVO();
        requestVO.setTenantNm("등록일업체");
        requestVO.setAdminEmail("date@test.com");
        requestVO.setBusinessRegistrationNumber("123-45-67890");
        requestVO.setCorporateNumber("123456-1234567");
        requestVO.setBusinessType("식품제조");
        requestVO.setBusinessCategory("즉석조리식품");
        requestVO.setRegistrationDate("2026-08-19");

        TenantRegistrationResultVO result = service.registerTenant(requestVO);

        assertEquals("2026-08-19", result.getRegistrationDate());
        verify(tenantInfoDAO).insertTenantWithBusinessInfo(
                anyString(),
                eq("등록일업체"),
                eq("date@test.com"),
                eq("123-45-67890"),
                eq("123456-1234567"),
                eq("식품제조"),
                eq("즉석조리식품"),
                eq("2026-08-19"));
    }

    @DisplayName("활성 업체에 동일 법인번호가 있으면 등록에 실패한다")
    @Test
    void registerTenant_failsWhenActiveCorporateNumberDuplicated() {
        TenantInfoDAO tenantInfoDAO = mock(TenantInfoDAO.class);
        PlatformTenantServiceImpl service = new PlatformTenantServiceImpl();
        ReflectionTestUtils.setField(service, "tenantInfoDAO", tenantInfoDAO);

        TenantRegistrationRequestVO requestVO = new TenantRegistrationRequestVO();
        requestVO.setTenantNm("테스트업체");
        requestVO.setAdminEmail("admin@test.com");
        requestVO.setBusinessRegistrationNumber(BRN);
        requestVO.setCorporateNumber("123456-1234567");
        requestVO.setBusinessType("식품제조");
        requestVO.setBusinessCategory("즉석조리식품");

        when(tenantInfoDAO.selectActiveTenantCountByCorporateNumber("1234561234567")).thenReturn(1);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> service.registerTenant(requestVO));
        assertEquals("이미 등록된 활성 업체의 법인번호입니다", ex.getMessage());
    }

    @DisplayName("활성 업체에 동일 사업자번호가 있으면 등록에 실패한다")
    @Test
    void registerTenant_failsWhenActiveBusinessRegistrationNumberDuplicated() {
        TenantInfoDAO tenantInfoDAO = mock(TenantInfoDAO.class);
        PlatformTenantServiceImpl service = new PlatformTenantServiceImpl();
        ReflectionTestUtils.setField(service, "tenantInfoDAO", tenantInfoDAO);

        TenantRegistrationRequestVO requestVO = new TenantRegistrationRequestVO();
        requestVO.setTenantNm("테스트업체");
        requestVO.setAdminEmail("admin@test.com");
        requestVO.setBusinessRegistrationNumber(BRN);
        requestVO.setCorporateNumber("765432-1234567");
        requestVO.setBusinessType("식품제조");
        requestVO.setBusinessCategory("즉석조리식품");

        when(tenantInfoDAO.selectActiveTenantCountByCorporateNumber("7654321234567")).thenReturn(0);
        when(tenantInfoDAO.selectActiveTenantCountByBusinessRegistrationNumber("1234567890")).thenReturn(1);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> service.registerTenant(requestVO));
        assertEquals("이미 등록된 활성 업체의 사업자번호입니다", ex.getMessage());
    }

    @DisplayName("같은 사업자번호로 이미 테넌트 DB가 생성되어 있으면 재시도 시 DB 생성 없이 진행한다")
    @Test
    void registerTenant_skipsProvisioningWhenTenantDatabaseAlreadyExists() {
        TenantInfoDAO tenantInfoDAO = mock(TenantInfoDAO.class);
        PlatformTenantServiceImpl service = new PlatformTenantServiceImpl();
        ReflectionTestUtils.setField(service, "tenantInfoDAO", tenantInfoDAO);

        TenantDatabaseProvisioningService tenantDatabaseProvisioningService = mock(TenantDatabaseProvisioningService.class);
        ReflectionTestUtils.setField(service, "tenantDatabaseProvisioningService", tenantDatabaseProvisioningService);

        when(tenantInfoDAO.selectTenantDatabaseCountByDbName("tenant_1234567890")).thenReturn(1);
        when(tenantInfoDAO.selectTenantIdByCode("1234567890")).thenReturn(300L);
        when(tenantInfoDAO.selectActiveTenantCountByCorporateNumber("1234561234567")).thenReturn(0);
        when(tenantInfoDAO.selectActiveTenantCountByBusinessRegistrationNumber("1234567890")).thenReturn(0);
        when(tenantInfoDAO.insertTenantWithBusinessInfo(
                eq("1234567890"),
                eq("테스트업체"),
                eq("admin@test.com"),
                eq(BRN),
                eq("123456-1234567"),
                eq("식품제조"),
                eq("즉석조리식품"),
                eq(null)))
            .thenReturn(1);

        TenantRegistrationRequestVO requestVO = new TenantRegistrationRequestVO();
        requestVO.setTenantNm("테스트업체");
        requestVO.setAdminEmail("admin@test.com");
        requestVO.setBusinessRegistrationNumber(BRN);
        requestVO.setCorporateNumber("123456-1234567");
        requestVO.setBusinessType("식품제조");
        requestVO.setBusinessCategory("즉석조리식품");

        TenantRegistrationResultVO result = service.registerTenant(requestVO);

        assertEquals(300L, result.getTenantId());
        verify(tenantInfoDAO).insertTenantWithBusinessInfo(
                eq("1234567890"),
                eq("테스트업체"),
                eq("admin@test.com"),
                eq(BRN),
                eq("123456-1234567"),
                eq("식품제조"),
                eq("즉석조리식품"),
                eq(null));
        verify(tenantDatabaseProvisioningService, never()).provisionNewTenantDatabase(any(), any(), any(), any(), any(), any());
    }

    @DisplayName("물리 DB는 이미 있는데 tb_tenant_database 메타 정보만 없으면 DB 재생성 없이 메타만 보강하고 진행한다")
    @Test
    void registerTenant_skipsProvisioningWhenPhysicalDatabaseAlreadyExistsButMetadataIsMissing() {
        TenantInfoDAO tenantInfoDAO = mock(TenantInfoDAO.class);
        PlatformTenantServiceImpl service = new PlatformTenantServiceImpl();
        ReflectionTestUtils.setField(service, "tenantInfoDAO", tenantInfoDAO);

        TenantDatabaseProvisioningService tenantDatabaseProvisioningService = mock(TenantDatabaseProvisioningService.class);
        ReflectionTestUtils.setField(service, "tenantDatabaseProvisioningService", tenantDatabaseProvisioningService);

        when(tenantInfoDAO.selectTenantDatabaseCountByDbName("tenant_1234567890")).thenReturn(0);
        when(tenantDatabaseProvisioningService.databaseExists("tenant_1234567890")).thenReturn(true);
        when(tenantInfoDAO.selectTenantIdByCode("1234567890")).thenReturn(301L);
        when(tenantInfoDAO.selectActiveTenantCountByCorporateNumber("1234561234567")).thenReturn(0);
        when(tenantInfoDAO.selectActiveTenantCountByBusinessRegistrationNumber("1234567890")).thenReturn(0);
        when(tenantInfoDAO.insertTenantWithBusinessInfo(
                eq("1234567890"),
                eq("테스트업체"),
                eq("admin@test.com"),
                eq(BRN),
                eq("123456-1234567"),
                eq("식품제조"),
                eq("즉석조리식품"),
                eq(null)))
            .thenReturn(1);

        TenantRegistrationRequestVO requestVO = new TenantRegistrationRequestVO();
        requestVO.setTenantNm("테스트업체");
        requestVO.setAdminEmail("admin@test.com");
        requestVO.setBusinessRegistrationNumber(BRN);
        requestVO.setCorporateNumber("123456-1234567");
        requestVO.setBusinessType("식품제조");
        requestVO.setBusinessCategory("즉석조리식품");

        TenantRegistrationResultVO result = service.registerTenant(requestVO);

        assertEquals(301L, result.getTenantId());
        verify(tenantInfoDAO).insertTenantDatabase(eq(301L), eq("1234567890"), eq("tenant_1234567890"), eq("public"));
        verify(tenantDatabaseProvisioningService, never()).provisionNewTenantDatabase(any(), any(), any(), any(), any(), any());
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

    @DisplayName("중복 키 오류는 같은 트랜잭션 안에서 재시도하지 않고 그대로 전파한다")
    @Test
    void registerTenant_propagatesDuplicateKeyFailure() {
        TenantInfoDAO tenantInfoDAO = mock(TenantInfoDAO.class);
        PlatformTenantServiceImpl service = new PlatformTenantServiceImpl();
        ReflectionTestUtils.setField(service, "tenantInfoDAO", tenantInfoDAO);

        when(tenantInfoDAO.selectActiveTenantCountByCorporateNumber("1234561234567")).thenReturn(0);
        when(tenantInfoDAO.insertTenantWithBusinessInfo(
                eq(TENANT_CODE),
                eq("테스트업체"),
                eq("admin@test.com"),
                eq(BRN),
                eq("123456-1234567"),
                eq("식품제조"),
                eq("즉석조리식품"),
                eq(null)))
            .thenThrow(new DuplicateKeyException("duplicate tenant code"));

        TenantRegistrationRequestVO requestVO = new TenantRegistrationRequestVO();
        requestVO.setTenantNm("테스트업체");
        requestVO.setAdminEmail("admin@test.com");
        requestVO.setBusinessRegistrationNumber(BRN);
        requestVO.setCorporateNumber("123456-1234567");
        requestVO.setBusinessType("식품제조");
        requestVO.setBusinessCategory("즉석조리식품");

        assertThrows(DuplicateKeyException.class, () -> service.registerTenant(requestVO));
    }

    @DisplayName("업체 등록 시 planCode가 있으면 활성 구독을 생성한다")
    @Test
    void registerTenant_createsActiveSubscriptionWhenPlanCodeProvided() {
        TenantInfoDAO tenantInfoDAO = mock(TenantInfoDAO.class);
        PlatformTenantServiceImpl service = new PlatformTenantServiceImpl();
        ReflectionTestUtils.setField(service, "tenantInfoDAO", tenantInfoDAO);

        when(tenantInfoDAO.selectActiveTenantCountByCorporateNumber("1234561234567")).thenReturn(0);
        when(tenantInfoDAO.selectTenantIdByCode(TENANT_CODE)).thenReturn(209L);
        when(tenantInfoDAO.insertActiveTenantSubscriptionByPlanCode(209L, "A")).thenReturn(1);

        TenantRegistrationRequestVO requestVO = new TenantRegistrationRequestVO();
        requestVO.setTenantNm("플랜업체");
        requestVO.setAdminEmail("plan@test.com");
        requestVO.setBusinessRegistrationNumber(BRN);
        requestVO.setCorporateNumber("123456-1234567");
        requestVO.setBusinessType("식품제조");
        requestVO.setBusinessCategory("즉석조리식품");
        requestVO.setPlanCode("a");

        TenantRegistrationResultVO result = service.registerTenant(requestVO);

        assertEquals(209L, result.getTenantId());
        verify(tenantInfoDAO).expireActiveTenantSubscription(209L);
        verify(tenantInfoDAO).insertActiveTenantSubscriptionByPlanCode(209L, "A");
    }

    @DisplayName("업체 등록 시 tenant DB 레지스트리도 함께 생성한다")
    @Test
    void registerTenant_registersTenantDatabaseRegistry() {
        TenantInfoDAO tenantInfoDAO = mock(TenantInfoDAO.class);
        PlatformTenantServiceImpl service = new PlatformTenantServiceImpl();
        ReflectionTestUtils.setField(service, "tenantInfoDAO", tenantInfoDAO);

        when(tenantInfoDAO.selectActiveTenantCountByCorporateNumber("1234561234567")).thenReturn(0);
        when(tenantInfoDAO.selectTenantIdByCode(TENANT_CODE)).thenReturn(210L);

        TenantRegistrationRequestVO requestVO = new TenantRegistrationRequestVO();
        requestVO.setTenantNm("기본업체");
        requestVO.setAdminEmail("basic@test.com");
        requestVO.setBusinessRegistrationNumber(BRN);
        requestVO.setCorporateNumber("123456-1234567");
        requestVO.setBusinessType("식품제조");
        requestVO.setBusinessCategory("즉석조리식품");

        service.registerTenant(requestVO);

        verify(tenantInfoDAO).insertTenantDatabase(
                eq(210L),
                eq(TENANT_CODE),
                eq("tenant_" + TENANT_CODE),
                eq("public"));
    }

    @DisplayName("업체 등록 시 planCode가 없으면 구독을 생성하지 않는다")
    @Test
    void registerTenant_skipsSubscriptionWhenPlanCodeMissing() {
        TenantInfoDAO tenantInfoDAO = mock(TenantInfoDAO.class);
        PlatformTenantServiceImpl service = new PlatformTenantServiceImpl();
        ReflectionTestUtils.setField(service, "tenantInfoDAO", tenantInfoDAO);

        when(tenantInfoDAO.selectActiveTenantCountByCorporateNumber("1234561234567")).thenReturn(0);
        when(tenantInfoDAO.selectTenantIdByCode(TENANT_CODE)).thenReturn(211L);

        TenantRegistrationRequestVO requestVO = new TenantRegistrationRequestVO();
        requestVO.setTenantNm("기본업체");
        requestVO.setAdminEmail("basic@test.com");
        requestVO.setBusinessRegistrationNumber(BRN);
        requestVO.setCorporateNumber("123456-1234567");
        requestVO.setBusinessType("식품제조");
        requestVO.setBusinessCategory("즉석조리식품");

        TenantRegistrationResultVO result = service.registerTenant(requestVO);

        assertEquals(211L, result.getTenantId());
        verify(tenantInfoDAO, never()).expireActiveTenantSubscription(211L);
        verify(tenantInfoDAO, never()).insertActiveTenantSubscriptionByPlanCode(eq(211L), any());
    }
}
