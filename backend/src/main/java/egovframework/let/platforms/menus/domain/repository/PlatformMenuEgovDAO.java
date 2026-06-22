package egovframework.let.platforms.menus.domain.repository;

import java.util.List;

import org.egovframe.rte.psl.dataaccess.EgovAbstractMapper;
import org.springframework.stereotype.Repository;

import egovframework.let.uss.auth.service.MenuInfoVO;

/**
 * 플랫폼 메뉴 DAO
 */
@Repository("platformMenuDAO")
public class PlatformMenuEgovDAO extends EgovAbstractMapper implements PlatformMenuDAO {

    /**
     * 메뉴 목록을 조회한다.
     */
    @Override
    public List<MenuInfoVO> selectMenuList(MenuInfoVO condition) throws Exception {
        return selectList("PlatformMenuDAO.selectMenuList", condition);
    }

    /**
     * 메뉴 페이징 목록을 조회한다.
     */
    @Override
    public List<MenuInfoVO> selectMenuPagedList(MenuInfoVO condition) throws Exception {
        return selectList("PlatformMenuDAO.selectMenuPagedList", condition);
    }

    /**
     * 메뉴 페이징 총 건수를 조회한다.
     */
    @Override
    public int selectMenuPagedCount(MenuInfoVO condition) throws Exception {
        Integer count = selectOne("PlatformMenuDAO.selectMenuPagedCount", condition);
        return count == null ? 0 : count;
    }

    /**
     * 메뉴를 등록한다.
     */
    @Override
    public void insertMenu(MenuInfoVO menuInfoVO) throws Exception {
        insert("PlatformMenuDAO.insertMenu", menuInfoVO);
    }

    /**
     * 메뉴 상세정보를 조회한다.
     */
    @Override
    public MenuInfoVO selectMenuDetail(MenuInfoVO condition) throws Exception {
        return selectOne("PlatformMenuDAO.selectMenuDetail", condition);
    }

    /**
     * 메뉴를 수정한다.
     */
    @Override
    public void updateMenu(MenuInfoVO menuInfoVO) throws Exception {
        update("PlatformMenuDAO.updateMenu", menuInfoVO);
    }

    /**
     * 메뉴를 삭제한다.
     */
    @Override
    public void deleteMenu(MenuInfoVO condition) throws Exception {
        delete("PlatformMenuDAO.deleteMenu", condition);
    }
}
