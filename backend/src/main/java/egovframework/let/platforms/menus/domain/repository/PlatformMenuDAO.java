package egovframework.let.platforms.menus.domain.repository;

import java.util.List;

import egovframework.let.uss.auth.service.MenuInfoVO;

/**
 * 플랫폼 메뉴 DAO
 * @author AI Assistant
 * @since 2026.06.22
 * @version 1.0
 */
public interface PlatformMenuDAO {

    /**
     * 메뉴 목록을 조회한다.
     * @param condition 조회 조건
     * @return 메뉴 목록
     * @throws Exception
     */
    List<MenuInfoVO> selectMenuList(MenuInfoVO condition) throws Exception;

    /**
     * 메뉴 목록(페이징)을 조회한다.
     * @param condition 조회 조건
     * @return 메뉴 목록
     * @throws Exception
     */
    List<MenuInfoVO> selectMenuPagedList(MenuInfoVO condition) throws Exception;

    /**
     * 메뉴 목록(페이징) 총 건수를 조회한다.
     * @param condition 조회 조건
     * @return 총 건수
     * @throws Exception
     */
    int selectMenuPagedCount(MenuInfoVO condition) throws Exception;

    /**
     * 메뉴를 등록한다.
     * @param menuInfoVO 등록 정보
     * @throws Exception
     */
    void insertMenu(MenuInfoVO menuInfoVO) throws Exception;

    /**
     * 메뉴 상세정보를 조회한다.
     * @param condition 조회 조건
     * @return 메뉴 정보
     * @throws Exception
     */
    MenuInfoVO selectMenuDetail(MenuInfoVO condition) throws Exception;

    /**
     * 메뉴를 수정한다.
     * @param menuInfoVO 수정 정보
     * @throws Exception
     */
    void updateMenu(MenuInfoVO menuInfoVO) throws Exception;

    /**
     * 메뉴를 삭제한다.
     * @param condition 삭제 조건
     * @throws Exception
     */
    void deleteMenu(MenuInfoVO condition) throws Exception;
}
