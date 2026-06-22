package egovframework.let.platforms.dashboard.service.impl;

import java.util.ArrayList;
import java.util.List;

import javax.annotation.Resource;

import egovframework.let.platforms.dashboard.domain.repository.PlatformDashboardDAO;
import org.springframework.stereotype.Service;

import egovframework.let.platforms.dashboard.service.PlatformDashboardService;
import egovframework.let.platforms.dashboard.domain.model.PlatformDashboardCcpDocumentsVO;
import egovframework.let.platforms.dashboard.domain.model.PlatformDashboardKpisVO;
import egovframework.let.platforms.dashboard.domain.model.PlatformDashboardSearchConditionVO;
import egovframework.let.platforms.dashboard.domain.model.PlatformDashboardTenantCodeIssuanceVO;
import egovframework.let.platforms.factories.service.PlatformFactoryService;
import egovframework.let.platforms.factories.domain.model.PlatformTenantDashboardQueryVO;
import egovframework.let.platforms.factories.domain.model.PlatformTenantDashboardResultVO;

/**
 * 플랫폼 대시보드 서비스 구현체
 * @author AI Assistant
 * @since 2026.06.22
 * @version 1.0
 */
@Service("platformDashboardService")
public class PlatformDashboardServiceImpl implements PlatformDashboardService {

    @Resource(name = "platformFactoryService")
    private PlatformFactoryService platformFactoryService;

    @Resource(name = "platformDashboardDAO")
    private PlatformDashboardDAO platformDashboardDAO;

    @Override
    public PlatformDashboardKpisVO getDashboardKpis() {
        PlatformDashboardKpisVO response = new PlatformDashboardKpisVO();
        int activeTenants;
        int newTenantsLast7Days;
        try {
            activeTenants = platformDashboardDAO.selectActiveTenantCount();
            newTenantsLast7Days = platformDashboardDAO.selectNewTenantsLast7DaysCount();
        } catch (Exception ex) {
            activeTenants = 0;
            newTenantsLast7Days = 0;
        }

        response.setActiveTenants(activeTenants);
        response.setNewTenantsLast7Days(newTenantsLast7Days);
        response.setCcpDocCompletionRate(0);
        response.setTenantsWithoutCcpDocs(activeTenants);
        return response;
    }

    @Override
    public PlatformDashboardTenantCodeIssuanceVO getTenantCodeIssuance() {
        PlatformDashboardTenantCodeIssuanceVO response = new PlatformDashboardTenantCodeIssuanceVO();
        try {
            PlatformDashboardSearchConditionVO condition = new PlatformDashboardSearchConditionVO();
            response.setTotalIssued(platformDashboardDAO.selectDashboardTenantCount(condition));
            response.setIssuedThisMonth(platformDashboardDAO.selectIssuedThisMonthCount());
            response.setIssuedThisWeek(platformDashboardDAO.selectIssuedThisWeekCount());
            response.setRecentIssues(platformDashboardDAO.selectRecentIssues(5));
        } catch (Exception ex) {
            response.setTotalIssued(0);
            response.setIssuedThisMonth(0);
            response.setIssuedThisWeek(0);
            response.setRecentIssues(new ArrayList<PlatformDashboardTenantCodeIssuanceVO.RecentIssueVO>());
        }
        return response;
    }

    @Override
    public PlatformTenantDashboardResultVO listDashboardTenants(PlatformTenantDashboardQueryVO queryVO) {
        return platformFactoryService.listDashboardTenants(queryVO);
    }

    @Override
    public PlatformDashboardCcpDocumentsVO getCcpDocuments() {
        PlatformTenantDashboardResultVO tenants = getAllDashboardTenants();

        PlatformDashboardCcpDocumentsVO response = new PlatformDashboardCcpDocumentsVO();
        List<PlatformDashboardCcpDocumentsVO.ItemVO> items = new ArrayList<PlatformDashboardCcpDocumentsVO.ItemVO>();

        if (tenants.getItems() != null) {
            for (int i = 0; i < tenants.getItems().size(); i++) {
                PlatformDashboardCcpDocumentsVO.ItemVO row = new PlatformDashboardCcpDocumentsVO.ItemVO();
                row.setTenantCode(tenants.getItems().get(i).getTenantCode());
                row.setCompanyName(tenants.getItems().get(i).getCompanyName());
                row.setGeneratedCount(0);
                row.setRequiredCount(3);
                row.setCompletionRate(0);
                row.setUpdatedAt(tenants.getItems().get(i).getCreatedAt());
                items.add(row);
            }
        }

        PlatformDashboardCcpDocumentsVO.OverallVO overall = new PlatformDashboardCcpDocumentsVO.OverallVO();
        overall.setCompletionRate(0);
        overall.setCompletedTenants(0);
        overall.setTotalTenants(items.size());

        response.setOverall(overall);
        response.setItems(items);
        return response;
    }

    private PlatformTenantDashboardResultVO getAllDashboardTenants() {
        PlatformTenantDashboardQueryVO queryVO = new PlatformTenantDashboardQueryVO();
        queryVO.setPageIndex(0);
        queryVO.setPageSize(100);
        queryVO.setStatus("all");
        return platformFactoryService.listDashboardTenants(queryVO);
    }

}
