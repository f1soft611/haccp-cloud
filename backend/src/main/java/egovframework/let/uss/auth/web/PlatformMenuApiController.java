package egovframework.let.uss.auth.web;

import java.util.List;
import java.util.HashMap;
import java.util.Map;

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
import org.egovframe.rte.ptl.mvc.tags.ui.pagination.PaginationInfo;

import egovframework.com.cmm.ResponseCode;
import egovframework.com.cmm.service.ResultVO;
import egovframework.let.uss.auth.service.EgovAuthManageService;
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

    @Resource(name = "authManageService")
    private EgovAuthManageService authManageService;

    @GetMapping
    public List<MenuInfoVO> listMenus(
            @RequestParam(required = false) String menuNm,
            @RequestParam(required = false) String parentMenuId) throws Exception {
        MenuInfoVO condition = new MenuInfoVO();
        condition.setMenuNm(menuNm);
        condition.setParentMenuId(normalizeNullable(parentMenuId));
        return authManageService.selectMenuList(condition);
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

        MenuInfoVO condition = new MenuInfoVO();
        condition.setPageIndex(pageIndex);
        condition.setPageSize(pageSize);
        condition.setSearchField(normalizeNullable(searchField));
        condition.setSearchKeyword(normalizeNullable(searchKeyword));
        condition.setUseAt(hasText(useAt) ? useAt.trim().toUpperCase() : "all");

        PaginationInfo paginationInfo = new PaginationInfo();
        paginationInfo.setCurrentPageNo(condition.getPageIndex());
        paginationInfo.setRecordCountPerPage(condition.getPageSize());
        paginationInfo.setPageSize(condition.getPageSize());

        condition.setFirstIndex(paginationInfo.getFirstRecordIndex());
        condition.setLastIndex(paginationInfo.getLastRecordIndex());
        condition.setRecordCountPerPage(paginationInfo.getRecordCountPerPage());

        List<MenuInfoVO> menuList = authManageService.selectMenuPagedList(condition);
        int totalCount = authManageService.selectMenuPagedCount(condition);
        paginationInfo.setTotalRecordCount(totalCount);

        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("menuList", menuList);
        resultMap.put("totalCount", totalCount);
        resultMap.put("paginationInfo", paginationInfo);

        ResultVO resultVO = new ResultVO();
        resultVO.setResult(resultMap);
        resultVO.setResultCode(ResponseCode.SUCCESS.getCode());
        resultVO.setResultMessage(ResponseCode.SUCCESS.getMessage());
        return resultVO;
    }

    @PostMapping
    public MenuInfoVO createMenu(@RequestBody MenuInfoVO menuInfoVO) throws Exception {
        normalizePayload(menuInfoVO);
        validateForCreateOrUpdate(menuInfoVO, null);

        authManageService.insertMenu(menuInfoVO);

        MenuInfoVO detailCondition = new MenuInfoVO();
        detailCondition.setMenuId(menuInfoVO.getMenuId());
        MenuInfoVO created = authManageService.selectMenuDetail(detailCondition);
        if (created == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "메뉴 등록 결과를 조회할 수 없습니다.");
        }

        return created;
    }

    @PatchMapping("/{menuId}")
    public MenuInfoVO updateMenu(@PathVariable String menuId, @RequestBody MenuInfoVO menuInfoVO) throws Exception {
        menuInfoVO.setMenuId(menuId);
        normalizePayload(menuInfoVO);
        validateForCreateOrUpdate(menuInfoVO, menuId);

        MenuInfoVO beforeCondition = new MenuInfoVO();
        beforeCondition.setMenuId(menuId);
        MenuInfoVO before = authManageService.selectMenuDetail(beforeCondition);
        if (before == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "수정할 메뉴가 존재하지 않습니다.");
        }

        authManageService.updateMenu(menuInfoVO);

        MenuInfoVO afterCondition = new MenuInfoVO();
        afterCondition.setMenuId(menuId);
        MenuInfoVO updated = authManageService.selectMenuDetail(afterCondition);
        if (updated == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "메뉴 수정 결과를 조회할 수 없습니다.");
        }

        return updated;
    }

    @DeleteMapping("/{menuId}")
    public void deleteMenu(@PathVariable String menuId) throws Exception {
        MenuInfoVO detailCondition = new MenuInfoVO();
        detailCondition.setMenuId(menuId);
        MenuInfoVO existing = authManageService.selectMenuDetail(detailCondition);
        if (existing == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "삭제할 메뉴가 존재하지 않습니다.");
        }

        MenuInfoVO childCondition = new MenuInfoVO();
        childCondition.setParentMenuId(menuId);
        List<MenuInfoVO> children = authManageService.selectMenuList(childCondition);
        if (children != null && !children.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "하위 메뉴가 있는 메뉴는 삭제할 수 없습니다.");
        }

        MenuInfoVO deleteCondition = new MenuInfoVO();
        deleteCondition.setMenuId(menuId);
        authManageService.deleteMenu(deleteCondition);
    }

    private void validateForCreateOrUpdate(MenuInfoVO menuInfoVO, String selfMenuId) throws Exception {
        if (!hasText(menuInfoVO.getMenuNm())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "메뉴명은 필수입니다.");
        }

        if (!hasText(menuInfoVO.getMenuUrl())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "메뉴 URL은 필수입니다.");
        }

        String parentMenuId = normalizeNullable(menuInfoVO.getParentMenuId());
        menuInfoVO.setParentMenuId(parentMenuId);

        if (parentMenuId == null) {
            return;
        }

        if (hasText(selfMenuId) && selfMenuId.equals(parentMenuId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "상위 메뉴는 자기 자신으로 지정할 수 없습니다.");
        }

        MenuInfoVO parentCondition = new MenuInfoVO();
        parentCondition.setMenuId(parentMenuId);
        MenuInfoVO parent = authManageService.selectMenuDetail(parentCondition);
        if (parent == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "상위 메뉴가 존재하지 않습니다.");
        }
    }

    private void normalizePayload(MenuInfoVO menuInfoVO) {
        menuInfoVO.setParentMenuId(normalizeNullable(menuInfoVO.getParentMenuId()));

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
