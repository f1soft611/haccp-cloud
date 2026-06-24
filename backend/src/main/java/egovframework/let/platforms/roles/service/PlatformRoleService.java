package egovframework.let.platforms.roles.service;

import java.util.List;
import java.util.Map;

import egovframework.com.cmm.service.ResultVO;
import egovframework.let.platforms.roles.domain.model.PlatformRoleMenuSaveRequestVO;
import egovframework.let.uss.auth.service.RoleInfoVO;
import egovframework.let.uss.auth.service.MenuInfoVO;

/**
 * 플랫폼 역할 서비스
 * @author AI Assistant
 * @since 2026.06.22
 * @version 1.0
 */
public interface PlatformRoleService {

    /**
     * 역할 목록을 조회한다.
     * @return 역할 목록
     * @throws Exception
     */
    List<RoleInfoVO> listRoles(String tenantCode) throws Exception;

    /**
     * 역할 목록(페이징)을 조회한다.
     * @param pageIndex 페이지 인덱스
     * @param pageSize 페이지 크기
     * @param searchField 검색 필드
     * @param searchKeyword 검색 키워드
     * @param useAt 사용 여부
     * @return 조회 결과
     * @throws Exception
     */
    ResultVO listRolesPaged(
            int pageIndex,
            int pageSize,
            String searchField,
            String searchKeyword,
            String tenantCode,
            String useAt) throws Exception;

    default ResultVO listRolesPaged(
            int pageIndex,
            int pageSize,
            String searchField,
            String searchKeyword,
            String useAt) throws Exception {
        return listRolesPaged(pageIndex, pageSize, searchField, searchKeyword, null, useAt);
    }

    /**
     * 역할을 등록한다.
     * @param payload 등록 정보
     * @return 등록된 역할
     * @throws Exception
     */
    RoleInfoVO createRole(RoleInfoVO payload) throws Exception;

    /**
     * 역할 사용 여부를 수정한다.
     * @param roleId 역할 ID
     * @param payload 수정 정보
     * @return 수정된 역할
     * @throws Exception
     */
    RoleInfoVO updateRoleUseAt(Long roleId, RoleInfoVO payload) throws Exception;

    /**
     * 역할 정보를 수정한다.
     * @param roleId 역할 ID
     * @param payload 수정 정보
     * @return 수정된 역할
     * @throws Exception
     */
    RoleInfoVO updateRole(Long roleId, RoleInfoVO payload) throws Exception;

    /**
     * 역할별 메뉴 권한 정보를 조회한다.
     * @param roleCode 역할 코드
     * @return 역할 메뉴 정보
     * @throws Exception
     */
    Map<String, Object> getRoleMenus(String roleCode, String tenantCode) throws Exception;

    /**
     * 역할별 메뉴 권한을 교체 저장한다.
     * @param roleCode 역할 코드
     * @param payload 저장 요청
     * @return 저장 결과
     * @throws Exception
     */
    Map<String, Object> replaceRoleMenus(String roleCode, String tenantCode, PlatformRoleMenuSaveRequestVO payload) throws Exception;

    List<String> listAllowedMenuCodesByTenantPlan(String tenantCode) throws Exception;

    /**
     * 사용자 접근 가능 메뉴를 조회한다.
     * @param roleCode 역할 코드
     * @return 메뉴 목록
     * @throws Exception
     */
    List<MenuInfoVO> listUserMenus(String roleCode) throws Exception;
}
