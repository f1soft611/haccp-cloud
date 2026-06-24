package egovframework.let.platforms.access.controller;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import egovframework.com.cmm.LoginVO;
import egovframework.com.cmm.util.EgovUserDetailsHelper;
import egovframework.let.platforms.access.service.PlanAccessService;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/platform-admin/plan-access")
public class PlanAccessApiController {

    private final PlanAccessService planAccessService;

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
