package egovframework.let.platform_admin.access.web;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.http.MediaType;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import com.fasterxml.jackson.databind.ObjectMapper;

import egovframework.com.cmm.LoginVO;
import egovframework.com.cmm.util.EgovUserDetailsHelper;
import egovframework.let.platform_admin.access.service.PlanAccessService;
import egovframework.let.uss.auth.service.EgovAuthManageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class PlanAccessInterceptor implements HandlerInterceptor {

    private static final String LEVEL_READ = "read";
    private static final String LEVEL_WRITE = "write";

    private final PlanAccessService planAccessService;
    private final EgovAuthManageService egovAuthManageService;
    private final ObjectMapper objectMapper;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        PlanAccessPolicy policy = resolvePolicy(handler);
        if (policy == null) {
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

        if (!planAccessService.isFeatureEnabled(tenantId, policy.featureCode())) {
            writeError(response, HttpServletResponse.SC_FORBIDDEN, "PLAN_NOT_ALLOWED", "현재 요금제에서 허용되지 않은 기능입니다.");
            return false;
        }

        String requiredPermissionLevel = policy.requiredPermissionLevel() == PlanAccessLevel.WRITE
                ? LEVEL_WRITE
                : LEVEL_READ;

        if (!hasRolePermission(roleCode, policy.menuUrl(), requiredPermissionLevel)) {
            writeError(response, HttpServletResponse.SC_FORBIDDEN, "ROLE_NOT_ALLOWED", "현재 역할에서 허용되지 않은 기능입니다.");
            return false;
        }

        if (StringUtils.hasText(policy.limitFeatureCode())
                && !planAccessService.isWithinLimit(tenantId, policy.limitFeatureCode())) {
            writeError(response, HttpServletResponse.SC_FORBIDDEN, "QUOTA_EXCEEDED", "요금제 사용 한도를 초과했습니다.");
            return false;
        }

        return true;
    }

    private PlanAccessPolicy resolvePolicy(Object handler) {
        if (!(handler instanceof HandlerMethod)) {
            return null;
        }

        HandlerMethod handlerMethod = (HandlerMethod) handler;
        PlanAccessPolicy methodPolicy = AnnotatedElementUtils.findMergedAnnotation(
                handlerMethod.getMethod(),
                PlanAccessPolicy.class
        );
        if (methodPolicy != null) {
            return methodPolicy;
        }

        return AnnotatedElementUtils.findMergedAnnotation(
                handlerMethod.getBeanType(),
                PlanAccessPolicy.class
        );
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
