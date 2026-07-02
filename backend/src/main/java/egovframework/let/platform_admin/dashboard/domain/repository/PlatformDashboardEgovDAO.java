package egovframework.let.platform_admin.dashboard.domain.repository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.egovframe.rte.psl.dataaccess.EgovAbstractMapper;
import org.springframework.stereotype.Repository;

import egovframework.let.platform_admin.dashboard.domain.model.PlatformDashboardSearchConditionVO;
import egovframework.let.platform_admin.dashboard.domain.model.PlatformDashboardTenantCodeIssuanceVO;

/**
 * 플랫폼 대시보드 DAO
 */
@Repository("platformDashboardDAO")
public class PlatformDashboardEgovDAO extends EgovAbstractMapper implements PlatformDashboardDAO {

    /**
     * 대시보드 테넌트 조건별 건수를 조회한다.
     */
    @Override
    public int selectDashboardTenantCount(PlatformDashboardSearchConditionVO condition) throws Exception {
        Integer count = selectOne("PlatformDashboardDAO.selectDashboardTenantCount", condition);
        return count == null ? 0 : count;
    }

    /**
     * 활성 테넌트 건수를 조회한다.
     */
    @Override
    public int selectActiveTenantCount() throws Exception {
        Integer count = selectOne("PlatformDashboardDAO.selectActiveTenantCount");
        return count == null ? 0 : count;
    }

    /**
     * 최근 7일 신규 테넌트 건수를 조회한다.
     */
    @Override
    public int selectNewTenantsLast7DaysCount() throws Exception {
        Integer count = selectOne("PlatformDashboardDAO.selectNewTenantsLast7DaysCount");
        return count == null ? 0 : count;
    }

    /**
     * 이번 달 발급 건수를 조회한다.
     */
    @Override
    public int selectIssuedThisMonthCount() throws Exception {
        Integer count = selectOne("PlatformDashboardDAO.selectIssuedThisMonthCount");
        return count == null ? 0 : count;
    }

    /**
     * 이번 주 발급 건수를 조회한다.
     */
    @Override
    public int selectIssuedThisWeekCount() throws Exception {
        Integer count = selectOne("PlatformDashboardDAO.selectIssuedThisWeekCount");
        return count == null ? 0 : count;
    }

    /**
     * 최근 발급 이슈 목록을 조회한다.
     */
    @Override
    public List<PlatformDashboardTenantCodeIssuanceVO.RecentIssueVO> selectRecentIssues(int limit) throws Exception {
        Map<String, Object> param = new HashMap<String, Object>();
        param.put("limit", limit);
        return selectList("PlatformDashboardDAO.selectRecentIssues", param);
    }
}
