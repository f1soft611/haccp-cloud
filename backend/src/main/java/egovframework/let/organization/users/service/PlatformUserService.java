package egovframework.let.organization.users.service;

import java.util.List;

import egovframework.com.cmm.service.ResultVO;
import egovframework.let.organization.users.domain.model.PlatformUserSaveRequestVO;
import egovframework.let.organization.users.domain.model.PlatformUserVO;

/**
 * 플랫폼 사용자 서비스
 */
public interface PlatformUserService {

    List<PlatformUserVO> listUsers(String tenantCode) throws Exception;

    ResultVO listUsersPaged(
            int pageIndex,
            int pageSize,
            String searchKeyword,
            String filterActive,
            String tenantCode) throws Exception;

    PlatformUserVO createUser(PlatformUserSaveRequestVO payload) throws Exception;

    PlatformUserVO updateUser(Long userId, PlatformUserSaveRequestVO payload) throws Exception;

    PlatformUserVO updateUserActive(Long userId, PlatformUserSaveRequestVO payload) throws Exception;

    Long resolveTenantIdByCode(String tenantCode);
}
