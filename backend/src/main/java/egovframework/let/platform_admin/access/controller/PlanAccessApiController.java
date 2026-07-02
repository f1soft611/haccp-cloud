package egovframework.let.platform_admin.access.controller;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.List;
import java.util.Collections;

import org.springframework.http.HttpStatus;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.server.ResponseStatusException;

import egovframework.com.cmm.LoginVO;
import egovframework.com.cmm.util.EgovUserDetailsHelper;
import egovframework.let.platform_admin.access.web.PlanAccessLevel;
import egovframework.let.platform_admin.access.web.PlanAccessPolicy;
import egovframework.let.platform_admin.access.service.PlanAccessService;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/platform-admin/plan-access")
public class PlanAccessApiController {

    private final PlanAccessService planAccessService;

        @PlanAccessPolicy(
            menuUrl = "/platform/plans",
            featureCode = "FEATURE_PLATFORM_TENANT_MGMT",
            requiredPermissionLevel = PlanAccessLevel.READ,
            skipRolePermissionCheck = true
        )
    @GetMapping("/me")
    public Map<String, Object> getCurrentTenantPlanAccess() {
        LoginVO loginVO = resolveCurrentUser();
        Long tenantId = resolveTenantId(loginVO);
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "테넌트 정보를 확인할 수 없습니다.");
        }

        Map<String, Object> result = new LinkedHashMap<String, Object>();
        result.put("tenantId", tenantId);
        result.put("tenantCode", loginVO.getTenantCode());
        result.put("planCode", planAccessService.resolveActivePlanCode(tenantId));
        result.put("features", planAccessService.resolveFeatureEnabledMap(tenantId));
        return result;
    }

    @PlanAccessPolicy(
            menuUrl = "/platform/plans",
            featureCode = "FEATURE_PLATFORM_TENANT_MGMT",
            requiredPermissionLevel = PlanAccessLevel.READ
    )
    @GetMapping("/plans")
    public List<Map<String, Object>> listPlans() {
        return planAccessService.listPlans();
    }

    @PlanAccessPolicy(
            menuUrl = "/platform/plans",
            featureCode = "FEATURE_PLATFORM_TENANT_MGMT",
            requiredPermissionLevel = PlanAccessLevel.READ
    )
    @GetMapping("/plans/{planCode}/features")
    public Map<String, Object> getPlanFeatures(@PathVariable String planCode) {
        Map<String, Object> result = new LinkedHashMap<String, Object>();
        result.put("planCode", planCode == null ? "" : planCode.trim().toUpperCase());
        result.put("features", planAccessService.resolvePlanFeatureItems(planCode));
        return result;
    }

    @PlanAccessPolicy(
            menuUrl = "/platform/plans",
            featureCode = "FEATURE_PLATFORM_TENANT_MGMT",
            requiredPermissionLevel = PlanAccessLevel.READ
    )
    @GetMapping("/plans/{planCode}/menus")
    public Map<String, Object> getPlanMenus(@PathVariable String planCode) {
        Map<String, Object> result = new LinkedHashMap<String, Object>();
        result.put("planCode", planCode == null ? "" : planCode.trim().toUpperCase());
        result.put("menuCodes", planAccessService.resolvePlanMenuCodes(planCode));
        return result;
    }

    @PlanAccessPolicy(
            menuUrl = "/platform/plans",
            featureCode = "FEATURE_PLATFORM_TENANT_MGMT",
            requiredPermissionLevel = PlanAccessLevel.WRITE
    )
    @PutMapping("/plans/{planCode}/menus")
    public Map<String, Object> replacePlanMenus(
            @PathVariable String planCode,
            @RequestBody Map<String, List<String>> payload) {
        if (!StringUtils.hasText(planCode)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "planCode는 필수입니다.");
        }

        List<String> menuCodes = payload == null
                ? Collections.emptyList()
                : payload.getOrDefault("menuCodes", Collections.emptyList());
        planAccessService.replacePlanMenus(planCode, menuCodes);

        Map<String, Object> result = new LinkedHashMap<String, Object>();
        result.put("planCode", planCode.trim().toUpperCase());
        result.put("menuCodes", planAccessService.resolvePlanMenuCodes(planCode));
        return result;
    }

    @PlanAccessPolicy(
            menuUrl = "/platform/plans",
            featureCode = "FEATURE_PLATFORM_TENANT_MGMT",
            requiredPermissionLevel = PlanAccessLevel.READ
    )
    @GetMapping("/tenant-plan-menus")
    public Map<String, Object> getTenantPlanMenus(@RequestParam String tenantCode) {
        if (!StringUtils.hasText(tenantCode)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "tenantCode는 필수입니다.");
        }

        String normalizedTenantCode = tenantCode.trim().toUpperCase();
        Map<String, Object> result = new LinkedHashMap<String, Object>();
        result.put("tenantCode", normalizedTenantCode);
        result.put("menuCodes", planAccessService.resolveTenantPlanMenuCodes(normalizedTenantCode));
        return result;
    }

    private LoginVO resolveCurrentUser() {
        Object authenticatedUser;
        try {
            authenticatedUser = EgovUserDetailsHelper.getAuthenticatedUser();
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인 사용자 정보를 찾을 수 없습니다.");
        }

        if (!(authenticatedUser instanceof LoginVO)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인 사용자 정보를 찾을 수 없습니다.");
        }

        return (LoginVO) authenticatedUser;
    }

    private Long resolveTenantId(LoginVO loginVO) {
        if (loginVO.getTenantId() != null) {
            return loginVO.getTenantId();
        }

        if (!StringUtils.hasText(loginVO.getTenantCode())) {
            return null;
        }

        return planAccessService.resolveTenantIdByTenantCode(loginVO.getTenantCode());
    }
}
