package egovframework.let.platform_admin.dashboard.domain.repository;

import egovframework.let.platform_admin.dashboard.domain.model.PlatformDashboardSearchConditionVO;
import egovframework.let.platform_admin.dashboard.domain.model.PlatformDashboardTenantCodeIssuanceVO;

import java.util.List;

/**
 * 플랫폼 대시보드 DAO
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
public interface PlatformDashboardDAO {

    /**
     * 대시보드 테넌트 수를 조회한다.
     * @param condition 조회 조건
     * @return 테넌트 수
     * @throws Exception
     */
    int selectDashboardTenantCount(PlatformDashboardSearchConditionVO condition) throws Exception;

    /**
     * 활성 테넌트 수를 조회한다.
     * @return 활성 테넌트 수
     * @throws Exception
     */
    int selectActiveTenantCount() throws Exception;

    /**
     * 최근 7일 신규 테넌트 수를 조회한다.
     * @return 최근 7일 신규 테넌트 수
     * @throws Exception
     */
    int selectNewTenantsLast7DaysCount() throws Exception;

    /**
     * 당월 코드 발급 건수를 조회한다.
     * @return 당월 코드 발급 건수
     * @throws Exception
     */
    int selectIssuedThisMonthCount() throws Exception;

    /**
     * 당주 코드 발급 건수를 조회한다.
     * @return 당주 코드 발급 건수
     * @throws Exception
     */
    int selectIssuedThisWeekCount() throws Exception;

    /**
     * 최근 발급 이력 목록을 조회한다.
     * @param limit 조회 건수
     * @return 최근 발급 이력 목록
     * @throws Exception
     */
    List<PlatformDashboardTenantCodeIssuanceVO.RecentIssueVO> selectRecentIssues(int limit) throws Exception;
}
