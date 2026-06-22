package egovframework.let.platforms.authorities.domain.repository;

import java.util.List;

import egovframework.let.uss.auth.service.AuthorityInfoVO;
import egovframework.let.uss.auth.service.MenuInfoVO;
import egovframework.let.uss.auth.service.RoleMenuPermissionVO;

/**
 * 플랫폼 권한 DAO
 * @author AI Assistant
 * @since 2026.06.22
 * @version 1.0
 */
public interface PlatformAuthorityDAO {

    /**
     * 권한 목록을 조회한다.
     * @return 권한 목록
     * @throws Exception
     */
    List<AuthorityInfoVO> selectAuthorityList() throws Exception;

    /**
     * 권한 목록(페이징)을 조회한다.
     * @param condition 조회 조건
     * @return 권한 목록
     * @throws Exception
     */
    List<AuthorityInfoVO> selectAuthorityPagedList(AuthorityInfoVO condition) throws Exception;

    /**
     * 권한 목록(페이징) 총 건수를 조회한다.
     * @param condition 조회 조건
     * @return 총 건수
     * @throws Exception
     */
    int selectAuthorityPagedCount(AuthorityInfoVO condition) throws Exception;

    /**
     * 권한을 등록한다.
     * @param payload 등록 정보
     * @throws Exception
     */
    void insertAuthority(AuthorityInfoVO payload) throws Exception;

    /**
     * 권한 사용 여부를 수정한다.
     * @param payload 수정 정보
     * @throws Exception
     */
    void updateAuthorityUseAt(AuthorityInfoVO payload) throws Exception;

    /**
     * 권한 정보를 수정한다.
     * @param payload 수정 정보
     * @throws Exception
     */
    void updateAuthority(AuthorityInfoVO payload) throws Exception;

    /**
     * 역할별 메뉴 권한 목록을 조회한다.
     * @param condition 조회 조건
     * @return 메뉴 권한 목록
     * @throws Exception
     */
    List<RoleMenuPermissionVO> selectRoleMenuPermissionList(RoleMenuPermissionVO condition) throws Exception;

    /**
     * 권한 코드에 연결된 메뉴 권한을 삭제한다.
     * @param authorityCode 권한 코드
     * @throws Exception
     */
    void deleteRoleMenuPermissionsByAuthority(String authorityCode) throws Exception;

    /**
     * 역할별 메뉴 권한을 등록한다.
     * @param item 등록 정보
     * @throws Exception
     */
    void insertRoleMenuPermission(RoleMenuPermissionVO item) throws Exception;

    /**
     * 사용자 접근 가능 메뉴 목록을 조회한다.
     * @param authorityCode 권한 코드
     * @return 메뉴 목록
     * @throws Exception
     */
    List<MenuInfoVO> selectUserAccessibleMenus(String authorityCode) throws Exception;
}
