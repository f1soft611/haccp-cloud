package egovframework.let.platforms.menus.service.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.annotation.Resource;

import org.egovframe.rte.ptl.mvc.tags.ui.pagination.PaginationInfo;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import egovframework.com.cmm.ResponseCode;
import egovframework.com.cmm.service.ResultVO;
import egovframework.let.platforms.menus.service.PlatformMenuService;
import egovframework.let.uss.auth.service.EgovAuthManageService;
import egovframework.let.uss.auth.service.MenuInfoVO;

@Service("platformMenuService")
public class PlatformMenuServiceImpl implements PlatformMenuService {

    @Resource(name = "authManageService")
    private EgovAuthManageService authManageService;

    @Override
    public List<MenuInfoVO> listMenus(String menuNm, String parentMenuId) throws Exception {
        MenuInfoVO condition = new MenuInfoVO();
        condition.setMenuNm(menuNm);
        condition.setParentMenuId(parentMenuId);
        return authManageService.selectMenuList(condition);
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

        List<MenuInfoVO> menuList = authManageService.selectMenuPagedList(condition);
        int totalCount = authManageService.selectMenuPagedCount(condition);
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
        authManageService.insertMenu(menuInfoVO);

        MenuInfoVO detailCondition = new MenuInfoVO();
        detailCondition.setMenuId(menuInfoVO.getMenuId());
        MenuInfoVO created = authManageService.selectMenuDetail(detailCondition);
        if (created == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "메뉴 등록 결과를 조회할 수 없습니다.");
        }

        return created;
    }

    @Override
    public MenuInfoVO updateMenu(String menuId, MenuInfoVO menuInfoVO) throws Exception {
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

    @Override
    public void deleteMenu(String menuId) throws Exception {
        MenuInfoVO existing = getMenuDetail(menuId);
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

    @Override
    public MenuInfoVO getMenuDetail(String menuId) throws Exception {
        MenuInfoVO condition = new MenuInfoVO();
        condition.setMenuId(menuId);
        return authManageService.selectMenuDetail(condition);
    }

    @Override
    public Map<String, Object> buildPagedResultMap(List<MenuInfoVO> menuList, int totalCount, Object paginationInfo) {
        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("menuList", menuList);
        resultMap.put("totalCount", totalCount);
        resultMap.put("paginationInfo", paginationInfo);
        return resultMap;
    }
}
