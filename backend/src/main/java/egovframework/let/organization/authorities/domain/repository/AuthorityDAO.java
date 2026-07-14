package egovframework.let.organization.authorities.domain.repository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.egovframe.rte.psl.dataaccess.EgovAbstractMapper;
import org.springframework.stereotype.Repository;

import egovframework.let.uss.auth.service.MenuInfoVO;
import egovframework.let.uss.auth.service.RoleInfoVO;
import egovframework.let.uss.auth.service.RoleMenuPermissionVO;

/**
 * 플랫폼 역할 관리를 위한 데이터 접근 클래스
 * @author SHMT-MES
 * @since 2026.07.14
 * @version 1.0
 */
@Repository("authorityDAO")
public class AuthorityDAO extends EgovAbstractMapper {

    public List<RoleInfoVO> selectRoleList(RoleInfoVO condition) throws Exception {
        return selectList("AuthorityDAO.selectRoleList", condition);
    }

    public List<RoleInfoVO> selectRolePagedList(RoleInfoVO condition) throws Exception {
        return selectList("AuthorityDAO.selectRolePagedList", condition);
    }

    public int selectRolePagedCount(RoleInfoVO condition) throws Exception {
        Integer count = selectOne("AuthorityDAO.selectRolePagedCount", condition);
        return count == null ? 0 : count;
    }

    public RoleInfoVO selectRoleById(Long roleId) throws Exception {
        return selectOne("AuthorityDAO.selectRoleById", roleId);
    }

    public void insertRole(RoleInfoVO payload) throws Exception {
        insert("AuthorityDAO.insertRole", payload);
    }

    public void updateRoleUseAt(RoleInfoVO payload) throws Exception {
        update("AuthorityDAO.updateRoleUseAt", payload);
    }

    public void updateRole(RoleInfoVO payload) throws Exception {
        update("AuthorityDAO.updateRole", payload);
    }

    public List<RoleMenuPermissionVO> selectRoleMenuPermissionList(RoleMenuPermissionVO condition) throws Exception {
        return selectList("AuthorityDAO.selectRoleMenuPermissionList", condition);
    }

    public void deleteRoleMenuPermissionsByRoleCode(Object condition) throws Exception {
        delete("AuthorityDAO.deleteRoleMenuPermissionsByRoleCode", condition);
    }

    public void insertRoleMenuPermission(RoleMenuPermissionVO item) throws Exception {
        insert("AuthorityDAO.insertRoleMenuPermission", item);
    }

    public Long selectMenuIdByCode(String menuCode) throws Exception {
        return selectOne("AuthorityDAO.selectMenuIdByCode", menuCode);
    }

    public void upsertPermissionType(Long tenantId, String permissionCode, String permissionNm) throws Exception {
        Map<String, Object> payload = new HashMap<String, Object>();
        payload.put("tenantId", tenantId);
        payload.put("permissionCode", permissionCode);
        payload.put("permissionNm", permissionNm);
        insert("AuthorityDAO.upsertPermissionType", payload);
    }

    public List<MenuInfoVO> selectUserAccessibleMenus(String loginId, Long tenantId) throws Exception {
        Map<String, Object> condition = new HashMap<String, Object>();
        condition.put("loginId", loginId);
        condition.put("tenantId", tenantId);
        return selectList("AuthorityDAO.selectUserAccessibleMenus", condition);
    }
}
