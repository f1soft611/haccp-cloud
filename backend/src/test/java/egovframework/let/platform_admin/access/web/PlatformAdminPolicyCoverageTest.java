package egovframework.let.platform_admin.access.web;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;

import org.junit.jupiter.api.Test;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.web.bind.annotation.RequestMapping;

import egovframework.let.organization.authorities.controller.AuthorityApiController;
import egovframework.let.platform_admin.access.controller.PlanAccessApiController;
import egovframework.let.platform_admin.dashboard.controller.PlatformDashboardApiController;
import egovframework.let.platform_admin.loginhistory.controller.LoginHistoryApiController;
import egovframework.let.platform_admin.menus.controller.PlatformMenuApiController;
import egovframework.let.platform_admin.tenants.controller.PlatformTenantApiController;
import egovframework.let.uss.umt.web.EgovMberManageApiController;

class PlatformAdminPolicyCoverageTest {

    @Test
    void allPlatformAdminEndpointsShouldDeclarePlanAccessPolicy() {
        List<Class<?>> controllerClasses = platformAdminControllers();

        List<String> missingPolicies = new ArrayList<String>();

        for (Class<?> controllerClass : controllerClasses) {
            List<String> classPaths = resolvePaths(controllerClass, true);
            for (Method method : controllerClass.getDeclaredMethods()) {
                List<String> methodPaths = resolvePaths(method, false);
                if (methodPaths.isEmpty()) {
                    continue;
                }

                boolean requiresPlatformAdminPolicy = false;
                for (String classPath : classPaths) {
                    for (String methodPath : methodPaths) {
                        String fullPath = joinPaths(classPath, methodPath);
                        if (fullPath.startsWith("/api/platform-admin")) {
                            requiresPlatformAdminPolicy = true;
                            break;
                        }
                    }
                    if (requiresPlatformAdminPolicy) {
                        break;
                    }
                }

                if (requiresPlatformAdminPolicy) {
                    if (isPolicyOptional(controllerClass, method)) {
                        continue;
                    }
                    PlanAccessPolicy policy = AnnotatedElementUtils.findMergedAnnotation(method, PlanAccessPolicy.class);
                    if (policy == null) {
                        missingPolicies.add(controllerClass.getSimpleName() + "#" + method.getName());
                    }
                }
            }
        }

        assertTrue(
                missingPolicies.isEmpty(),
                "PlanAccessPolicy 누락 API: " + missingPolicies
        );
    }

    @Test
    void planAccessPolicyMappingShouldMatchApprovedSnapshot() {
        List<Class<?>> controllerClasses = new ArrayList<Class<?>>(platformAdminControllers());
        controllerClasses.add(EgovMberManageApiController.class);

        Set<String> actualMappings = new TreeSet<String>();
        for (Class<?> controllerClass : controllerClasses) {
            List<String> classPaths = resolvePaths(controllerClass, true);
            for (Method method : controllerClass.getDeclaredMethods()) {
                PlanAccessPolicy policy = AnnotatedElementUtils.findMergedAnnotation(method, PlanAccessPolicy.class);
                if (policy == null) {
                    continue;
                }

                List<String> methodPaths = resolvePaths(method, false);
                if (methodPaths.isEmpty()) {
                    continue;
                }

                boolean trackedEndpoint = false;
                for (String classPath : classPaths) {
                    for (String methodPath : methodPaths) {
                        String fullPath = joinPaths(classPath, methodPath);
                        if (fullPath.startsWith("/api/platform-admin") || fullPath.startsWith("/members")) {
                            trackedEndpoint = true;
                            break;
                        }
                    }
                    if (trackedEndpoint) {
                        break;
                    }
                }

                if (!trackedEndpoint) {
                    continue;
                }

                String limitCode = policy.limitFeatureCode();
                if (limitCode == null || limitCode.trim().isEmpty()) {
                    limitCode = "-";
                }

                actualMappings.add(
                        policy.menuUrl()
                                + "|" + policy.featureCode()
                                + "|" + policy.requiredPermissionLevel().name()
                                + "|" + limitCode
                );
            }
        }

        Set<String> expectedMappings = new TreeSet<String>(Arrays.asList(
                "/members|FEATURE_TENANT_USER_MGMT|WRITE|LIMIT_USER_COUNT",
                "/org/roles|FEATURE_PLATFORM_ROLE_MGMT|READ|-",
                "/org/roles|FEATURE_PLATFORM_ROLE_MGMT|WRITE|-",
                "/platform/login-history|FEATURE_AUDIT_LOG|READ|-",
                "/platform/menus|FEATURE_PLATFORM_MENU_MGMT|READ|-",
                "/platform/menus|FEATURE_PLATFORM_MENU_MGMT|WRITE|-",
                "/platform/plans|FEATURE_PLATFORM_TENANT_MGMT|READ|-",
                "/platform/plans|FEATURE_PLATFORM_TENANT_MGMT|WRITE|-",
                "/platform/tenants|FEATURE_PLATFORM_TENANT_MGMT|READ|-",
                "/platform/tenants|FEATURE_PLATFORM_TENANT_MGMT|WRITE|-",
                "/users|FEATURE_TENANT_USER_MGMT|READ|-",
                "/users|FEATURE_TENANT_USER_MGMT|WRITE|-"
        ));

        assertEquals(
                expectedMappings,
                actualMappings,
                "정책 매핑이 변경되었습니다. backend/Docs/plan-access-policy-mapping.md 문서 및 정책 리뷰를 함께 갱신하세요."
        );
    }

    private List<Class<?>> platformAdminControllers() {
        return Arrays.asList(
                PlatformMenuApiController.class,
                LoginHistoryApiController.class,
                AuthorityApiController.class,
                PlatformTenantApiController.class,
                PlatformDashboardApiController.class,
                PlanAccessApiController.class
        );
    }

    private boolean isPolicyOptional(Class<?> controllerClass, Method method) {
        if (PlatformMenuApiController.class.equals(controllerClass) && "listCommonMenus".equals(method.getName())) {
            return true;
        }
        if (AuthorityApiController.class.equals(controllerClass) && "listCurrentUserMenus".equals(method.getName())) {
            return true;
        }
        return false;
    }

    private List<String> resolvePaths(java.lang.reflect.AnnotatedElement element, boolean defaultToRoot) {
        RequestMapping mapping = AnnotatedElementUtils.findMergedAnnotation(element, RequestMapping.class);
        if (mapping == null) {
            return defaultToRoot ? Arrays.asList("") : new ArrayList<String>();
        }

        if (mapping.path().length > 0) {
            return Arrays.asList(mapping.path());
        }
        if (mapping.value().length > 0) {
            return Arrays.asList(mapping.value());
        }
        return Arrays.asList("");
    }

    private String joinPaths(String classPath, String methodPath) {
        String left = normalizePath(classPath);
        String right = normalizePath(methodPath);

        if ("/".equals(left)) {
            return right;
        }
        if ("/".equals(right)) {
            return left;
        }
        if (left.endsWith("/")) {
            left = left.substring(0, left.length() - 1);
        }
        return left + right;
    }

    private String normalizePath(String path) {
        if (path == null || path.isEmpty()) {
            return "/";
        }
        String normalized = path.trim();
        if (!normalized.startsWith("/")) {
            normalized = "/" + normalized;
        }
        return normalized;
    }
}