package egovframework.let.dashboard.service;

import java.util.List;

import egovframework.let.dashboard.domain.model.DashboardNoticeVO;
import egovframework.let.dashboard.domain.model.DashboardOverviewVO;
import egovframework.let.dashboard.domain.model.DashboardSummaryVO;
import egovframework.let.dashboard.domain.model.DashboardTodoVO;

/**
 * 대시보드 조회를 위한 서비스 인터페이스 클래스
 */
public interface DashboardService {

    public List<DashboardTodoVO> listMyTodos(String tenantCode, String actorLoginCode) throws Exception;

    public List<DashboardTodoVO> listMyApprovalAlerts(String tenantCode, String actorLoginCode) throws Exception;

    public List<DashboardNoticeVO> listNotices(String tenantCode, String actorLoginCode) throws Exception;

    public DashboardSummaryVO getSummary(String tenantCode, String actorLoginCode) throws Exception;

    public DashboardOverviewVO getOverview(String tenantCode, String actorLoginCode) throws Exception;
}
