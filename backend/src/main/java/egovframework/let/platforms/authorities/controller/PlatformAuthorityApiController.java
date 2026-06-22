package egovframework.let.platforms.authorities.controller;

import java.util.List;
import java.util.Map;

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

import egovframework.com.cmm.service.ResultVO;
import egovframework.let.platforms.authorities.service.PlatformAuthorityService;
import egovframework.let.platforms.authorities.domain.model.PlatformRoleMenuSaveRequestVO;
import egovframework.let.uss.auth.service.AuthorityInfoVO;
import egovframework.let.uss.auth.service.MenuInfoVO;
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

    @Resource(name = "platformAuthorityService")
    private PlatformAuthorityService platformAuthorityService;

    @GetMapping("/roles")
    public List<AuthorityInfoVO> listRoles() throws Exception {
        return platformAuthorityService.listRoles();
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

        return platformAuthorityService.listRolesPaged(
                pageIndex,
                pageSize,
                searchField,
                searchKeyword,
                useAt
        );
    }

    @PostMapping("/roles")
    public AuthorityInfoVO createRole(@RequestBody AuthorityInfoVO payload) throws Exception {
        if (payload == null || !hasText(payload.getAuthorityCode())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "권한 코드는 필수입니다.");
        }

        return platformAuthorityService.createRole(payload);
    }

    @PatchMapping("/roles/{code}")
    public AuthorityInfoVO updateRoleUseAt(@PathVariable String code, @RequestBody AuthorityInfoVO payload) throws Exception {
        if (payload == null || !hasText(payload.getUseAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "useAt 값은 필수입니다.");
        }

        return platformAuthorityService.updateRoleUseAt(code, payload);
    }

    @PutMapping("/roles/{code}")
    public AuthorityInfoVO updateRole(@PathVariable String code, @RequestBody AuthorityInfoVO payload) throws Exception {
        if (payload == null || !hasText(payload.getAuthorityNm())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "authorityNm 값은 필수입니다.");
        }

        return platformAuthorityService.updateRole(code, payload);
    }

    @GetMapping("/role-menus")
    public Map<String, Object> getRoleMenus(@RequestParam String roleCode) throws Exception {
        return platformAuthorityService.getRoleMenus(roleCode);
    }

    @PutMapping("/role-menus/{roleCode}")
    public Map<String, Object> replaceRoleMenus(@PathVariable String roleCode,
            @RequestBody PlatformRoleMenuSaveRequestVO payload) throws Exception {
        if (payload == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "요청 본문이 필요합니다.");
        }

        return platformAuthorityService.replaceRoleMenus(roleCode, payload);
    }

    @GetMapping("/user-menus/{authorityCode}")
    public List<MenuInfoVO> listUserMenus(@PathVariable String authorityCode) throws Exception {
        return platformAuthorityService.listUserMenus(authorityCode.trim().toUpperCase());
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