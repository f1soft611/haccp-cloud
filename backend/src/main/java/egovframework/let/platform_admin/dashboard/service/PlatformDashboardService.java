package egovframework.let.platform_admin.dashboard.service;

import egovframework.let.platform_admin.dashboard.domain.model.PlatformDashboardCcpDocumentsVO;
import egovframework.let.platform_admin.dashboard.domain.model.PlatformDashboardKpisVO;
import egovframework.let.platform_admin.dashboard.domain.model.PlatformDashboardTenantCodeIssuanceVO;
import egovframework.let.platform_admin.tenants.domain.model.PlatformTenantDashboardQueryVO;
import egovframework.let.platform_admin.tenants.domain.model.PlatformTenantDashboardResultVO;

/**
 * 플랫폼 대시보드 서비스
 * @author SHMT-MES
 * @since 2026.06.22
 * @version 1.0
 * @see
 *
 * <pre>
 * << 개정이력(Modification Information) >>
 *
 *   수정일      수정자           수정내용
 *  -------    --------    ---------------------------
 *   2026.06.22 SHMT-MES          최초 생성
 *
 * </pre>
 */
public interface PlatformDashboardService {

    /**
     * 대시보드 KPI를 조회한다.
     * @return KPI 정보
     */
    PlatformDashboardKpisVO getDashboardKpis();

    /**
     * 테넌트 코드 발급 현황을 조회한다.
     * @return 코드 발급 현황
     */
    PlatformDashboardTenantCodeIssuanceVO getTenantCodeIssuance();

    /**
     * 대시보드 테넌트 목록을 조회한다.
     * @param queryVO 조회 조건
     * @return 조회 결과
     */
    PlatformTenantDashboardResultVO listDashboardTenants(PlatformTenantDashboardQueryVO queryVO);

    /**
     * CCP 문서 현황을 조회한다.
     * @return CCP 문서 현황
     */
    PlatformDashboardCcpDocumentsVO getCcpDocuments();
}
