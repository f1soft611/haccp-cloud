package egovframework.let.platforms.menus.controller;

import java.util.List;

import javax.annotation.Resource;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import egovframework.com.cmm.service.ResultVO;
import egovframework.let.platforms.menus.service.PlatformMenuService;
import egovframework.let.uss.auth.service.MenuInfoVO;
import lombok.RequiredArgsConstructor;

/**
 * 플랫폼 관리자 메뉴 관리 API
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/platform-admin/menus")
public class PlatformMenuApiController {

    private static final int[] ALLOWED_PAGE_SIZES = {10, 20, 50};

    @Resource(name = "platformMenuService")
    private PlatformMenuService platformMenuService;

    @GetMapping
    public List<MenuInfoVO> listMenus(
            @RequestParam(required = false) String menuNm,
            @RequestParam(required = false) Long parentMenuId) throws Exception {
        return platformMenuService.listMenus(menuNm, parentMenuId);
    }

    @GetMapping("/paged")
    public ResultVO listMenusPaged(
            @RequestParam(defaultValue = "1") int pageIndex,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) String searchField,
            @RequestParam(required = false) String searchKeyword,
            @RequestParam(required = false, defaultValue = "all") String useAt) throws Exception {
        validatePage(pageIndex, pageSize);
        validateSearchField(searchField);
        validateUseAt(useAt);

        return platformMenuService.listMenusPaged(
                pageIndex,
                pageSize,
                normalizeNullable(searchField),
                normalizeNullable(searchKeyword),
                hasText(useAt) ? useAt.trim().toUpperCase() : "all"
        );
    }

    @PostMapping
    public MenuInfoVO createMenu(@RequestBody MenuInfoVO menuInfoVO) throws Exception {
        normalizePayload(menuInfoVO);
        validateForCreateOrUpdate(menuInfoVO, null);
        return platformMenuService.createMenu(menuInfoVO);
    }

    @PatchMapping("/{menuId}")
    public MenuInfoVO updateMenu(@PathVariable Long menuId, @RequestBody MenuInfoVO menuInfoVO) throws Exception {
        menuInfoVO.setMenuId(menuId);
        normalizePayload(menuInfoVO);
        validateForCreateOrUpdate(menuInfoVO, menuId);
        return platformMenuService.updateMenu(menuId, menuInfoVO);
    }

    @DeleteMapping("/{menuId}")
    public void deleteMenu(@PathVariable Long menuId) throws Exception {
        platformMenuService.deleteMenu(menuId);
    }

    private void validateForCreateOrUpdate(MenuInfoVO menuInfoVO, Long selfMenuId) throws Exception {
        if (!hasText(menuInfoVO.getMenuNm())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "메뉴명은 필수입니다.");
        }

        if (!hasText(menuInfoVO.getMenuUrl())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "메뉴 URL은 필수입니다.");
        }

        Long parentMenuId = menuInfoVO.getParentMenuId();

        if (parentMenuId == null) {
            return;
        }

        if (selfMenuId != null && selfMenuId.equals(parentMenuId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "상위 메뉴는 자기 자신으로 지정할 수 없습니다.");
        }

        MenuInfoVO parent = platformMenuService.getMenuDetail(parentMenuId);
        if (parent == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "상위 메뉴가 존재하지 않습니다.");
        }
    }

    private void normalizePayload(MenuInfoVO menuInfoVO) {
        if (!hasText(menuInfoVO.getUseAt())) {
            menuInfoVO.setUseAt("Y");
        }

        if (!hasText(menuInfoVO.getIconNm())) {
            menuInfoVO.setIconNm("Menu");
        }

        if (!hasText(menuInfoVO.getFrstRegisterId())) {
            menuInfoVO.setFrstRegisterId("system");
        }

        if (!hasText(menuInfoVO.getLastUpdusrId())) {
            menuInfoVO.setLastUpdusrId("system");
        }
    }

    private String normalizeNullable(String value) {
        if (!hasText(value)) {
            return null;
        }
        return value.trim();
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
        if (!"menuNm".equals(normalized) && !"menuDc".equals(normalized) && !"menuUrl".equals(normalized)) {
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
