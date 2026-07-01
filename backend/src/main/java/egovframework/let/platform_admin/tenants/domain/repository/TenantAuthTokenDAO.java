package egovframework.let.platform_admin.tenants.domain.repository;

import egovframework.let.platform_admin.tenants.domain.model.TenantAuthTokenVO;

/**
 * 테넌트 인증 토큰 DAO
 */
public interface TenantAuthTokenDAO {

    /**
     * 토큰 저장
     *
     * @param vo 저장할 토큰 정보
     */
    void insertToken(TenantAuthTokenVO vo);

    /**
     * 토큰으로 조회
     *
     * @param authToken 조회할 토큰 값
     * @return 토큰 정보
     */
    TenantAuthTokenVO selectTokenByValue(String authToken);

    /**
     * 토큰 사용 표시
     *
     * @param authToken 사용 표시할 토큰 값
     */
    void markTokenAsUsed(String authToken);

    /**
     * 테넌트의 미사용 토큰 조회
     *
     * @param tenantCode 테넌트 코드
     * @return 미사용 토큰 정보
     */
    TenantAuthTokenVO selectActiveTokenByTenantCode(String tenantCode);

    /**
     * 테넌트의 이전 토큰 만료 처리
     *
     * @param tenantCode 테넌트 코드
     */
    void expireTokensByTenantCode(String tenantCode);
}
