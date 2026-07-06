package egovframework.let.platform_admin.menus.service.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import javax.annotation.Resource;

import org.egovframe.rte.ptl.mvc.tags.ui.pagination.PaginationInfo;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import egovframework.com.cmm.ResponseCode;
import egovframework.com.cmm.service.ResultVO;
import egovframework.let.platform_admin.menus.domain.repository.PlatformMenuDAO;
import egovframework.let.platform_admin.menus.service.PlatformMenuService;
import egovframework.let.uss.auth.service.MenuInfoVO;

/**
 * 플랫폼 메뉴 서비스 구현체
 * @author SHMT-MES
 * @since 2026.06.22
 * @version 1.0
 * @see
 *
 * <pre>
 * << 개정이력(Modification Information) >>
 *
 *   수정일      수정자           수정내용
 *  -------    --------    ---------------------------
 *   2026.06.22 SHMT-MES          최초 생성
 *
 * </pre>
 */
@Service("platformMenuService")
public class PlatformMenuServiceImpl implements PlatformMenuService {

    @Resource(name = "platformMenuDAO")
    private PlatformMenuDAO platformMenuDAO;

    @Override
    public List<MenuInfoVO> listMenus(String menuNm, Long parentMenuId) throws Exception {
        MenuInfoVO condition = new MenuInfoVO();
        condition.setMenuNm(menuNm);
        condition.setParentMenuId(parentMenuId);
        return platformMenuDAO.selectMenuList(condition);
    }

    @Override
    public ResultVO listMenusPaged(
            int pageIndex,
            int pageSize,
            String searchField,
            String searchKeyword,
            String useAt) throws Exception {
        MenuInfoVO condition = new MenuInfoVO();
        condition.setPageIndex(pageIndex);
        condition.setPageSize(pageSize);
        condition.setSearchField(searchField);
        condition.setSearchKeyword(searchKeyword);
        condition.setUseAt(useAt);

        PaginationInfo paginationInfo = new PaginationInfo();
        paginationInfo.setCurrentPageNo(condition.getPageIndex());
        paginationInfo.setRecordCountPerPage(condition.getPageSize());
        paginationInfo.setPageSize(condition.getPageSize());

        condition.setFirstIndex(paginationInfo.getFirstRecordIndex());
        condition.setLastIndex(paginationInfo.getLastRecordIndex());
        condition.setRecordCountPerPage(paginationInfo.getRecordCountPerPage());

        List<MenuInfoVO> menuList = platformMenuDAO.selectMenuPagedList(condition);
        int totalCount = platformMenuDAO.selectMenuPagedCount(condition);
        paginationInfo.setTotalRecordCount(totalCount);

        Map<String, Object> resultMap = buildPagedResultMap(menuList, totalCount, paginationInfo);

        ResultVO resultVO = new ResultVO();
        resultVO.setResult(resultMap);
        resultVO.setResultCode(ResponseCode.SUCCESS.getCode());
        resultVO.setResultMessage(ResponseCode.SUCCESS.getMessage());
        return resultVO;
    }

    @Override
    public MenuInfoVO createMenu(MenuInfoVO menuInfoVO) throws Exception {
        if (hasText(menuInfoVO.getMenuCode())) {
            menuInfoVO.setMenuCode(menuInfoVO.getMenuCode().trim().toUpperCase());
        } else {
            menuInfoVO.setMenuCode(generateMenuCode());
        }

        platformMenuDAO.insertMenu(menuInfoVO);

        MenuInfoVO detailCondition = new MenuInfoVO();
        detailCondition.setMenuCode(menuInfoVO.getMenuCode());
        MenuInfoVO created = platformMenuDAO.selectMenuDetail(detailCondition);
        if (created == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "메뉴 등록 결과를 조회할 수 없습니다.");
        }

