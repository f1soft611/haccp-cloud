package egovframework.let.platforms.users.domain.repository;

import java.util.List;
import java.util.Map;

import egovframework.let.platforms.users.domain.model.PlatformUserSaveRequestVO;
import egovframework.let.platforms.users.domain.model.PlatformUserSearchConditionVO;
import egovframework.let.platforms.users.domain.model.PlatformUserVO;

public interface PlatformUserDAO {

    List<PlatformUserVO> selectUserList(PlatformUserSearchConditionVO condition) throws Exception;

    List<PlatformUserVO> selectUserPagedList(PlatformUserSearchConditionVO condition) throws Exception;

    int selectUserPagedCount(PlatformUserSearchConditionVO condition) throws Exception;

    PlatformUserVO selectUserDetail(Map<String, Object> condition) throws Exception;

    void insertLoginAccount(Map<String, Object> payload) throws Exception;

    void insertUser(Map<String, Object> payload) throws Exception;

    void updateUser(Map<String, Object> payload) throws Exception;

    void updateUserStatus(Map<String, Object> payload) throws Exception;

    Long selectTenantIdByCode(String tenantCode) throws Exception;

    Long selectDepartmentId(Map<String, Object> condition) throws Exception;

    Long insertDepartment(Map<String, Object> payload) throws Exception;

    Long selectLoginIdByUserId(Map<String, Object> condition) throws Exception;

    Long selectLoginIdByLoginCode(Map<String, Object> condition) throws Exception;

    Long selectUserIdByLoginId(Map<String, Object> condition) throws Exception;

    Long selectRoleIdByCode(Map<String, Object> condition) throws Exception;

    void deleteLoginAccountRolesByLoginId(Long loginId) throws Exception;

    void insertLoginAccountRole(Map<String, Object> payload) throws Exception;
}
