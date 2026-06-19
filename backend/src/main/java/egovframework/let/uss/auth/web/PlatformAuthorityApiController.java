package egovframework.let.uss.auth.web;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import javax.annotation.Resource;

import org.springframework.http.HttpStatus;
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
import org.egovframe.rte.ptl.mvc.tags.ui.pagination.PaginationInfo;

import egovframework.com.cmm.ResponseCode;
import egovframework.com.cmm.service.ResultVO;
import egovframework.let.uss.auth.service.AuthorityInfoVO;
import egovframework.let.uss.auth.service.EgovAuthManageService;
import egovframework.let.uss.auth.service.PlatformRoleMenuSaveRequestVO;
import egovframework.let.uss.auth.service.RoleMenuPermissionVO;
import lombok.RequiredArgsConstructor;

/**
 * 플랫폼 관리자 권한/권한메뉴 통합 API
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/platform-admin")
public class PlatformAuthorityApiController {

    private static final String DEFAULT_PERMISSION_ID = "PERM_WRITE";
    private static final String SYSTEM_USER_ID = "system";
    private static final int[] ALLOWED_PAGE_SIZES = {10, 20, 50};

    @Resource(name = "authManageService")
    private EgovAuthManageService authManageService;

    @GetMapping("/roles")
    public List<AuthorityInfoVO> listRoles() throws Exception {
        return authManageService.selectAuthorityList();
    }

    @GetMapping("/roles/paged")
    public ResultVO listRolesPaged(
            @RequestParam(defaultValue = "1") int pageIndex,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) String searchField,
            @RequestParam(required = false) String searchKeyword,
            @RequestParam(required = false, defaultValue = "all") String useAt) throws Exception {
        validatePage(pageIndex, pageSize);
        validateSearchField(searchField);
        validateUseAt(useAt);

        AuthorityInfoVO condition = new AuthorityInfoVO();
        condition.setPageIndex(pageIndex);
        condition.setPageSize(pageSize);
        condition.setSearchField(hasText(searchField) ? searchField.trim() : "");
        condition.setSearchKeyword(hasText(searchKeyword) ? searchKeyword.trim() : "");
        condition.setUseAt(hasText(useAt) ? useAt.trim().toUpperCase() : "all");

        PaginationInfo paginationInfo = new PaginationInfo();
        paginationInfo.setCurrentPageNo(condition.getPageIndex());
        paginationInfo.setRecordCountPerPage(condition.getPageSize());
        paginationInfo.setPageSize(condition.getPageSize());

        condition.setFirstIndex(paginationInfo.getFirstRecordIndex());
        condition.setLastIndex(paginationInfo.getLastRecordIndex());
        condition.setRecordCountPerPage(paginationInfo.getRecordCountPerPage());

        List<AuthorityInfoVO> roleList = authManageService.selectAuthorityPagedList(condition);
        int totalCount = authManageService.selectAuthorityPagedCount(condition);
        paginationInfo.setTotalRecordCount(totalCount);

        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("roleList", roleList);
        resultMap.put("totalCount", totalCount);
        resultMap.put("paginationInfo", paginationInfo);

        ResultVO resultVO = new ResultVO();
        resultVO.setResult(resultMap);
        resultVO.setResultCode(ResponseCode.SUCCESS.getCode());
        resultVO.setResultMessage(ResponseCode.SUCCESS.getMessage());
        return resultVO;
    }

    @PostMapping("/roles")
    public AuthorityInfoVO createRole(@RequestBody AuthorityInfoVO payload) throws Exception {
        if (payload == null || !hasText(payload.getAuthorityCode())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "권한 코드는 필수입니다.");
        }

        payload.setAuthorityCode(toUpper(payload.getAuthorityCode()));
        payload.setUseAt("Y");

        if (!hasText(payload.getFrstRegisterId())) {
            payload.setFrstRegisterId(SYSTEM_USER_ID);
        }
        if (!hasText(payload.getLastUpdusrId())) {
            payload.setLastUpdusrId(SYSTEM_USER_ID);
        }

        authManageService.insertAuthority(payload);
        return payload;
    }

    @PatchMapping("/roles/{code}")
    public AuthorityInfoVO updateRoleUseAt(@PathVariable String code, @RequestBody AuthorityInfoVO payload) throws Exception {
        if (payload == null || !hasText(payload.getUseAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "useAt 값은 필수입니다.");
        }

        payload.setAuthorityCode(toUpper(code));
        payload.setUseAt(toUpper(payload.getUseAt()));

        if (!hasText(payload.getLastUpdusrId())) {
            payload.setLastUpdusrId(SYSTEM_USER_ID);
        }

        AuthorityInfoVO.validateUpdatePolicy(payload);
        authManageService.updateAuthorityUseAt(payload);
        return payload;
    }

    @PutMapping("/roles/{code}")
    public AuthorityInfoVO updateRole(@PathVariable String code, @RequestBody AuthorityInfoVO payload) throws Exception {
        if (payload == null || !hasText(payload.getAuthorityNm())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "authorityNm 값은 필수입니다.");
        }

        payload.setAuthorityCode(toUpper(code));
        payload.setAuthorityNm(payload.getAuthorityNm().trim());
        payload.setUseAt(hasText(payload.getUseAt()) ? toUpper(payload.getUseAt()) : "Y");

        if (!hasText(payload.getLastUpdusrId())) {
            payload.setLastUpdusrId(SYSTEM_USER_ID);
        }

        AuthorityInfoVO.validateUpdatePolicy(payload);
        authManageService.updateAuthority(payload);
        return payload;
    }

    @GetMapping("/role-menus")
    public Map<String, Object> getRoleMenus(@RequestParam String roleCode) throws Exception {
        String normalizedRoleCode = toUpper(roleCode);
        if (!hasText(normalizedRoleCode)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "roleCode는 필수입니다.");
        }

        RoleMenuPermissionVO condition = new RoleMenuPermissionVO();
        condition.setAuthorityCode(normalizedRoleCode);
        List<RoleMenuPermissionVO> permissions = authManageService.selectRoleMenuPermissionList(condition);

        Set<String> menuIdSet = new LinkedHashSet<>();
        for (RoleMenuPermissionVO permission : permissions) {
            if (permission != null && hasText(permission.getMenuId())) {
                menuIdSet.add(toUpper(permission.getMenuId()));
            }
        }

        Map<String, Object> response = new java.util.LinkedHashMap<>();
        response.put("roleCode", normalizedRoleCode);
        response.put("menuIds", new ArrayList<>(menuIdSet));
        return response;
    }

    @PutMapping("/role-menus/{roleCode}")
    public Map<String, Object> replaceRoleMenus(@PathVariable String roleCode,
            @RequestBody PlatformRoleMenuSaveRequestVO payload) throws Exception {
        if (payload == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "요청 본문이 필요합니다.");
        }

        payload.setRoleCode(roleCode);
        payload.normalize();

        if (!hasText(payload.getRoleCode())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "roleCode는 필수입니다.");
        }

        authManageService.deleteRoleMenuPermissionsByAuthority(payload.getRoleCode());

        for (String menuId : payload.getMenuIds()) {
            RoleMenuPermissionVO item = new RoleMenuPermissionVO();
            item.setAuthorityCode(payload.getRoleCode());
            item.setMenuId(menuId);
            item.setPermissionId(DEFAULT_PERMISSION_ID);
            item.setUseAt("Y");
            item.setFrstRegisterId(SYSTEM_USER_ID);
            item.setLastUpdusrId(SYSTEM_USER_ID);
            authManageService.insertRoleMenuPermission(item);
        }

        Map<String, Object> response = new java.util.LinkedHashMap<>();
        response.put("roleCode", payload.getRoleCode());
        response.put("menuIds", payload.getMenuIds());
        return response;
    }

    private String toUpper(String value) {
        if (value == null) {
            return "";
        }
        return value.trim().toUpperCase();
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
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
        if (!hasText(searchField)) {
            return;
        }
        String normalized = searchField.trim();
        if (!"code".equals(normalized) && !"name".equals(normalized) && !"description".equals(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "searchField 값이 유효하지 않습니다.");
        }
    }

    private void validateUseAt(String useAt) {
        if (!hasText(useAt)) {
            return;
        }
        String normalized = useAt.trim().toUpperCase();
        if (!"Y".equals(normalized) && !"N".equals(normalized) && !"ALL".equals(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "useAt 값이 유효하지 않습니다.");
        }
    }
}