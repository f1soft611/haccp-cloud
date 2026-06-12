package egovframework.let.uss.auth.service.impl;

import java.util.List;

import org.egovframe.rte.psl.dataaccess.EgovAbstractMapper;
import org.springframework.stereotype.Repository;

import egovframework.let.uss.auth.service.MenuInfoVO;
import egovframework.let.uss.auth.service.PermissionTypeVO;
import egovframework.let.uss.auth.service.RoleMenuPermissionVO;

/**
 * 권한 관리 DAO 클래스
 * @author SHMT-MES
 * @since 2024.01.01
 * @version 1.0
 */
@Repository("authManageDAO")
public class AuthManageDAO extends EgovAbstractMapper {

    /**
     * 메뉴 목록을 조회한다.
     * @param menuInfoVO 검색조건
     * @return List<MenuInfoVO> 메뉴목록
     * @throws Exception
     */
    public List<MenuInfoVO> selectMenuList(MenuInfoVO menuInfoVO) throws Exception {
        return selectList("authManageDAO.selectMenuList", menuInfoVO);
    }

    /**
     * 메뉴 상세정보를 조회한다.
     * @param menuInfoVO 메뉴정보
     * @return MenuInfoVO 메뉴상세정보
     * @throws Exception
     */
    public MenuInfoVO selectMenuDetail(MenuInfoVO menuInfoVO) throws Exception {
        return selectOne("authManageDAO.selectMenuDetail", menuInfoVO);
    }

    /**
     * 메뉴를 등록한다.
     * @param menuInfoVO 메뉴정보
     * @return int 등록결과
     * @throws Exception
     */
    public int insertMenu(MenuInfoVO menuInfoVO) throws Exception {
        return insert("authManageDAO.insertMenu", menuInfoVO);
    }

    /**
     * 메뉴를 수정한다.
     * @param menuInfoVO 메뉴정보
     * @return int 수정결과
     * @throws Exception
     */
    public int updateMenu(MenuInfoVO menuInfoVO) throws Exception {
        return update("authManageDAO.updateMenu", menuInfoVO);
    }

    /**
     * 메뉴를 삭제한다.
     * @param menuInfoVO 메뉴정보
     * @return int 삭제결과
     * @throws Exception
     */
    public int deleteMenu(MenuInfoVO menuInfoVO) throws Exception {
        return delete("authManageDAO.deleteMenu", menuInfoVO);
    }

    /**
     * 권한 유형 목록을 조회한다.
     * @param permissionTypeVO 검색조건
     * @return List<PermissionTypeVO> 권한유형목록
     * @throws Exception
     */
    public List<PermissionTypeVO> selectPermissionTypeList(PermissionTypeVO permissionTypeVO) throws Exception {
        return selectList("authManageDAO.selectPermissionTypeList", permissionTypeVO);
    }

    /**
     * 권한 유형을 등록한다.
     * @param permissionTypeVO 권한유형정보
     * @return int 등록결과
     * @throws Exception
     */
    public int insertPermissionType(PermissionTypeVO permissionTypeVO) throws Exception {
        return insert("authManageDAO.insertPermissionType", permissionTypeVO);
    }

    /**
     * 역할별 메뉴 권한 목록을 조회한다.
     * @param roleMenuPermissionVO 검색조건
     * @return List<RoleMenuPermissionVO> 역할메뉴권한목록
     * @throws Exception
     */
    public List<RoleMenuPermissionVO> selectRoleMenuPermissionList(RoleMenuPermissionVO roleMenuPermissionVO) throws Exception {
        return selectList("authManageDAO.selectRoleMenuPermissionList", roleMenuPermissionVO);
    }

    /**
     * 역할별 메뉴 권한을 설정한다.
     * @param roleMenuPermissionVO 역할메뉴권한정보
     * @return int 설정결과
     * @throws Exception
     */
    public int insertRoleMenuPermission(RoleMenuPermissionVO roleMenuPermissionVO) throws Exception {
        return insert("authManageDAO.insertRoleMenuPermission", roleMenuPermissionVO);
    }

    /**
     * 역할별 메뉴 권한을 삭제한다.
     * @param roleMenuPermissionVO 역할메뉴권한정보
     * @return int 삭제결과
     * @throws Exception
     */
    public int deleteRoleMenuPermission(RoleMenuPermissionVO roleMenuPermissionVO) throws Exception {
        return delete("authManageDAO.deleteRoleMenuPermission", roleMenuPermissionVO);
    }

    /**
     * 사용자별 접근 가능한 메뉴 목록을 조회한다.
     * @param groupId 그룹ID
     * @return List<MenuInfoVO> 접근가능메뉴목록
     * @throws Exception
     */
    public List<MenuInfoVO> selectUserAccessibleMenus(String groupId) throws Exception {
        return selectList("authManageDAO.selectUserAccessibleMenus", groupId);
    }

    /**
     * 특정 메뉴에 대한 사용자 권한을 확인한다.
     * @param params 파라미터 (groupId, menuUrl)
     * @return String 권한레벨
     * @throws Exception
     */
    public String checkUserMenuPermission(Object params) throws Exception {
        return selectOne("authManageDAO.checkUserMenuPermission", params);
    }
}