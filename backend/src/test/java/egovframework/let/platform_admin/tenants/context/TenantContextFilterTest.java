package egovframework.let.platform_admin.tenants.context;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import javax.servlet.FilterChain;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.util.ReflectionTestUtils;

import egovframework.let.platform_admin.tenants.service.PlatformTenantService;

class TenantContextFilterTest {

    private TenantContextFilter filter;
    private PlatformTenantService tenantService;
    private egovframework.let.platform_admin.tenants.service.TenantDatabaseRegistryService tenantDatabaseRegistryService;
    private MockHttpServletRequest request;
    private MockHttpServletResponse response;
    private FilterChain filterChain;

    @BeforeEach
    void setUp() {
        tenantService = mock(PlatformTenantService.class);
        tenantDatabaseRegistryService = mock(egovframework.let.platform_admin.tenants.service.TenantDatabaseRegistryService.class);
        filter = new TenantContextFilter();
        ReflectionTestUtils.setField(filter, "tenantService", tenantService);
        ReflectionTestUtils.setField(filter, "tenantDatabaseRegistryService", tenantDatabaseRegistryService);
        when(tenantDatabaseRegistryService.resolveDbKeyByTenantId(77L)).thenReturn("TENANT_77");
        request = new MockHttpServletRequest();
        response = new MockHttpServletResponse();
        filterChain = mock(FilterChain.class);
        TenantContextHolder.clear();
    }

    @DisplayName("공개 온보딩 검증 API는 테넌트 컨텍스트 필터를 건너뛴다")
    @Test
    void publicOnboardingVerificationApiIsSkipped() throws Exception {
        request.setRequestURI("/api/v1/platform-admin/tenants/onboarding/verifications");

        filter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verifyNoInteractions(tenantService);
        assertFalse(TenantContextHolder.hasContext());
    }

    @DisplayName("X-Forwarded-Host 헤더 우선순위로 tenant를 해석하고 registry dbKey를 저장한다")
    @Test
    void resolvesTenantFromForwardedHostHeader() throws Exception {
        request.setRequestURI("/api/v1/users");
        request.addHeader("X-Forwarded-Host", "tenant.example.com:443");
        request.addHeader("Host", "platform.example.com");

        egovframework.let.platform_admin.tenants.domain.model.TenantVO tenant = new egovframework.let.platform_admin.tenants.domain.model.TenantVO();
        tenant.setTenantId(77L);
        tenant.setTenantCode("TENANT_0001");
        tenant.setTenantNm("테스트테넌트");
        tenant.setUseAt("Y");
        when(tenantService.findByAdminEmailDomain("tenant.example.com")).thenReturn(tenant);

        FilterChain capturingChain = (servletRequest, servletResponse) -> {
            assertTrue(TenantContextHolder.hasContext());
            assertEquals(Long.valueOf(77L), TenantContextHolder.getTenantId());
            assertEquals("0001", TenantContextHolder.getTenantCode());
            assertEquals("TENANT_77", TenantContextHolder.getDbKey());
        };

        filter.doFilter(request, response, capturingChain);

        verify(tenantService).findByAdminEmailDomain(eq("tenant.example.com"));
        assertFalse(TenantContextHolder.hasContext());
    }
}