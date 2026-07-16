package egovframework.let.dashboard.service.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.egovframe.rte.fdl.cmmn.EgovAbstractServiceImpl;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import egovframework.let.dashboard.domain.model.DashboardNoticeVO;
import egovframework.let.dashboard.domain.model.DashboardOverviewVO;
import egovframework.let.dashboard.domain.model.DashboardSearchConditionVO;
import egovframework.let.dashboard.domain.model.DashboardSummaryVO;
import egovframework.let.dashboard.domain.model.DashboardTodoVO;
import egovframework.let.dashboard.domain.repository.DashboardDAO;
import egovframework.let.dashboard.service.DashboardService;
import lombok.RequiredArgsConstructor;

/**
 * 대시보드 조회를 위한 서비스 구현 클래스
 */
@Service("dashboardService")
@RequiredArgsConstructor
public class DashboardServiceImpl extends EgovAbstractServiceImpl implements DashboardService {

    private final DashboardDAO dashboardDAO;

    @Override
    public List<DashboardTodoVO> listMyTodos(String tenantCode, String actorLoginCode) throws Exception {
        return dashboardDAO.selectMyTodoList(buildCondition(tenantCode, actorLoginCode));
    }

    @Override
    public List<DashboardTodoVO> listMyApprovalAlerts(String tenantCode, String actorLoginCode) throws Exception {
        List<DashboardTodoVO> todos = dashboardDAO.selectMyTodoList(buildCondition(tenantCode, actorLoginCode));
        return todos.stream()
                .filter(DashboardTodoVO::isPendingApprovalAlert)
                .collect(Collectors.toList());
    }

    @Override
    public List<DashboardNoticeVO> listNotices(String tenantCode, String actorLoginCode) throws Exception {
        return dashboardDAO.selectRecentNotices(buildCondition(tenantCode, actorLoginCode));
    }

    @Override
    public DashboardSummaryVO getSummary(String tenantCode, String actorLoginCode) throws Exception {
        DashboardSummaryVO summary = dashboardDAO.selectSummary(buildCondition(tenantCode, actorLoginCode));
        if (summary == null) {
            summary = new DashboardSummaryVO();
        }
        return summary;
    }

    @Override
    public DashboardOverviewVO getOverview(String tenantCode, String actorLoginCode) throws Exception {
        List<DashboardTodoVO> todoList = listMyTodos(tenantCode, actorLoginCode);
        List<DashboardNoticeVO> noticeList = listNotices(tenantCode, actorLoginCode);
        DashboardSummaryVO summary = getSummary(tenantCode, actorLoginCode);
        summary.setNoticeCount(noticeList == null ? 0 : noticeList.size());

        DashboardOverviewVO overview = new DashboardOverviewVO();
        overview.setSummary(summary);
        overview.setTodoList(todoList);
        overview.setNoticeList(noticeList);
        return overview;
    }

    private DashboardSearchConditionVO buildCondition(String tenantCode, String actorLoginCode) throws Exception {
        String normalizedTenantCode = normalizeTenantCode(tenantCode);
        Long tenantId = resolveTenantId(normalizedTenantCode);
        Long actorLoginId = resolveActorLoginId(tenantId, actorLoginCode);
        Long actorUserId = resolveActorUserId(tenantId, actorLoginId);

        DashboardSearchConditionVO condition = new DashboardSearchConditionVO();
        condition.setTenantCode(normalizedTenantCode);
        condition.setActorLoginId(actorLoginId);
        condition.setActorUserId(actorUserId);
        condition.setActorLoginCode(StringUtils.hasText(actorLoginCode) ? actorLoginCode.trim() : null);
        return condition;
    }

    private Long resolveTenantId(String tenantCode) throws Exception {
        Long tenantId = dashboardDAO.selectTenantIdByCode(tenantCode);
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "테넌트를 찾을 수 없습니다: " + tenantCode);
        }
        return tenantId;
    }

    private Long resolveActorLoginId(Long tenantId, String actorLoginCode) throws Exception {
        if (!StringUtils.hasText(actorLoginCode)) {
            return null;
        }

        Map<String, Object> params = new HashMap<String, Object>();
        params.put("tenantId", tenantId);
        params.put("loginCode", actorLoginCode.trim());
        return dashboardDAO.selectLoginIdByTenantAndLoginCode(params);
    }

    private Long resolveActorUserId(Long tenantId, Long actorLoginId) throws Exception {
        if (tenantId == null || actorLoginId == null) {
            return null;
        }

        Map<String, Object> params = new HashMap<String, Object>();
        params.put("tenantId", tenantId);
        params.put("loginId", actorLoginId);
        return dashboardDAO.selectUserIdByTenantAndLoginId(params);
    }

    private String normalizeTenantCode(String tenantCode) {
        return StringUtils.hasText(tenantCode) ? tenantCode.trim().toUpperCase() : "";
    }
}
