package egovframework.let.platform_admin.tenants.domain.repository.impl;

import org.egovframe.rte.psl.dataaccess.EgovAbstractMapper;
import org.springframework.stereotype.Repository;

import egovframework.let.platform_admin.tenants.domain.model.TenantAuthTokenVO;
import egovframework.let.platform_admin.tenants.domain.repository.TenantAuthTokenDAO;

/**
 * 테넌트 인증 토큰 JDBC DAO 구현
 * @author SHMT-MES
 * @since 2026.06.23
 * @version 1.0
 * @see
 *
 * <pre>
 * << 개정이력(Modification Information) >>
 *
 *   수정일      수정자           수정내용
 *  -------    --------    ---------------------------
 *   2026.06.23 SHMT-MES          최초 생성
 *
 * </pre>
 */
@Repository
public class TenantAuthTokenJdbcDAO extends EgovAbstractMapper implements TenantAuthTokenDAO {

    /**
     * 토큰 저장
     *
     * @param vo 저장할 토큰 정보
     */
    @Override
    public void insertToken(TenantAuthTokenVO vo) {
        insert("TenantAuthTokenDAO.insertToken", vo);
    }

    /**
     * 토큰으로 조회
     *
     * @param authToken 조회할 토큰 값
     * @return 토큰 정보
     */
    @Override
    public TenantAuthTokenVO selectTokenByValue(String authToken) {
        return selectOne("TenantAuthTokenDAO.selectTokenByValue", authToken);
    }

    /**
     * 토큰 사용 표시
     *
     * @param authToken 사용 표시할 토큰 값
     */
    @Override
    public void markTokenAsUsed(String authToken) {
        update("TenantAuthTokenDAO.markTokenAsUsed", authToken);
    }

    /**
     * 테넌트의 미사용 토큰 조회
     *
     * @param tenantCode 테넌트 코드
     * @return 미사용 토큰 정보
     */
    @Override
    public TenantAuthTokenVO selectActiveTokenByTenantCode(String tenantCode) {
        return selectOne("TenantAuthTokenDAO.selectActiveTokenByTenantCode", tenantCode);
    }

    /**
     * 테넌트의 이전 토큰 만료 처리
     *
     * @param tenantCode 테넌트 코드
     */
    @Override
    public void expireTokensByTenantCode(String tenantCode) {
        update("TenantAuthTokenDAO.expireTokensByTenantCode", tenantCode);
    }
}