package egovframework.let.uss.auth.web;

import java.util.ArrayList;
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

    @Resource(name = "authManageService")
    private EgovAuthManageService authManageService;

    @GetMapping("/roles")
    public List<AuthorityInfoVO> listRoles() throws Exception {
        return authManageService.selectAuthorityList();
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

        return Map.of(
                "roleCode", normalizedRoleCode,
                "menuIds", new ArrayList<>(menuIdSet));
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

        return Map.of(
                "roleCode", payload.getRoleCode(),
                "menuIds", payload.getMenuIds());
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
}