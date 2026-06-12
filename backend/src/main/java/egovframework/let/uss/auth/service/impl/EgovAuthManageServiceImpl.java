package egovframework.let.uss.auth.service.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.annotation.Resource;

import org.egovframe.rte.fdl.cmmn.EgovAbstractServiceImpl;
import org.springframework.stereotype.Service;

import egovframework.let.uss.auth.service.EgovAuthManageService;
import egovframework.let.uss.auth.service.MenuInfoVO;
import egovframework.let.uss.auth.service.PermissionTypeVO;
import egovframework.let.uss.auth.service.RoleMenuPermissionVO;

/**
 * 권한 관리 서비스 구현 클래스
 * @author SHMT-MES
 * @since 2024.01.01
 * @version 1.0
 */
@Service("authManageService")
public class EgovAuthManageServiceImpl extends EgovAbstractServiceImpl implements EgovAuthManageService {

    @Resource(name = "authManageDAO")
    private AuthManageDAO authManageDAO;

    /**
     * 메뉴 목록을 조회한다.
     */
    @Override
    public List<MenuInfoVO> selectMenuList(MenuInfoVO menuInfoVO) throws Exception {
        return authManageDAO.selectMenuList(menuInfoVO);
    }

    /**
     * 메뉴 상세정보를 조회한다.
     */
    @Override
    public MenuInfoVO selectMenuDetail(MenuInfoVO menuInfoVO) throws Exception {
        return authManageDAO.selectMenuDetail(menuInfoVO);
    }

    /**
     * 메뉴를 등록한다.
     */
    @Override
    public int insertMenu(MenuInfoVO menuInfoVO) throws Exception {
        String menuId = generateMenuId();
        menuInfoVO.setMenuId(menuId);
        return authManageDAO.insertMenu(menuInfoVO);
    }

    /**
     * 메뉴를 수정한다.
     */
    @Override
    public int updateMenu(MenuInfoVO menuInfoVO) throws Exception {
        return authManageDAO.updateMenu(menuInfoVO);
    }

    /**
     * 메뉴를 삭제한다.
     */
    @Override
    public int deleteMenu(MenuInfoVO menuInfoVO) throws Exception {
        return authManageDAO.deleteMenu(menuInfoVO);
    }

    /**
     * 권한 유형 목록을 조회한다.
     */
    @Override
    public List<PermissionTypeVO> selectPermissionTypeList(PermissionTypeVO permissionTypeVO) throws Exception {
        return authManageDAO.selectPermissionTypeList(permissionTypeVO);
    }

    /**
     * 권한 유형을 등록한다.
     */
    @Override
    public int insertPermissionType(PermissionTypeVO permissionTypeVO) throws Exception {
        String permissionId = generatePermissionId();
        permissionTypeVO.setPermissionId(permissionId);
        return authManageDAO.insertPermissionType(permissionTypeVO);
    }

    /**
     * 역할별 메뉴 권한 목록을 조회한다.
     */
    @Override
    public List<RoleMenuPermissionVO> selectRoleMenuPermissionList(RoleMenuPermissionVO roleMenuPermissionVO) throws Exception {
        return authManageDAO.selectRoleMenuPermissionList(roleMenuPermissionVO);
    }

    /**
     * 역할별 메뉴 권한을 설정한다.
     */
    @Override
    public int insertRoleMenuPermission(RoleMenuPermissionVO roleMenuPermissionVO) throws Exception {
        String roleMenuId = generateRoleMenuId();
        roleMenuPermissionVO.setRoleMenuId(roleMenuId);
        return authManageDAO.insertRoleMenuPermission(roleMenuPermissionVO);
    }

    /**
     * 역할별 메뉴 권한을 삭제한다.
     */
    @Override
    public int deleteRoleMenuPermission(RoleMenuPermissionVO roleMenuPermissionVO) throws Exception {
        return authManageDAO.deleteRoleMenuPermission(roleMenuPermissionVO);
    }

    /**
     * 사용자별 접근 가능한 메뉴 목록을 조회한다.
     */
    @Override
    public List<MenuInfoVO> selectUserAccessibleMenus(String groupId) throws Exception {
        return authManageDAO.selectUserAccessibleMenus(groupId);
    }

    /**
     * 특정 메뉴에 대한 사용자 권한을 확인한다.
     */
    @Override
    public String checkUserMenuPermission(String groupId, String menuUrl) throws Exception {
        Map<String, Object> params = new HashMap<>();
        params.put("groupId", groupId);
        params.put("menuUrl", menuUrl);
        
        String permission = authManageDAO.checkUserMenuPermission(params);
        return permission != null ? permission : "none";
    }

    /**
     * 메뉴 ID 생성
     */
    private String generateMenuId() {
        return "MENU" + String.format("%03d", System.currentTimeMillis() % 1000);
    }

    /**
     * 권한 ID 생성
     */
    private String generatePermissionId() {
        return "PERM_" + String.format("%03d", System.currentTimeMillis() % 1000);
    }

    /**
     * 역할 메뉴 ID 생성
     */
    private String generateRoleMenuId() {
        return "RMP" + String.format("%03d", System.currentTimeMillis() % 1000);
    }
}