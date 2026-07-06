package egovframework.let.platform_admin.tenants.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

import egovframework.let.platform_admin.tenants.domain.model.TenantRegistrationRequestVO;
import egovframework.let.platform_admin.tenants.domain.model.TenantRegistrationResultVO;
import egovframework.let.platform_admin.tenants.domain.repository.TenantInfoDAO;
import egovframework.let.platform_admin.tenants.service.impl.PlatformTenantServiceImpl;

class PlatformTenantServiceImplTest {

    private static final DateTimeFormatter TENANT_CODE_DATE_FORMATTER = DateTimeFormatter.ofPattern("yyMMdd");
    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Seoul");

    @DisplayName("업체 등록 시 법인번호/업종/업태 컬럼까지 저장한다")
    @Test
    void registerTenant_savesExtendedFields() {
        TenantInfoDAO tenantInfoDAO = mock(TenantInfoDAO.class);
        PlatformTenantServiceImpl service = new PlatformTenantServiceImpl();
        ReflectionTestUtils.setField(service, "tenantInfoDAO", tenantInfoDAO);

        String datePrefix = TENANT_CODE_DATE_FORMATTER.format(LocalDate.now(BUSINESS_ZONE));
        String previousCode = datePrefix + "0007";
        String nextCode = datePrefix + "0008";

        when(tenantInfoDAO.selectActiveTenantCountByCorporateNumber("1234561234567")).thenReturn(0);
        when(tenantInfoDAO.selectMaxTenantCodeByDatePrefix(datePrefix)).thenReturn(previousCode);
        when(tenantInfoDAO.insertTenant(
                eq(nextCode),
                eq("테스트업체"),
                eq("admin@test.com"),
                eq("123456-1234567"),
                eq("식품제조"),
                eq("즉석조리식품")))
            .thenReturn(1);
        when(tenantInfoDAO.selectTenantIdByCode(nextCode)).thenReturn(124L);

        TenantRegistrationRequestVO requestVO = new TenantRegistrationRequestVO();
        requestVO.setTenantNm("테스트업체");
        requestVO.setAdminEmail("admin@test.com");
        requestVO.setCorporateNumber("123456-1234567");
        requestVO.setBusinessType("식품제조");
        requestVO.setBusinessCategory("즉석조리식품");

        TenantRegistrationResultVO result = service.registerTenant(requestVO);

        assertEquals(124L, result.getTenantId());
        assertEquals("TENANT_" + nextCode, result.getTenantCode());
        assertEquals("123456-1234567", result.getCorporateNumber());
        assertEquals("식품제조", result.getBusinessType());
        assertEquals("즉석조리식품", result.getBusinessCategory());

        verify(tenantInfoDAO).selectActiveTenantCountByCorporateNumber("1234561234567");
        verify(tenantInfoDAO).insertTenant(
            eq(nextCode),
                eq("테스트업체"),
                eq("admin@test.com"),
                eq("123456-1234567"),
                eq("식품제조"),
                eq("즉석조리식품"));
    }

    @DisplayName("활성 업체에 동일 사업자번호가 있으면 등록에 실패한다")
    @Test
    void registerTenant_failsWhenActiveCorporateNumberDuplicated() {
        TenantInfoDAO tenantInfoDAO = mock(TenantInfoDAO.class);
        PlatformTenantServiceImpl service = new PlatformTenantServiceImpl();
        ReflectionTestUtils.setField(service, "tenantInfoDAO", tenantInfoDAO);

        TenantRegistrationRequestVO requestVO = new TenantRegistrationRequestVO();
        requestVO.setTenantNm("테스트업체");
        requestVO.setAdminEmail("admin@test.com");
        requestVO.setCorporateNumber("123456-1234567");
        requestVO.setBusinessType("식품제조");
        requestVO.setBusinessCategory("즉석조리식품");

        when(tenantInfoDAO.selectActiveTenantCountByCorporateNumber("1234561234567")).thenReturn(1);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> service.registerTenant(requestVO));
        assertEquals("이미 등록된 활성 업체의 사업자번호입니다", ex.getMessage());
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

        String datePrefix = TENANT_CODE_DATE_FORMATTER.format(LocalDate.now(BUSINESS_ZONE));
        String nextCode = datePrefix + "0008";

        when(tenantInfoDAO.selectActiveTenantCountByCorporateNumber("1234561234567")).thenReturn(0);
        when(tenantInfoDAO.selectMaxTenantCodeByDatePrefix(datePrefix)).thenReturn(datePrefix + "0007");
        when(tenantInfoDAO.insertTenant(
                eq(nextCode),
                eq("테스트업체"),
                eq("admin@test.com"),
                eq("123456-1234567"),
                eq("식품제조"),
                eq("즉석조리식품")))
            .thenThrow(new DuplicateKeyException("duplicate tenant code"));

