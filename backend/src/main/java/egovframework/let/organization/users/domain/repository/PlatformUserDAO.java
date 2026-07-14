package egovframework.let.organization.users.domain.repository;

import java.util.List;
import java.util.Map;

import org.egovframe.rte.psl.dataaccess.EgovAbstractMapper;
import org.springframework.stereotype.Repository;

import egovframework.let.organization.users.domain.model.PlatformUserSearchConditionVO;
import egovframework.let.organization.users.domain.model.PlatformUserVO;

/**
 * 플랫폼 사용자 관리를 위한 데이터 접근 클래스
 * @author SHMT-MES
 * @since 2026.07.14
 * @version 1.0
 */
@Repository("platformUserDAO")
public class PlatformUserDAO extends EgovAbstractMapper {

    public List<PlatformUserVO> selectUserList(PlatformUserSearchConditionVO condition) throws Exception {
        return selectList("PlatformUserDAO.selectUserList", condition);
    }

    public List<PlatformUserVO> selectUserPagedList(PlatformUserSearchConditionVO condition) throws Exception {
        return selectList("PlatformUserDAO.selectUserPagedList", condition);
    }

    public int selectUserPagedCount(PlatformUserSearchConditionVO condition) throws Exception {
        Integer count = selectOne("PlatformUserDAO.selectUserPagedCount", condition);
        return count == null ? 0 : count.intValue();
    }

    public PlatformUserVO selectUserDetail(Map<String, Object> condition) throws Exception {
        return selectOne("PlatformUserDAO.selectUserDetail", condition);
    }

    public PlatformUserVO selectUserByTenantCodeAndLoginCode(Map<String, Object> condition) throws Exception {
        return selectOne("PlatformUserDAO.selectUserByTenantCodeAndLoginCode", condition);
    }

    public Map<String, Object> selectLoginAccountForPasswordChange(Map<String, Object> condition) throws Exception {
        return selectOne("PlatformUserDAO.selectLoginAccountForPasswordChange", condition);
    }

    public void insertLoginAccount(Map<String, Object> payload) throws Exception {
        insert("PlatformUserDAO.insertLoginAccount", payload);
    }

    public void insertUser(Map<String, Object> payload) throws Exception {
        insert("PlatformUserDAO.insertUser", payload);
    }

    public void updateUser(Map<String, Object> payload) throws Exception {
        update("PlatformUserDAO.updateUser", payload);
    }

    public void updateUserStatus(Map<String, Object> payload) throws Exception {
        update("PlatformUserDAO.updateUserStatus", payload);
    }

    public void updateLoginPasswordHash(Map<String, Object> payload) throws Exception {
        update("PlatformUserDAO.updateLoginPasswordHash", payload);
    }

    public void updateLoginImages(Map<String, Object> payload) throws Exception {
        update("PlatformUserDAO.updateLoginImages", payload);
    }

    public Long selectTenantIdByCode(String tenantCode) throws Exception {
        return selectOne("PlatformUserDAO.selectTenantIdByCode", tenantCode);
    }

    public Long selectDepartmentId(Map<String, Object> condition) throws Exception {
        return selectOne("PlatformUserDAO.selectDepartmentId", condition);
    }

    public Long insertDepartment(Map<String, Object> payload) throws Exception {
        return selectOne("PlatformUserDAO.insertDepartment", payload);
    }

    public Long selectLoginIdByUserId(Map<String, Object> condition) throws Exception {
        return selectOne("PlatformUserDAO.selectLoginIdByUserId", condition);
    }

    public Long selectLoginIdByLoginCode(Map<String, Object> condition) throws Exception {
        return selectOne("PlatformUserDAO.selectLoginIdByLoginCode", condition);
    }

    public Long selectUserIdByLoginId(Map<String, Object> condition) throws Exception {
        return selectOne("PlatformUserDAO.selectUserIdByLoginId", condition);
    }

    public Long selectRoleIdByCode(Map<String, Object> condition) throws Exception {
        return selectOne("PlatformUserDAO.selectRoleIdByCode", condition);
    }

    public void deleteLoginAccountRolesByLoginId(Long loginId) throws Exception {
        delete("PlatformUserDAO.deleteLoginAccountRolesByLoginId", loginId);
    }

    public void insertLoginAccountRole(Map<String, Object> payload) throws Exception {
        insert("PlatformUserDAO.insertLoginAccountRole", payload);
    }
}
