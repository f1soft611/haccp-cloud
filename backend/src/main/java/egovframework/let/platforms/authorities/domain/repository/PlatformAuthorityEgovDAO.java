package egovframework.let.platforms.authorities.domain.repository;

import java.util.List;

import org.egovframe.rte.psl.dataaccess.EgovAbstractMapper;
import org.springframework.stereotype.Repository;

import egovframework.let.uss.auth.service.AuthorityInfoVO;
import egovframework.let.uss.auth.service.MenuInfoVO;
import egovframework.let.uss.auth.service.RoleMenuPermissionVO;

/**
 * 플랫폼 권한 DAO
 */
@Repository("platformAuthorityDAO")
public class PlatformAuthorityEgovDAO extends EgovAbstractMapper implements PlatformAuthorityDAO {

    /**
     * 권한 목록을 조회한다.
     */
    @Override
    public List<AuthorityInfoVO> selectAuthorityList() throws Exception {
        return selectList("PlatformAuthorityDAO.selectAuthorityList");
    }

    /**
     * 권한 페이징 목록을 조회한다.
     */
    @Override
    public List<AuthorityInfoVO> selectAuthorityPagedList(AuthorityInfoVO condition) throws Exception {
        return selectList("PlatformAuthorityDAO.selectAuthorityPagedList", condition);
    }

    /**
     * 권한 페이징 총 건수를 조회한다.
     */
    @Override
    public int selectAuthorityPagedCount(AuthorityInfoVO condition) throws Exception {
        Integer count = selectOne("PlatformAuthorityDAO.selectAuthorityPagedCount", condition);
        return count == null ? 0 : count;
    }

    /**
     * 권한을 등록한다.
     */
    @Override
    public void insertAuthority(AuthorityInfoVO payload) throws Exception {
        insert("PlatformAuthorityDAO.insertAuthority", payload);
    }

    /**
     * 권한 사용여부를 수정한다.
     */
    @Override
    public void updateAuthorityUseAt(AuthorityInfoVO payload) throws Exception {
        update("PlatformAuthorityDAO.updateAuthorityUseAt", payload);
    }

    /**
     * 권한 정보를 수정한다.
     */
    @Override
    public void updateAuthority(AuthorityInfoVO payload) throws Exception {
        update("PlatformAuthorityDAO.updateAuthority", payload);
    }

    /**
     * 권한별 메뉴권한 목록을 조회한다.
     */
    @Override
    public List<RoleMenuPermissionVO> selectRoleMenuPermissionList(RoleMenuPermissionVO condition) throws Exception {
        return selectList("PlatformAuthorityDAO.selectRoleMenuPermissionList", condition);
    }

    /**
     * 권한코드 기준으로 메뉴권한을 삭제한다.
     */
    @Override
    public void deleteRoleMenuPermissionsByAuthority(String authorityCode) throws Exception {
        delete("PlatformAuthorityDAO.deleteRoleMenuPermissionsByAuthority", authorityCode);
    }

    /**
     * 권한-메뉴 권한을 등록한다.
     */
    @Override
    public void insertRoleMenuPermission(RoleMenuPermissionVO item) throws Exception {
        insert("PlatformAuthorityDAO.insertRoleMenuPermission", item);
    }

    /**
     * 사용자 접근 가능한 메뉴를 조회한다.
     */
    @Override
    public List<MenuInfoVO> selectUserAccessibleMenus(String authorityCode) throws Exception {
        return selectList("PlatformAuthorityDAO.selectUserAccessibleMenus", authorityCode);
    }
}