        TenantRegistrationRequestVO requestVO = new TenantRegistrationRequestVO();
        requestVO.setTenantNm("테스트업체");
        requestVO.setAdminEmail("admin@test.com");
        requestVO.setCorporateNumber("123456-1234567");
        requestVO.setBusinessType("식품제조");
        requestVO.setBusinessCategory("즉석조리식품");

        assertThrows(DuplicateKeyException.class, () -> service.registerTenant(requestVO));
        verify(tenantInfoDAO).selectMaxTenantCodeByDatePrefix(datePrefix);
    }

    @DisplayName("업체 등록 시 planCode가 있으면 활성 구독을 생성한다")
    @Test
    void registerTenant_createsActiveSubscriptionWhenPlanCodeProvided() {
        TenantInfoDAO tenantInfoDAO = mock(TenantInfoDAO.class);
        PlatformTenantServiceImpl service = new PlatformTenantServiceImpl();
        ReflectionTestUtils.setField(service, "tenantInfoDAO", tenantInfoDAO);

        String datePrefix = TENANT_CODE_DATE_FORMATTER.format(LocalDate.now(BUSINESS_ZONE));
        String nextCode = datePrefix + "0009";

        when(tenantInfoDAO.selectActiveTenantCountByCorporateNumber("1234561234567")).thenReturn(0);
        when(tenantInfoDAO.selectMaxTenantCodeByDatePrefix(datePrefix)).thenReturn(datePrefix + "0008");
        when(tenantInfoDAO.insertTenant(
                eq(nextCode),
                eq("플랜업체"),
                eq("plan@test.com"),
                eq("123456-1234567"),
                eq("식품제조"),
                eq("즉석조리식품")))
            .thenReturn(1);
        when(tenantInfoDAO.selectTenantIdByCode(nextCode)).thenReturn(209L);
        when(tenantInfoDAO.insertActiveTenantSubscriptionByPlanCode(209L, "A")).thenReturn(1);

        TenantRegistrationRequestVO requestVO = new TenantRegistrationRequestVO();
        requestVO.setTenantNm("플랜업체");
        requestVO.setAdminEmail("plan@test.com");
        requestVO.setCorporateNumber("123456-1234567");
        requestVO.setBusinessType("식품제조");
        requestVO.setBusinessCategory("즉석조리식품");
        requestVO.setPlanCode("a");

        TenantRegistrationResultVO result = service.registerTenant(requestVO);

        assertEquals(209L, result.getTenantId());
        verify(tenantInfoDAO).expireActiveTenantSubscription(209L);
        verify(tenantInfoDAO).insertActiveTenantSubscriptionByPlanCode(209L, "A");
    }

    @DisplayName("업체 등록 시 planCode가 없으면 구독을 생성하지 않는다")
    @Test
    void registerTenant_skipsSubscriptionWhenPlanCodeMissing() {
        TenantInfoDAO tenantInfoDAO = mock(TenantInfoDAO.class);
        PlatformTenantServiceImpl service = new PlatformTenantServiceImpl();
        ReflectionTestUtils.setField(service, "tenantInfoDAO", tenantInfoDAO);

        String datePrefix = TENANT_CODE_DATE_FORMATTER.format(LocalDate.now(BUSINESS_ZONE));
        String nextCode = datePrefix + "0010";

        when(tenantInfoDAO.selectActiveTenantCountByCorporateNumber("1234561234567")).thenReturn(0);
        when(tenantInfoDAO.selectMaxTenantCodeByDatePrefix(datePrefix)).thenReturn(datePrefix + "0009");
        when(tenantInfoDAO.insertTenant(
                eq(nextCode),
                eq("기본업체"),
                eq("basic@test.com"),
                eq("123456-1234567"),
                eq("식품제조"),
                eq("즉석조리식품")))
            .thenReturn(1);
        when(tenantInfoDAO.selectTenantIdByCode(nextCode)).thenReturn(210L);

        TenantRegistrationRequestVO requestVO = new TenantRegistrationRequestVO();
        requestVO.setTenantNm("기본업체");
        requestVO.setAdminEmail("basic@test.com");
        requestVO.setCorporateNumber("123456-1234567");
        requestVO.setBusinessType("식품제조");
        requestVO.setBusinessCategory("즉석조리식품");

        TenantRegistrationResultVO result = service.registerTenant(requestVO);

        assertEquals(210L, result.getTenantId());
        verify(tenantInfoDAO, never()).expireActiveTenantSubscription(210L);
        verify(tenantInfoDAO, never()).insertActiveTenantSubscriptionByPlanCode(eq(210L), any());
    }
}
