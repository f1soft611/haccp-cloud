package egovframework.let.dashboard.domain.repository;

import java.util.List;
import java.util.Map;

import org.egovframe.rte.psl.dataaccess.EgovAbstractMapper;
import org.springframework.stereotype.Repository;

import egovframework.let.dashboard.domain.model.DashboardNoticeVO;
import egovframework.let.dashboard.domain.model.DashboardSearchConditionVO;
import egovframework.let.dashboard.domain.model.DashboardSummaryVO;
import egovframework.let.dashboard.domain.model.DashboardTodoVO;

/**
 * 대시보드 조회를 위한 데이터 접근 클래스
 */
@Repository("dashboardDAO")
public class DashboardDAO extends EgovAbstractMapper {

    public List<DashboardTodoVO> selectMyTodoList(DashboardSearchConditionVO condition) throws Exception {
        return selectList("DashboardDAO.selectMyTodoList", condition);
    }

    public List<DashboardTodoVO> selectMyApprovalAlertList(DashboardSearchConditionVO condition) throws Exception {
        return selectList("DashboardDAO.selectMyApprovalAlertList", condition);
    }

    public DashboardSummaryVO selectSummary(DashboardSearchConditionVO condition) throws Exception {
        return selectOne("DashboardDAO.selectSummary", condition);
    }

    public List<DashboardNoticeVO> selectRecentNotices(DashboardSearchConditionVO condition) throws Exception {
        return selectList("DashboardDAO.selectRecentNotices", condition);
    }

    public Long selectTenantIdByCode(String tenantCode) throws Exception {
        return selectOne("DashboardDAO.selectTenantIdByCode", tenantCode);
    }

    public Long selectLoginIdByTenantAndLoginCode(Map<String, Object> params) throws Exception {
        return selectOne("DashboardDAO.selectLoginIdByTenantAndLoginCode", params);
    }

    public Long selectUserIdByTenantAndLoginId(Map<String, Object> params) throws Exception {
        return selectOne("DashboardDAO.selectUserIdByTenantAndLoginId", params);
    }
}