        return created;
    }

    @Override
    public MenuInfoVO updateMenu(Long menuId, MenuInfoVO menuInfoVO) throws Exception {
        MenuInfoVO beforeCondition = new MenuInfoVO();
        beforeCondition.setMenuId(menuId);
        MenuInfoVO before = platformMenuDAO.selectMenuDetail(beforeCondition);
        if (before == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "수정할 메뉴가 존재하지 않습니다.");
        }

        menuInfoVO.setMenuId(menuId);
        platformMenuDAO.updateMenu(menuInfoVO);

        MenuInfoVO afterCondition = new MenuInfoVO();
        afterCondition.setMenuId(menuId);
        MenuInfoVO updated = platformMenuDAO.selectMenuDetail(afterCondition);
        if (updated == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "메뉴 수정 결과를 조회할 수 없습니다.");
        }

        return updated;
    }

    @Override
    public MenuInfoVO patchMenu(Long menuId, MenuInfoVO menuInfoVO) throws Exception {
        MenuInfoVO before = getMenuDetail(menuId);
        if (before == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "수정할 메뉴가 존재하지 않습니다.");
        }

        MenuInfoVO merged = mergePatch(before, menuInfoVO);
        return updateMenu(menuId, merged);
    }

    @Override
    public void deleteMenu(Long menuId) throws Exception {
        MenuInfoVO existing = getMenuDetail(menuId);
        if (existing == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "삭제할 메뉴가 존재하지 않습니다.");
        }

        MenuInfoVO childCondition = new MenuInfoVO();
        childCondition.setParentMenuId(menuId);
        List<MenuInfoVO> children = platformMenuDAO.selectMenuList(childCondition);
        if (children != null && !children.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "하위 메뉴가 있는 메뉴는 삭제할 수 없습니다.");
        }

        MenuInfoVO deleteCondition = new MenuInfoVO();
        deleteCondition.setMenuId(menuId);

        try {
            platformMenuDAO.deleteRoleMenuPermissionsByMenuId(menuId);
            platformMenuDAO.deleteMenu(deleteCondition);
        } catch (DataAccessException e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "이 메뉴를 참조하는 데이터가 있어 삭제할 수 없습니다. 권한-메뉴 매핑 또는 관련 데이터를 먼저 정리해 주세요.",
                    e
            );
        }
    }

    @Override
    public MenuInfoVO getMenuDetail(Long menuId) throws Exception {
        MenuInfoVO condition = new MenuInfoVO();
        condition.setMenuId(menuId);
        return platformMenuDAO.selectMenuDetail(condition);
    }

    @Override
    public Map<String, Object> buildPagedResultMap(List<MenuInfoVO> menuList, int totalCount, Object paginationInfo) {
        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("menuList", menuList);
        resultMap.put("totalCount", totalCount);
        resultMap.put("paginationInfo", paginationInfo);
        return resultMap;
    }

    private String generateMenuCode() {
        return "MENU_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
    }

    private MenuInfoVO mergePatch(MenuInfoVO before, MenuInfoVO patch) {
        MenuInfoVO merged = new MenuInfoVO();

        merged.setMenuId(before.getMenuId());
        merged.setMenuCode(before.getMenuCode());
        merged.setMenuNm(before.getMenuNm());
        merged.setMenuDc(before.getMenuDc());
        merged.setParentMenuId(before.getParentMenuId());
        merged.setMenuOrdr(before.getMenuOrdr());
        merged.setMenuUrl(before.getMenuUrl());
        merged.setIconNm(before.getIconNm());
        merged.setUseAt(before.getUseAt());
        merged.setFrstRegisterId(before.getFrstRegisterId());
        merged.setLastUpdusrId(before.getLastUpdusrId());

        if (patch.getParentMenuId() != null) {
            merged.setParentMenuId(patch.getParentMenuId());
        }
        if (patch.isMenuOrdrSpecified()) {
            merged.setMenuOrdr(patch.getMenuOrdr());
        }
        if (hasText(patch.getMenuNm())) {
            merged.setMenuNm(patch.getMenuNm().trim());
        }
        if (hasText(patch.getMenuDc())) {
            merged.setMenuDc(patch.getMenuDc().trim());
        }
        if (hasText(patch.getMenuUrl())) {
            merged.setMenuUrl(patch.getMenuUrl().trim());
        }
        if (hasText(patch.getIconNm())) {
            merged.setIconNm(patch.getIconNm().trim());
        }
        if (hasText(patch.getUseAt())) {
            merged.setUseAt(patch.getUseAt().trim().toUpperCase());
        }
        if (hasText(patch.getLastUpdusrId())) {
            merged.setLastUpdusrId(patch.getLastUpdusrId().trim());
        }

        return merged;
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
