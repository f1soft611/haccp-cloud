package egovframework.let.organization.authorities.domain.repository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.egovframe.rte.psl.dataaccess.EgovAbstractMapper;
import org.springframework.stereotype.Repository;

import egovframework.let.uss.auth.service.RoleInfoVO;
import egovframework.let.uss.auth.service.MenuInfoVO;
import egovframework.let.uss.auth.service.RoleMenuPermissionVO;

/**
 * 플랫폼 역할 DAO
 */
@Repository("authorityDAO")
public class AuthorityEgovDAO extends EgovAbstractMapper implements AuthorityDAO {

    /**
     * 역할 목록을 조회한다.
     */
    @Override
    public List<RoleInfoVO> selectRoleList(RoleInfoVO condition) throws Exception {
        return selectList("AuthorityDAO.selectRoleList", condition);
    }

    /**
     * 역할 페이징 목록을 조회한다.
     */
    @Override
    public List<RoleInfoVO> selectRolePagedList(RoleInfoVO condition) throws Exception {
        return selectList("AuthorityDAO.selectRolePagedList", condition);
    }

    /**
     * 역할 페이징 총 건수를 조회한다.
     */
    @Override
    public int selectRolePagedCount(RoleInfoVO condition) throws Exception {
        Integer count = selectOne("AuthorityDAO.selectRolePagedCount", condition);
        return count == null ? 0 : count;
    }

    /**
     * 역할을 등록한다.
     */
    @Override
    public void insertRole(RoleInfoVO payload) throws Exception {
        insert("AuthorityDAO.insertRole", payload);
    }

    /**
     * 역할 사용여부를 수정한다.
     */
    @Override
    public void updateRoleUseAt(RoleInfoVO payload) throws Exception {
        update("AuthorityDAO.updateRoleUseAt", payload);
    }

    /**
     * 역할 정보를 수정한다.
     */
    @Override
    public void updateRole(RoleInfoVO payload) throws Exception {
        update("AuthorityDAO.updateRole", payload);
    }

    /**
     * 역할별 메뉴권한 목록을 조회한다.
     */
    @Override
    public List<RoleMenuPermissionVO> selectRoleMenuPermissionList(RoleMenuPermissionVO condition) throws Exception {
        return selectList("AuthorityDAO.selectRoleMenuPermissionList", condition);
    }

    /**
     * 역할코드 기준으로 메뉴권한을 삭제한다.
     */
    @Override
    public void deleteRoleMenuPermissionsByRoleCode(Object condition) throws Exception {
        delete("AuthorityDAO.deleteRoleMenuPermissionsByRoleCode", condition);
    }

    /**
     * 역할-메뉴 권한을 등록한다.
     */
    @Override
    public void insertRoleMenuPermission(RoleMenuPermissionVO item) throws Exception {
        insert("AuthorityDAO.insertRoleMenuPermission", item);
    }

    /**
     * 사용자 접근 가능한 메뉴를 조회한다.
     */
    @Override
    public List<MenuInfoVO> selectUserAccessibleMenus(String loginId, Long tenantId) throws Exception {
        Map<String, Object> condition = new HashMap<String, Object>();
        condition.put("loginId", loginId);
        condition.put("tenantId", tenantId);
        return selectList("AuthorityDAO.selectUserAccessibleMenus", condition);
    }
}
