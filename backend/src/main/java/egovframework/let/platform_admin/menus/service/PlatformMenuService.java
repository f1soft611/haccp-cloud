package egovframework.let.platform_admin.menus.service;

import java.util.List;
import java.util.Map;

import egovframework.com.cmm.service.ResultVO;
import egovframework.let.uss.auth.service.MenuInfoVO;

/**
 * 플랫폼 메뉴 서비스
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
public interface PlatformMenuService {

    /**
     * 메뉴 목록을 조회한다.
     * @param menuNm 메뉴명
     * @param parentMenuId 상위 메뉴 ID
     * @return 메뉴 목록
     * @throws Exception
     */
    List<MenuInfoVO> listMenus(String menuNm, Long parentMenuId) throws Exception;

    /**
     * 메뉴 목록(페이징)을 조회한다.
     * @param pageIndex 페이지 인덱스
     * @param pageSize 페이지 크기
     * @param searchField 검색 필드
     * @param searchKeyword 검색 키워드
     * @param useAt 사용 여부
     * @return 조회 결과
     * @throws Exception
     */
    ResultVO listMenusPaged(
            int pageIndex,
            int pageSize,
            String searchField,
            String searchKeyword,
            String useAt) throws Exception;

    /**
     * 메뉴를 등록한다.
     * @param menuInfoVO 등록 정보
     * @return 등록된 메뉴
     * @throws Exception
     */
    MenuInfoVO createMenu(MenuInfoVO menuInfoVO) throws Exception;

    /**
     * 메뉴를 수정한다.
     * @param menuId 메뉴 ID
     * @param menuInfoVO 수정 정보
     * @return 수정된 메뉴
     * @throws Exception
     */
    MenuInfoVO updateMenu(Long menuId, MenuInfoVO menuInfoVO) throws Exception;

    /**
     * 메뉴를 부분 수정한다.
     * @param menuId 메뉴 ID
     * @param menuInfoVO 수정 정보
     * @return 수정된 메뉴
     * @throws Exception
     */
    MenuInfoVO patchMenu(Long menuId, MenuInfoVO menuInfoVO) throws Exception;

    /**
     * 메뉴를 삭제한다.
     * @param menuId 메뉴 ID
     * @throws Exception
     */
    void deleteMenu(Long menuId) throws Exception;

    /**
     * 메뉴 상세정보를 조회한다.
     * @param menuId 메뉴 ID
     * @return 메뉴 정보
     * @throws Exception
     */
    MenuInfoVO getMenuDetail(Long menuId) throws Exception;

    /**
     * 페이징 결과 맵을 생성한다.
     * @param menuList 메뉴 목록
     * @param totalCount 총 건수
     * @param paginationInfo 페이징 정보
     * @return 결과 맵
     */
    Map<String, Object> buildPagedResultMap(List<MenuInfoVO> menuList, int totalCount, Object paginationInfo);
}
