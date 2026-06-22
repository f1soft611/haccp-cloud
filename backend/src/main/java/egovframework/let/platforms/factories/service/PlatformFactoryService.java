package egovframework.let.platforms.factories.service;

import java.util.List;

import egovframework.let.platforms.factories.domain.model.FactoryRegistrationRequestVO;
import egovframework.let.platforms.factories.domain.model.FactoryRegistrationResultVO;
import egovframework.let.platforms.factories.domain.model.PlatformTenantDashboardQueryVO;
import egovframework.let.platforms.factories.domain.model.PlatformTenantDashboardResultVO;
import egovframework.let.platforms.factories.domain.model.SampleTenantVO;

/**
 * 플랫폼 공장 서비스
 * @author AI Assistant
 * @since 2026.06.22
 * @version 1.0
 */
public interface PlatformFactoryService {

    /**
     * 공장을 등록한다.
     * @param requestVO 등록 요청
     * @return 등록 결과
     */
    FactoryRegistrationResultVO registerFactory(FactoryRegistrationRequestVO requestVO);

    /**
     * 대시보드 테넌트 목록을 조회한다.
     * @param queryVO 조회 조건
     * @return 조회 결과
     */
    PlatformTenantDashboardResultVO listDashboardTenants(PlatformTenantDashboardQueryVO queryVO);

    /**
     * 최근 테넌트 목록을 조회한다.
     * @param limit 조회 건수
     * @return 테넌트 목록
     */
    List<SampleTenantVO> listRecentTenants(int limit);
}
