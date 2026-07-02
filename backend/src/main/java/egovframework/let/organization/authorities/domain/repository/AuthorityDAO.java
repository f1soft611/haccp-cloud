package egovframework.let.organization.authorities.domain.repository;

import java.util.List;

import egovframework.let.uss.auth.service.RoleInfoVO;
import egovframework.let.uss.auth.service.MenuInfoVO;
import egovframework.let.uss.auth.service.RoleMenuPermissionVO;

/**
 * 플랫폼 역할 DAO
 * @author AI Assistant
 * @since 2026.06.22
 * @version 1.0
 */
public interface AuthorityDAO {

    /**
     * 역할 목록을 조회한다.
     * @return 역할 목록
     * @throws Exception
     */
    List<RoleInfoVO> selectRoleList(RoleInfoVO condition) throws Exception;

    /**
     * 역할 목록(페이징)을 조회한다.
     * @param condition 조회 조건
    * @return 역할 목록
     * @throws Exception
     */
    List<RoleInfoVO> selectRolePagedList(RoleInfoVO condition) throws Exception;

    /**
     * 역할 목록(페이징) 총 건수를 조회한다.
     * @param condition 조회 조건
     * @return 총 건수
     * @throws Exception
     */
    int selectRolePagedCount(RoleInfoVO condition) throws Exception;

    /**
     * 역할 ID로 단건 조회한다.
     * @param roleId 역할 ID
     * @return 역할 정보
     * @throws Exception
     */
    RoleInfoVO selectRoleById(Long roleId) throws Exception;

    /**
     * 역할을 등록한다.
     * @param payload 등록 정보
     * @throws Exception
     */
    void insertRole(RoleInfoVO payload) throws Exception;

    /**
     * 역할 사용 여부를 수정한다.
     * @param payload 수정 정보
     * @throws Exception
     */
    void updateRoleUseAt(RoleInfoVO payload) throws Exception;

    /**
     * 역할 정보를 수정한다.
     * @param payload 수정 정보
     * @throws Exception
     */
    void updateRole(RoleInfoVO payload) throws Exception;

    /**
     * 역할별 메뉴 권한 목록을 조회한다.
     * @param condition 조회 조건
    * @return 메뉴 역할 목록
     * @throws Exception
     */
    List<RoleMenuPermissionVO> selectRoleMenuPermissionList(RoleMenuPermissionVO condition) throws Exception;

    /**
    * 역할 코드에 연결된 메뉴 권한을 삭제한다.
    * @param roleCode 역할 코드
     * @throws Exception
     */
    void deleteRoleMenuPermissionsByRoleCode(Object condition) throws Exception;

    /**
     * 역할별 메뉴 권한을 등록한다.
     * @param item 등록 정보
     * @throws Exception
     */
    void insertRoleMenuPermission(RoleMenuPermissionVO item) throws Exception;

    /**
     * 사용자 접근 가능 메뉴 목록을 조회한다.
     * @param loginId 로그인 아이디(login_code)
     * @param tenantId 테넌트 ID
     * @return 메뉴 목록
     * @throws Exception
     */
    List<MenuInfoVO> selectUserAccessibleMenus(String loginId, Long tenantId) throws Exception;
}
