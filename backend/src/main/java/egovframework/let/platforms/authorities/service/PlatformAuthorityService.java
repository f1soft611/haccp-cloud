package egovframework.let.platforms.authorities.service;

import java.util.List;
import java.util.Map;

import egovframework.com.cmm.service.ResultVO;
import egovframework.let.platforms.authorities.vo.PlatformRoleMenuSaveRequestVO;
import egovframework.let.uss.auth.service.AuthorityInfoVO;

public interface PlatformAuthorityService {

    List<AuthorityInfoVO> listRoles() throws Exception;

    ResultVO listRolesPaged(
            int pageIndex,
            int pageSize,
            String searchField,
            String searchKeyword,
            String useAt) throws Exception;

    AuthorityInfoVO createRole(AuthorityInfoVO payload) throws Exception;

    AuthorityInfoVO updateRoleUseAt(String code, AuthorityInfoVO payload) throws Exception;

    AuthorityInfoVO updateRole(String code, AuthorityInfoVO payload) throws Exception;

    Map<String, Object> getRoleMenus(String roleCode) throws Exception;

    Map<String, Object> replaceRoleMenus(String roleCode, PlatformRoleMenuSaveRequestVO payload) throws Exception;
}
