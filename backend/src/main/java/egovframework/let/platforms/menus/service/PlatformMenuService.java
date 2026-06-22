package egovframework.let.platforms.menus.service;

import java.util.List;
import java.util.Map;

import egovframework.com.cmm.service.ResultVO;
import egovframework.let.uss.auth.service.MenuInfoVO;

public interface PlatformMenuService {

    List<MenuInfoVO> listMenus(String menuNm, String parentMenuId) throws Exception;

    ResultVO listMenusPaged(
            int pageIndex,
            int pageSize,
            String searchField,
            String searchKeyword,
            String useAt) throws Exception;

    MenuInfoVO createMenu(MenuInfoVO menuInfoVO) throws Exception;

    MenuInfoVO updateMenu(String menuId, MenuInfoVO menuInfoVO) throws Exception;

    void deleteMenu(String menuId) throws Exception;

    MenuInfoVO getMenuDetail(String menuId) throws Exception;

    Map<String, Object> buildPagedResultMap(List<MenuInfoVO> menuList, int totalCount, Object paginationInfo);
}
