package egovframework.let.platforms.roles.controller;

import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;

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
import egovframework.let.platforms.roles.service.PlatformRoleService;
import egovframework.let.platforms.roles.domain.model.PlatformRoleMenuSaveRequestVO;
import egovframework.let.uss.auth.service.RoleInfoVO;
import egovframework.let.uss.auth.service.MenuInfoVO;
import lombok.RequiredArgsConstructor;

/**
 * 플랫폼 관리자 역할/역할-메뉴 통합 API
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/platform-admin")
public class PlatformRoleApiController {

    private static final String DEFAULT_PERMISSION_ID = "PERM_WRITE";
    private static final String SYSTEM_USER_ID = "system";
    private static final int[] ALLOWED_PAGE_SIZES = {10, 20, 50};

    @Resource(name = "platformRoleService")
    private PlatformRoleService platformRoleService;

    @GetMapping("/roles")
    public List<RoleInfoVO> listRoles(@RequestParam(required = false) String tenantCode) throws Exception {
        return platformRoleService.listRoles(tenantCode);
    }

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

        return platformRoleService.listRolesPaged(
                pageIndex,
                pageSize,
                searchField,
                searchKeyword,
                tenantCode,
                useAt
        );
    }

    @PostMapping("/roles")
    public RoleInfoVO createRole(@RequestBody RoleInfoVO payload) throws Exception {
        if (payload == null || !StringUtils.hasText(payload.getRoleCode())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "역할 코드는 필수입니다.");
        }

        if (!StringUtils.hasText(payload.getTenantCode())) {
            payload.setTenantCode("PLATFORM");
        }

        return platformRoleService.createRole(payload);
    }

    @PatchMapping("/roles/{id}")
    public RoleInfoVO updateRoleUseAt(@PathVariable Long id, @RequestBody RoleInfoVO payload) throws Exception {
        if (payload == null || !StringUtils.hasText(payload.getUseAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "useAt 값은 필수입니다.");
        }

        return platformRoleService.updateRoleUseAt(id, payload);
    }

    @PutMapping("/roles/{id}")
    public RoleInfoVO updateRole(@PathVariable Long id, @RequestBody RoleInfoVO payload) throws Exception {
        if (payload == null || !StringUtils.hasText(payload.getRoleNm())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "roleNm 값은 필수입니다.");
        }

        return platformRoleService.updateRole(id, payload);
    }

    @GetMapping("/role-menus")
    public Map<String, Object> getRoleMenus(
            @RequestParam String roleCode,
            @RequestParam(required = false) String tenantCode) throws Exception {
        return platformRoleService.getRoleMenus(roleCode, tenantCode);
    }

    @PutMapping("/role-menus/{roleCode}")
    public Map<String, Object> replaceRoleMenus(@PathVariable String roleCode,
            @RequestParam(required = false) String tenantCode,
            @RequestBody PlatformRoleMenuSaveRequestVO payload) throws Exception {
        if (payload == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "요청 본문이 필요합니다.");
        }

        return platformRoleService.replaceRoleMenus(roleCode, tenantCode, payload);
    }

    @GetMapping("/role-menu-candidates")
    public Map<String, Object> getRoleMenuCandidates(@RequestParam String tenantCode) throws Exception {
        Map<String, Object> result = new LinkedHashMap<String, Object>();
        result.put("tenantCode", tenantCode == null ? "" : tenantCode.trim().toUpperCase());
        result.put("menuCodes", platformRoleService.listAllowedMenuCodesByTenantPlan(tenantCode));
        return result;
    }

    /**
     * 현재 로그인 사용자의 권한에 따른 접근 가능 메뉴 목록 조회
     * JWT 토큰의 roleCode를 SecurityContext에서 읽어 권한 확정
     */
    @GetMapping("/user-menus/me")
    public List<MenuInfoVO> listCurrentUserMenus() throws Exception {
        Object userDetails = egovframework.com.cmm.util.EgovUserDetailsHelper.getAuthenticatedUser();
        if (!(userDetails instanceof egovframework.com.cmm.LoginVO)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인 사용자 정보를 찾을 수 없습니다.");
        }

        egovframework.com.cmm.LoginVO loginVO = (egovframework.com.cmm.LoginVO) userDetails;
        String roleCode = loginVO.getRoleCode();

        if (!StringUtils.hasText(roleCode)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "사용자 권한 정보가 없습니다.");
        }

        return platformRoleService.listUserMenus(roleCode.trim().toUpperCase());
    }

    private void validatePage(int pageIndex, int pageSize) {
        if (pageIndex < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "pageIndex는 1 이상이어야 합니다.");
        }
        boolean allowed = false;
        for (int allowedPageSize : ALLOWED_PAGE_SIZES) {
            if (pageSize == allowedPageSize) {
                allowed = true;
                break;
            }
        }
        if (!allowed) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "pageSize는 10, 20, 50만 허용됩니다.");
        }
    }

    private void validateSearchField(String searchField) {
        if (!StringUtils.hasText(searchField)) {
            return;
        }
        String normalized = searchField.trim();
        if (!"code".equals(normalized) && !"name".equals(normalized) && !"description".equals(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "searchField 값이 유효하지 않습니다.");
        }
    }

    private void validateUseAt(String useAt) {
        if (!StringUtils.hasText(useAt)) {
            return;
        }
        String normalized = useAt.trim().toUpperCase();
        if (!"Y".equals(normalized) && !"N".equals(normalized) && !"ALL".equals(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "useAt 값이 유효하지 않습니다.");
        }
    }
}