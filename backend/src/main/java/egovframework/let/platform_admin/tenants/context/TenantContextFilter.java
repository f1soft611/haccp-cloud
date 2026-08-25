package egovframework.let.platform_admin.tenants.context;

import java.io.IOException;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import egovframework.let.platform_admin.tenants.service.PlatformTenantService;
import egovframework.let.platform_admin.tenants.service.TenantDatabaseRegistryService;
import egovframework.let.platform_admin.tenants.domain.model.TenantVO;
import lombok.extern.slf4j.Slf4j;

/**
 * 테넌트 컨텍스트 필터
 * URL 경로에서 테넌트 도메인을 추출해 도메인 매핑으로 TenantContextHolder에 설정
 *
 * 예: /f1soft.co.kr/login → f1soft.co.kr 도메인 추출 → 테넌트 조회 → Context 설정
 *
 * @author 멀티테넌트팀
 * @since 2026-06-23
 */
@Slf4j
@Component
public class TenantContextFilter extends OncePerRequestFilter {

    private static final String PLATFORM_TENANTS_API_PREFIX = "/api/v1/platform-admin/tenants/";

    @Autowired
    private PlatformTenantService tenantService;

    @Autowired
    private TenantDatabaseRegistryService tenantDatabaseRegistryService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            // 1. Host / X-Forwarded-Host 우선으로 테넌트 도메인 추출
            String requestUri = request.getRequestURI();
            String tenantDomain = resolveTenantDomain(request);

            log.debug("요청 URI: {}, 추출된 테넌트 도메인: {}", requestUri, tenantDomain);

            if (tenantDomain != null) {
                // 2. 테넌트 조회
                try {
                    TenantVO tenant = tenantService.findByAdminEmailDomain(tenantDomain);

                    if (tenant != null && "Y".equals(tenant.getUseAt())) {
                        // 3. TenantContext 설정
                        TenantContextHolder.setTenantId(tenant.getTenantId());
                        TenantContextHolder.setTenantCode(tenant.getTenantCode());
                        TenantContextHolder.setDbKey(resolveDbKey(tenant));

                        // 4. 요청 속성에 테넌트 정보 저장 (View에서 사용 가능)
                        request.setAttribute("tenantId", tenant.getTenantId());
                        request.setAttribute("tenantCode", tenant.getTenantCode());
                        request.setAttribute("tenantLogo", tenant.getLogoImage());
                        request.setAttribute("tenantName", tenant.getTenantNm());

                        log.info("테넌트 로드 성공: tenantId={}, tenantName={}, domain={}",
                                 tenant.getTenantId(), tenant.getTenantNm(), tenantDomain);
                    } else if (tenant != null && !"Y".equals(tenant.getUseAt())) {
                        log.warn("비활성화된 테넌트 요청: domain={}", tenantDomain);
                    }
                } catch (Exception e) {
                    log.warn("테넌트 조회 실패: domain={}, error={}", tenantDomain, e.getMessage());
                }
            }

            // 5. 다음 필터/핸들러로 진행
            filterChain.doFilter(request, response);

        } finally {
            // 6. TenantContext 정리 (메모리 누수 방지)
            TenantContextHolder.clear();
        }
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String requestUri = request.getRequestURI();
        if (requestUri == null) {
            return false;
        }

        if (requestUri.startsWith(PLATFORM_TENANTS_API_PREFIX)
                && requestUri.contains("/onboarding/")) {
            log.debug("테넌트 컨텍스트 필터 제외: requestUri={}", requestUri);
            return true;
        }

        return false;
    }

    private String resolveDbKey(TenantVO tenant) {
        if (PlatformTenantCodes.isPlatform(tenant.getTenantCode())) {
            return PlatformTenantCodes.CANONICAL;
        }
        return tenantDatabaseRegistryService.resolveDbKeyByTenantId(tenant.getTenantId());
    }

    private String resolveTenantDomain(HttpServletRequest request) {
        String forwardedHost = request.getHeader("X-Forwarded-Host");
        if (forwardedHost != null && !forwardedHost.trim().isEmpty()) {
            String normalized = normalizeHost(forwardedHost);
            if (normalized != null) {
                return normalized;
            }
        }

        String host = request.getHeader("Host");
        if (host != null && !host.trim().isEmpty()) {
            String normalized = normalizeHost(host);
            if (normalized != null) {
                return normalized;
            }
        }

        return extractTenantDomain(request.getRequestURI());
    }

    private String normalizeHost(String rawHost) {
        if (rawHost == null || rawHost.trim().isEmpty()) {
            return null;
        }

        String host = rawHost.trim();
        if (host.contains(",")) {
            host = host.split(",")[0].trim();
        }

        if (host.contains(":")) {
            host = host.split(":")[0];
        }

        String normalized = host.toLowerCase();
        if (normalized.contains(".") && !normalized.startsWith("http")) {
            return normalized;
        }

        return null;
    }

    /**
     * URL에서 테넌트 도메인 추출
     *
     * 예:
     * /f1soft.co.kr/login → f1soft.co.kr
     * /another.co.kr/api/users → another.co.kr
     * /admin/users → null (도메인 형식 아님)
     *
     * @param requestUri 요청 URI
     * @return 추출된 도메인 (없으면 null)
     */
    private String extractTenantDomain(String requestUri) {
        if (requestUri == null || requestUri.isEmpty()) {
            return null;
        }

        // URI를 / 기준으로 분할 (첫 번째 경로 세그먼트 추출)
        String[] parts = requestUri.split("/");

        if (parts.length > 1) {
            String potentialDomain = parts[1];

            // 도메인은 '.'를 포함해야 함 (예: f1soft.co.kr, another.com)
            if (potentialDomain.contains(".") && !potentialDomain.isEmpty()) {
                log.debug("도메인 추출 성공: {}", potentialDomain);
                return potentialDomain;
            }
        }

        log.debug("도메인 추출 실패: 유효한 도메인 형식 없음 (requestUri: {})", requestUri);
        return null;
    }
}
