package egovframework.let.organization.users.service;

import java.util.List;
import java.util.Map;

import egovframework.let.organization.users.domain.model.PlatformUserImageUpdateRequestVO;
import egovframework.let.organization.users.domain.model.PlatformUserPasswordChangeRequestVO;
import egovframework.let.organization.users.domain.model.PlatformUserSaveRequestVO;
import egovframework.let.organization.users.domain.model.PlatformUserVO;

/**
 * 플랫폼 사용자 관리를 위한 서비스 인터페이스 클래스
 * @author SHMT-MES
 * @since 2026.07.14
 * @version 1.0
 */
public interface PlatformUserService {

    List<PlatformUserVO> listUsers(String tenantCode) throws Exception;

    Map<String, Object> listUsersPaged(
            int pageIndex,
            int pageSize,
            String searchKeyword,
            String filterActive,
            String tenantCode) throws Exception;

        PlatformUserVO getMyPageUser(String tenantCode, String loginCode) throws Exception;

    void changeMyPassword(String tenantCode, String loginCode, PlatformUserPasswordChangeRequestVO payload) throws Exception;

        PlatformUserVO changeMyImages(String tenantCode, String loginCode, PlatformUserImageUpdateRequestVO payload) throws Exception;

    PlatformUserVO createUser(PlatformUserSaveRequestVO payload) throws Exception;

    PlatformUserVO updateUser(Long userId, PlatformUserSaveRequestVO payload) throws Exception;

    PlatformUserVO updateUserActive(Long userId, PlatformUserSaveRequestVO payload) throws Exception;

    Long resolveTenantIdByCode(String tenantCode);
}
