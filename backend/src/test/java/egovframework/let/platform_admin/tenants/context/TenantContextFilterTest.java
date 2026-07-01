package egovframework.let.platform_admin.tenants.context;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

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
    private MockHttpServletRequest request;
    private MockHttpServletResponse response;
    private FilterChain filterChain;

    @BeforeEach
    void setUp() {
        tenantService = mock(PlatformTenantService.class);
        filter = new TenantContextFilter();
        ReflectionTestUtils.setField(filter, "tenantService", tenantService);
        request = new MockHttpServletRequest();
        response = new MockHttpServletResponse();
        filterChain = mock(FilterChain.class);
        TenantContextHolder.clear();
    }

    @DisplayName("공개 온보딩 검증 API는 테넌트 컨텍스트 필터를 건너뛴다")
    @Test
    void publicOnboardingVerificationApiIsSkipped() throws Exception {
        request.setRequestURI("/api/v1/tenants/onboarding/verify-email");

        filter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verifyNoInteractions(tenantService);
        assertFalse(TenantContextHolder.hasContext());
    }
}