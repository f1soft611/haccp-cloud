package egovframework.let.platforms.roles.domain.repository;

import java.util.List;

import org.egovframe.rte.psl.dataaccess.EgovAbstractMapper;
import org.springframework.stereotype.Repository;

import egovframework.let.uss.auth.service.RoleInfoVO;
import egovframework.let.uss.auth.service.MenuInfoVO;
import egovframework.let.uss.auth.service.RoleMenuPermissionVO;

/**
 * 플랫폼 역할 DAO
 */
@Repository("platformRoleDAO")
public class PlatformRoleEgovDAO extends EgovAbstractMapper implements PlatformRoleDAO {

    /**
     * 역할 목록을 조회한다.
     */
    @Override
    public List<RoleInfoVO> selectRoleList() throws Exception {
        return selectList("PlatformRoleDAO.selectRoleList");
    }

    /**
     * 역할 페이징 목록을 조회한다.
     */
    @Override
    public List<RoleInfoVO> selectRolePagedList(RoleInfoVO condition) throws Exception {
        return selectList("PlatformRoleDAO.selectRolePagedList", condition);
    }

    /**
     * 역할 페이징 총 건수를 조회한다.
     */
    @Override
    public int selectRolePagedCount(RoleInfoVO condition) throws Exception {
        Integer count = selectOne("PlatformRoleDAO.selectRolePagedCount", condition);
        return count == null ? 0 : count;
    }

    /**
     * 역할을 등록한다.
     */
    @Override
    public void insertRole(RoleInfoVO payload) throws Exception {
        insert("PlatformRoleDAO.insertRole", payload);
    }

    /**
     * 역할 사용여부를 수정한다.
     */
    @Override
    public void updateRoleUseAt(RoleInfoVO payload) throws Exception {
        update("PlatformRoleDAO.updateRoleUseAt", payload);
    }

    /**
     * 역할 정보를 수정한다.
     */
    @Override
    public void updateRole(RoleInfoVO payload) throws Exception {
        update("PlatformRoleDAO.updateRole", payload);
    }

    /**
     * 역할별 메뉴권한 목록을 조회한다.
     */
    @Override
    public List<RoleMenuPermissionVO> selectRoleMenuPermissionList(RoleMenuPermissionVO condition) throws Exception {
        return selectList("PlatformRoleDAO.selectRoleMenuPermissionList", condition);
    }

    /**
     * 역할코드 기준으로 메뉴권한을 삭제한다.
     */
    @Override
    public void deleteRoleMenuPermissionsByRoleCode(String roleCode) throws Exception {
        delete("PlatformRoleDAO.deleteRoleMenuPermissionsByRoleCode", roleCode);
    }

    /**
     * 역할-메뉴 권한을 등록한다.
     */
    @Override
    public void insertRoleMenuPermission(RoleMenuPermissionVO item) throws Exception {
        insert("PlatformRoleDAO.insertRoleMenuPermission", item);
    }

    /**
     * 사용자 접근 가능한 메뉴를 조회한다.
     */
    @Override
    public List<MenuInfoVO> selectUserAccessibleMenus(String roleCode) throws Exception {
        return selectList("PlatformRoleDAO.selectUserAccessibleMenus", roleCode);
    }
}
