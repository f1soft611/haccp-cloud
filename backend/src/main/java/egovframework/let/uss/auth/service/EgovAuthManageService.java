package egovframework.let.uss.auth.service;

import java.util.List;

/**
 * 권한 관리 서비스 인터페이스
 * @author SHMT-MES
 * @since 2024.01.01
 * @version 1.0
 */
public interface EgovAuthManageService {

    /**
     * 메뉴 목록을 조회한다.
     * @param menuInfoVO 검색조건
     * @return List<MenuInfoVO> 메뉴목록
     * @throws Exception
     */
    List<MenuInfoVO> selectMenuList(MenuInfoVO menuInfoVO) throws Exception;

    /**
     * 메뉴 상세정보를 조회한다.
     * @param menuInfoVO 메뉴정보
     * @return MenuInfoVO 메뉴상세정보
     * @throws Exception
     */
    MenuInfoVO selectMenuDetail(MenuInfoVO menuInfoVO) throws Exception;

    /**
     * 메뉴를 등록한다.
     * @param menuInfoVO 메뉴정보
     * @return int 등록결과
     * @throws Exception
     */
    int insertMenu(MenuInfoVO menuInfoVO) throws Exception;

    /**
     * 메뉴를 수정한다.
     * @param menuInfoVO 메뉴정보
     * @return int 수정결과
     * @throws Exception
     */
    int updateMenu(MenuInfoVO menuInfoVO) throws Exception;

    /**
     * 메뉴를 삭제한다.
     * @param menuInfoVO 메뉴정보
     * @return int 삭제결과
     * @throws Exception
     */
    int deleteMenu(MenuInfoVO menuInfoVO) throws Exception;

    /**
     * 권한 유형 목록을 조회한다.
     * @param permissionTypeVO 검색조건
     * @return List<PermissionTypeVO> 권한유형목록
     * @throws Exception
     */
    List<PermissionTypeVO> selectPermissionTypeList(PermissionTypeVO permissionTypeVO) throws Exception;

    /**
     * 권한 유형을 등록한다.
     * @param permissionTypeVO 권한유형정보
     * @return int 등록결과
     * @throws Exception
     */
    int insertPermissionType(PermissionTypeVO permissionTypeVO) throws Exception;

    /**
     * 역할별 메뉴 권한 목록을 조회한다.
     * @param roleMenuPermissionVO 검색조건
     * @return List<RoleMenuPermissionVO> 역할메뉴권한목록
     * @throws Exception
     */
    List<RoleMenuPermissionVO> selectRoleMenuPermissionList(RoleMenuPermissionVO roleMenuPermissionVO) throws Exception;

    /**
     * 역할별 메뉴 권한을 설정한다.
     * @param roleMenuPermissionVO 역할메뉴권한정보
     * @return int 설정결과
     * @throws Exception
     */
    int insertRoleMenuPermission(RoleMenuPermissionVO roleMenuPermissionVO) throws Exception;

    /**
     * 역할별 메뉴 권한을 삭제한다.
     * @param roleMenuPermissionVO 역할메뉴권한정보
     * @return int 삭제결과
     * @throws Exception
     */
    int deleteRoleMenuPermission(RoleMenuPermissionVO roleMenuPermissionVO) throws Exception;

    /**
     * 사용자별 접근 가능한 메뉴 목록을 조회한다.
     * @param groupId 그룹ID
     * @return List<MenuInfoVO> 접근가능메뉴목록
     * @throws Exception
     */
    List<MenuInfoVO> selectUserAccessibleMenus(String groupId) throws Exception;

    /**
     * 특정 메뉴에 대한 사용자 권한을 확인한다.
     * @param groupId 그룹ID
     * @param menuUrl 메뉴URL
     * @return String 권한레벨 (read/write/none)
     * @throws Exception
     */
    String checkUserMenuPermission(String groupId, String menuUrl) throws Exception;
}