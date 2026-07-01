package egovframework.let.organization.users.domain.repository;

import java.util.List;
import java.util.Map;

import org.egovframe.rte.psl.dataaccess.EgovAbstractMapper;
import org.springframework.stereotype.Repository;

import egovframework.let.organization.users.domain.model.PlatformUserSearchConditionVO;
import egovframework.let.organization.users.domain.model.PlatformUserVO;

@Repository("platformUserDAO")
public class PlatformUserEgovDAO extends EgovAbstractMapper implements PlatformUserDAO {

    @Override
    public List<PlatformUserVO> selectUserList(PlatformUserSearchConditionVO condition) throws Exception {
        return selectList("PlatformUserDAO.selectUserList", condition);
    }

    @Override
    public List<PlatformUserVO> selectUserPagedList(PlatformUserSearchConditionVO condition) throws Exception {
        return selectList("PlatformUserDAO.selectUserPagedList", condition);
    }

    @Override
    public int selectUserPagedCount(PlatformUserSearchConditionVO condition) throws Exception {
        Integer count = selectOne("PlatformUserDAO.selectUserPagedCount", condition);
        return count == null ? 0 : count.intValue();
    }

    @Override
    public PlatformUserVO selectUserDetail(Map<String, Object> condition) throws Exception {
        return selectOne("PlatformUserDAO.selectUserDetail", condition);
    }

    @Override
    public void insertLoginAccount(Map<String, Object> payload) throws Exception {
        insert("PlatformUserDAO.insertLoginAccount", payload);
    }

    @Override
    public void insertUser(Map<String, Object> payload) throws Exception {
        insert("PlatformUserDAO.insertUser", payload);
    }

    @Override
    public void updateUser(Map<String, Object> payload) throws Exception {
        update("PlatformUserDAO.updateUser", payload);
    }

    @Override
    public void updateUserStatus(Map<String, Object> payload) throws Exception {
        update("PlatformUserDAO.updateUserStatus", payload);
    }

    @Override
    public Long selectTenantIdByCode(String tenantCode) throws Exception {
        return selectOne("PlatformUserDAO.selectTenantIdByCode", tenantCode);
    }

    @Override
    public Long selectDepartmentId(Map<String, Object> condition) throws Exception {
        return selectOne("PlatformUserDAO.selectDepartmentId", condition);
    }

    @Override
    public Long insertDepartment(Map<String, Object> payload) throws Exception {
        return selectOne("PlatformUserDAO.insertDepartment", payload);
    }

    @Override
    public Long selectLoginIdByUserId(Map<String, Object> condition) throws Exception {
        return selectOne("PlatformUserDAO.selectLoginIdByUserId", condition);
    }

    @Override
    public Long selectLoginIdByLoginCode(Map<String, Object> condition) throws Exception {
        return selectOne("PlatformUserDAO.selectLoginIdByLoginCode", condition);
    }

    @Override
    public Long selectUserIdByLoginId(Map<String, Object> condition) throws Exception {
        return selectOne("PlatformUserDAO.selectUserIdByLoginId", condition);
    }

    @Override
    public Long selectRoleIdByCode(Map<String, Object> condition) throws Exception {
        return selectOne("PlatformUserDAO.selectRoleIdByCode", condition);
    }

    @Override
    public void deleteLoginAccountRolesByLoginId(Long loginId) throws Exception {
        delete("PlatformUserDAO.deleteLoginAccountRolesByLoginId", loginId);
    }

    @Override
    public void insertLoginAccountRole(Map<String, Object> payload) throws Exception {
        insert("PlatformUserDAO.insertLoginAccountRole", payload);
    }
}
