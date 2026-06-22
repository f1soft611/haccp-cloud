package egovframework.let.platforms.authorities.service;

import java.util.List;
import java.util.Map;

import egovframework.com.cmm.service.ResultVO;
import egovframework.let.platforms.authorities.domain.model.PlatformRoleMenuSaveRequestVO;
import egovframework.let.uss.auth.service.AuthorityInfoVO;
import egovframework.let.uss.auth.service.MenuInfoVO;

/**
 * 플랫폼 권한 서비스
 * @author AI Assistant
 * @since 2026.06.22
 * @version 1.0
 */
public interface PlatformAuthorityService {

    /**
     * 권한 목록을 조회한다.
     * @return 권한 목록
     * @throws Exception
     */
    List<AuthorityInfoVO> listRoles() throws Exception;

    /**
     * 권한 목록(페이징)을 조회한다.
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
            String useAt) throws Exception;

    /**
     * 권한을 등록한다.
     * @param payload 등록 정보
     * @return 등록된 권한
     * @throws Exception
     */
    AuthorityInfoVO createRole(AuthorityInfoVO payload) throws Exception;

    /**
     * 권한 사용 여부를 수정한다.
     * @param code 권한 코드
     * @param payload 수정 정보
     * @return 수정된 권한
     * @throws Exception
     */
    AuthorityInfoVO updateRoleUseAt(String code, AuthorityInfoVO payload) throws Exception;

    /**
     * 권한 정보를 수정한다.
     * @param code 권한 코드
     * @param payload 수정 정보
     * @return 수정된 권한
     * @throws Exception
     */
    AuthorityInfoVO updateRole(String code, AuthorityInfoVO payload) throws Exception;

    /**
     * 권한별 메뉴 권한 정보를 조회한다.
     * @param roleCode 권한 코드
     * @return 권한 메뉴 정보
     * @throws Exception
     */
    Map<String, Object> getRoleMenus(String roleCode) throws Exception;

    /**
     * 권한별 메뉴 권한을 교체 저장한다.
     * @param roleCode 권한 코드
     * @param payload 저장 요청
     * @return 저장 결과
     * @throws Exception
     */
    Map<String, Object> replaceRoleMenus(String roleCode, PlatformRoleMenuSaveRequestVO payload) throws Exception;

    /**
     * 사용자 접근 가능 메뉴를 조회한다.
     * @param authorityCode 권한 코드
     * @return 메뉴 목록
     * @throws Exception
     */
    List<MenuInfoVO> listUserMenus(String authorityCode) throws Exception;
}
