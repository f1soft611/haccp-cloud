package egovframework.let.platforms.access.web;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.util.StringUtils;
import org.springframework.web.servlet.HandlerInterceptor;

import com.fasterxml.jackson.databind.ObjectMapper;

import egovframework.com.cmm.LoginVO;
import egovframework.com.cmm.util.EgovUserDetailsHelper;
import egovframework.let.platforms.access.service.PlanAccessService;
import egovframework.let.uss.auth.service.EgovAuthManageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class PlanAccessInterceptor implements HandlerInterceptor {

    private static final String LEVEL_READ = "read";
    private static final String LEVEL_WRITE = "write";
    private static final AntPathMatcher PATH_MATCHER = new AntPathMatcher();

    private static final List<EndpointAccessRule> RULES = Arrays.asList(
            new EndpointAccessRule("GET", "/api/platform-admin/login-history/**", "/platform/login-history", LEVEL_READ,
                    "FEATURE_AUDIT_LOG", null),

            // Platform menu management
            new EndpointAccessRule("GET", "/api/platform-admin/menus/**", "/platform/menus", LEVEL_READ,
                    "FEATURE_PLATFORM_MENU_MGMT", null),
            new EndpointAccessRule("POST", "/api/platform-admin/menus/**", "/platform/menus", LEVEL_WRITE,
                    "FEATURE_PLATFORM_MENU_MGMT", null),
            new EndpointAccessRule("PATCH", "/api/platform-admin/menus/**", "/platform/menus", LEVEL_WRITE,
                    "FEATURE_PLATFORM_MENU_MGMT", null),
            new EndpointAccessRule("DELETE", "/api/platform-admin/menus/**", "/platform/menus", LEVEL_WRITE,
                    "FEATURE_PLATFORM_MENU_MGMT", null),

            // Platform role management
            new EndpointAccessRule("GET", "/api/platform-admin/roles/**", "/org/roles", LEVEL_READ,
                "FEATURE_PLATFORM_ROLE_MGMT", null),
            new EndpointAccessRule("POST", "/api/platform-admin/roles/**", "/org/roles", LEVEL_WRITE,
                "FEATURE_PLATFORM_ROLE_MGMT", null),
            new EndpointAccessRule("PATCH", "/api/platform-admin/roles/**", "/org/roles", LEVEL_WRITE,
                "FEATURE_PLATFORM_ROLE_MGMT", null),
            new EndpointAccessRule("PUT", "/api/platform-admin/roles/**", "/org/roles", LEVEL_WRITE,
                "FEATURE_PLATFORM_ROLE_MGMT", null),

            // Platform role-menu mapping
            new EndpointAccessRule("GET", "/api/platform-admin/role-menus/**", "/org/roles", LEVEL_READ,
                "FEATURE_PLATFORM_ROLE_MGMT", null),
            new EndpointAccessRule("PUT", "/api/platform-admin/role-menus/**", "/org/roles", LEVEL_WRITE,
                "FEATURE_PLATFORM_ROLE_MGMT", null),

            // Platform tenant management
            new EndpointAccessRule("POST", "/api/platform-admin/tenants/**", "/platform/tenants", LEVEL_WRITE,
                "FEATURE_PLATFORM_TENANT_MGMT", null),

            // Tenant member management
            new EndpointAccessRule("GET", "/members", "/users", LEVEL_READ,
                "FEATURE_TENANT_USER_MGMT", null),
            new EndpointAccessRule("GET", "/members/insert", "/users", LEVEL_READ,
                "FEATURE_TENANT_USER_MGMT", null),
                    new EndpointAccessRule("POST", "/members/insert", "/members", LEVEL_WRITE,
                    "FEATURE_TENANT_USER_MGMT", "LIMIT_USER_COUNT")
            ,
            new EndpointAccessRule("PUT", "/members/update", "/users", LEVEL_WRITE,
                "FEATURE_TENANT_USER_MGMT", null),
            new EndpointAccessRule("GET", "/members/update/**", "/users", LEVEL_READ,
                "FEATURE_TENANT_USER_MGMT", null)
    );

    private final PlanAccessService planAccessService;
    private final EgovAuthManageService egovAuthManageService;
    private final ObjectMapper objectMapper;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        EndpointAccessRule matchedRule = resolveRule(request);
        if (matchedRule == null) {
            return true;
        }

        LoginVO loginVO = resolveLoginUser();
        if (loginVO == null) {
            writeError(response, HttpServletResponse.SC_UNAUTHORIZED, "UNAUTHORIZED", "로그인 정보가 필요합니다.");
            return false;
        }

        Long tenantId = resolveTenantId(loginVO);
        if (tenantId == null) {
            writeError(response, HttpServletResponse.SC_FORBIDDEN, "TENANT_CONTEXT_REQUIRED", "테넌트 정보가 없습니다.");
            return false;
        }

        String roleCode = normalizeRoleCode(loginVO.getRoleCode());
        if (!StringUtils.hasText(roleCode)) {
            writeError(response, HttpServletResponse.SC_FORBIDDEN, "ROLE_REQUIRED", "사용자 역할 정보가 없습니다.");
            return false;
        }

        if (!planAccessService.isFeatureEnabled(tenantId, matchedRule.getFeatureCode())) {
            writeError(response, HttpServletResponse.SC_FORBIDDEN, "PLAN_NOT_ALLOWED", "현재 요금제에서 허용되지 않은 기능입니다.");
            return false;
        }

        if (!hasRolePermission(roleCode, matchedRule.getMenuUrl(), matchedRule.getRequiredPermissionLevel())) {
            writeError(response, HttpServletResponse.SC_FORBIDDEN, "ROLE_NOT_ALLOWED", "현재 역할에서 허용되지 않은 기능입니다.");
            return false;
        }

        if (StringUtils.hasText(matchedRule.getLimitFeatureCode())
                && !planAccessService.isWithinLimit(tenantId, matchedRule.getLimitFeatureCode())) {
            writeError(response, HttpServletResponse.SC_FORBIDDEN, "QUOTA_EXCEEDED", "요금제 사용 한도를 초과했습니다.");
            return false;
        }

        return true;
    }

    private EndpointAccessRule resolveRule(HttpServletRequest request) {
        String requestPath = request.getRequestURI();
        String method = request.getMethod();

        for (EndpointAccessRule rule : RULES) {
            if (!rule.getHttpMethod().equalsIgnoreCase(method)) {
                continue;
            }
            if (PATH_MATCHER.match(rule.getPathPattern(), requestPath)) {
                return rule;
            }
        }

        return null;
    }

    private LoginVO resolveLoginUser() {
        try {
            Object authenticatedUser = EgovUserDetailsHelper.getAuthenticatedUser();
            if (authenticatedUser instanceof LoginVO) {
                return (LoginVO) authenticatedUser;
            }
            return null;
        } catch (Exception ex) {
            return null;
        }
    }

    private Long resolveTenantId(LoginVO loginVO) {
        if (loginVO.getTenantId() != null) {
            return loginVO.getTenantId();
        }

        if (StringUtils.hasText(loginVO.getTenantCode())) {
            return planAccessService.resolveTenantIdByTenantCode(loginVO.getTenantCode());
        }

        return null;
    }

    private boolean hasRolePermission(String roleCode, String menuUrl, String requiredPermissionLevel) {
        try {
            String permission = egovAuthManageService.checkUserMenuPermission(roleCode, menuUrl);
            if (!StringUtils.hasText(permission) || "none".equalsIgnoreCase(permission)) {
                return false;
            }

            if (LEVEL_READ.equalsIgnoreCase(requiredPermissionLevel)) {
                return LEVEL_READ.equalsIgnoreCase(permission) || LEVEL_WRITE.equalsIgnoreCase(permission);
            }

            return LEVEL_WRITE.equalsIgnoreCase(permission);
        } catch (Exception ex) {
            log.warn("Role permission check failed. roleCode={}, menuUrl={}, reason={}",
                    roleCode, menuUrl, ex.getMessage());
            return false;
        }
    }

    private String normalizeRoleCode(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim().toUpperCase();
    }

    private void writeError(HttpServletResponse response, int status, String errorCode, String message) throws IOException {
        response.setStatus(status);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        ErrorResponse payload = new ErrorResponse(errorCode, message);
        response.getWriter().write(objectMapper.writeValueAsString(payload));
    }

    @RequiredArgsConstructor
    private static class ErrorResponse {
        private final String code;
        private final String message;

        public String getCode() {
            return code;
        }

        public String getMessage() {
            return message;
        }
    }
}
