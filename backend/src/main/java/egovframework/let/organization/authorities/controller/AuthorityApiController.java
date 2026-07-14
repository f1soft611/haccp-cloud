package egovframework.let.organization.authorities.controller;

import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;
import java.util.HashMap;

import javax.annotation.Resource;

import org.springframework.http.HttpStatus;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import egovframework.com.cmm.service.ResultVO;
import egovframework.com.cmm.LoginVO;
import egovframework.com.cmm.ResponseCode;
import egovframework.com.cmm.util.EgovUserDetailsHelper;
import egovframework.com.cmm.util.ResultVoHelper;
import egovframework.let.platform_admin.access.web.PlanAccessLevel;
import egovframework.let.platform_admin.access.web.PlanAccessPolicy;
import egovframework.let.organization.authorities.service.AuthorityService;
import egovframework.let.organization.authorities.domain.model.AuthorityMenuSaveRequestVO;
import egovframework.let.uss.auth.service.RoleInfoVO;
import egovframework.let.uss.auth.service.MenuInfoVO;
import lombok.RequiredArgsConstructor;

/**
 * 플랫폼 권한/역할 관리를 위한 컨트롤러 클래스
 * @author SHMT-MES
 * @since 2026.07.14
 * @version 1.0
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/platform-admin")
public class AuthorityApiController {

    private static final String DEFAULT_PERMISSION_ID = "PERM_WRITE";
    private static final String SYSTEM_USER_ID = "system";
    private static final int[] ALLOWED_PAGE_SIZES = {10, 20, 50};

    @Resource(name = "authorityService")
    private AuthorityService authorityService;

    @Resource(name = "resultVoHelper")
    private ResultVoHelper resultVoHelper;

        @PlanAccessPolicy(
            menuUrl = "/org/roles",
            featureCode = "FEATURE_PLATFORM_ROLE_MGMT",
            requiredPermissionLevel = PlanAccessLevel.READ
        )
    @GetMapping("/roles")
    public ResultVO listRoles(@RequestParam(required = false) String tenantCode) throws Exception {
        List<RoleInfoVO> resultList = authorityService.listRoles(resolveTenantCode(tenantCode));
        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("resultList", resultList);
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

        @PlanAccessPolicy(
            menuUrl = "/org/roles",
            featureCode = "FEATURE_PLATFORM_ROLE_MGMT",
            requiredPermissionLevel = PlanAccessLevel.READ
        )
    @GetMapping("/roles/paged")
    public ResultVO listRolesPaged(
            @RequestParam(defaultValue = "1") int pageIndex,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) String searchField,
            @RequestParam(required = false) String searchKeyword,
            @RequestParam(required = false) String tenantCode,
            @RequestParam(required = false, defaultValue = "all") String useAt) throws Exception {
        validatePage(pageIndex, pageSize);
        validateSearchField(searchField);
        validateUseAt(useAt);

        Map<String, Object> resultMap = authorityService.listRolesPaged(
                pageIndex,
                pageSize,
                searchField,
                searchKeyword,
            resolveTenantCode(tenantCode),
                useAt
        );
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    @PlanAccessPolicy(
            menuUrl = "/org/roles",
            featureCode = "FEATURE_PLATFORM_ROLE_MGMT",
            requiredPermissionLevel = PlanAccessLevel.WRITE
    )
    @PostMapping("/roles")
    public ResultVO createRole(@RequestBody RoleInfoVO payload) throws Exception {
        if (payload == null || !StringUtils.hasText(payload.getRoleCode())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "역할 코드는 필수입니다.");
        }

        payload.setTenantCode(resolveTenantCode(payload.getTenantCode()));

        RoleInfoVO item = authorityService.createRole(payload);
        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("item", item);
        resultMap.put("message", "권한이 성공적으로 등록되었습니다.");
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    @PlanAccessPolicy(
            menuUrl = "/org/roles",
            featureCode = "FEATURE_PLATFORM_ROLE_MGMT",
            requiredPermissionLevel = PlanAccessLevel.WRITE
    )
    @PatchMapping("/roles/{id}")
    public ResultVO updateRoleUseAt(@PathVariable Long id, @RequestBody RoleInfoVO payload) throws Exception {
        if (payload == null || !StringUtils.hasText(payload.getUseAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "useAt 값은 필수입니다.");
        }

        RoleInfoVO item = authorityService.updateRoleUseAt(id, payload);
        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("item", item);
        resultMap.put("message", "권한 상태가 성공적으로 변경되었습니다.");
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    @PlanAccessPolicy(
            menuUrl = "/org/roles",
            featureCode = "FEATURE_PLATFORM_ROLE_MGMT",
            requiredPermissionLevel = PlanAccessLevel.WRITE
    )
    @PutMapping("/roles/{id}")
    public ResultVO updateRole(@PathVariable Long id, @RequestBody RoleInfoVO payload) throws Exception {
        if (payload == null || !StringUtils.hasText(payload.getRoleNm())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "roleNm 값은 필수입니다.");
        }

        RoleInfoVO item = authorityService.updateRole(id, payload);
        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("item", item);
        resultMap.put("message", "권한이 성공적으로 수정되었습니다.");
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    @PlanAccessPolicy(
        menuUrl = "/org/roles",
        featureCode = "FEATURE_PLATFORM_ROLE_MGMT",
        requiredPermissionLevel = PlanAccessLevel.READ
    )
    @GetMapping("/role-menus")
    public ResultVO getRoleMenus(
            @RequestParam String roleCode,
            @RequestParam(required = false) String tenantCode) throws Exception {
        Map<String, Object> item = authorityService.getRoleMenus(roleCode, resolveTenantCode(tenantCode));
        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("item", item);
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    @PlanAccessPolicy(
        menuUrl = "/org/roles",
        featureCode = "FEATURE_PLATFORM_ROLE_MGMT",
        requiredPermissionLevel = PlanAccessLevel.WRITE
    )
    @PutMapping("/role-menus/{roleCode}")
    public ResultVO replaceRoleMenus(@PathVariable String roleCode,
            @RequestParam(required = false) String tenantCode,
            @RequestBody AuthorityMenuSaveRequestVO payload) throws Exception {
        if (payload == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "요청 본문이 필요합니다.");
        }

        Map<String, Object> item = authorityService.replaceRoleMenus(roleCode, resolveTenantCode(tenantCode), payload);
        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("item", item);
        resultMap.put("message", "권한별 메뉴가 저장되었습니다.");
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    @GetMapping("/role-menu-candidates")
    @PlanAccessPolicy(
        menuUrl = "/org/roles",
        featureCode = "FEATURE_PLATFORM_ROLE_MGMT",
        requiredPermissionLevel = PlanAccessLevel.READ
    )
    public ResultVO getRoleMenuCandidates(@RequestParam(required = false) String tenantCode) throws Exception {
        String resolvedTenantCode = resolveTenantCode(tenantCode);
        Map<String, Object> item = new LinkedHashMap<String, Object>();
        item.put("tenantCode", resolvedTenantCode);
        item.put("menuCodes", authorityService.listAllowedMenuCodesByTenantPlan(resolvedTenantCode));

        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("item", item);
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    /**
     * 현재 로그인 사용자의 접근 가능 메뉴 목록을 조회한다.
     */
    @GetMapping("/user-menus/me")
    public ResultVO listCurrentUserMenus() throws Exception {
        Object userDetails = egovframework.com.cmm.util.EgovUserDetailsHelper.getAuthenticatedUser();
        if (!(userDetails instanceof egovframework.com.cmm.LoginVO)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인 사용자 정보를 찾을 수 없습니다.");
        }

        egovframework.com.cmm.LoginVO loginVO = (egovframework.com.cmm.LoginVO) userDetails;
        String loginId = loginVO.getId();
        Long tenantId = loginVO.getTenantId();

        if (!StringUtils.hasText(loginId)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인 사용자 아이디 정보가 없습니다.");
        }

        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "사용자 테넌트 정보가 없습니다.");
        }

        List<MenuInfoVO> resultList = authorityService.listUserMenus(loginId.trim(), tenantId);
        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("resultList", resultList);
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    private void validatePage(int pageIndex, int pageSize) {
        if (pageIndex < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "pageIndex는 1 이상이어야 합니다.");
        }
        if (pageSize < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "pageSize는 1 이상이어야 합니다.");
        }
        for (int allowed : ALLOWED_PAGE_SIZES) {
            if (pageSize == allowed) {
                return;
            }
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "pageSize는 " + String.join(", ", "10", "20", "50") + " 중 하나여야 합니다.");
    }

    private void validateSearchField(String searchField) {
        if (searchField == null || searchField.isEmpty()) {
            return;
        }
        if (!searchField.equals("code") && !searchField.equals("name") && !searchField.equals("description")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "searchField는 code, name, description 중 하나여야 합니다.");
        }
    }

    private void validateUseAt(String useAt) {
        if (useAt == null || useAt.isEmpty()) {
            return;
        }
        if (!useAt.equals("Y") && !useAt.equals("N") && !useAt.equals("all")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "useAt는 Y, N, all 중 하나여야 합니다.");
        }
    }

    private String resolveTenantCode(String tenantCode) {
        if (StringUtils.hasText(tenantCode)) {
            return tenantCode.trim().toUpperCase();
        }

        Object userDetails = EgovUserDetailsHelper.getAuthenticatedUser();
        if (userDetails instanceof LoginVO) {
            LoginVO loginVO = (LoginVO) userDetails;
            String userTenantCode = loginVO.getTenantCode();
            if (StringUtils.hasText(userTenantCode)) {
                return userTenantCode.trim().toUpperCase();
            }
        }

        return "PLATFORM";
    }
}
