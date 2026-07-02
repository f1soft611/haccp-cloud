package egovframework.let.platform_admin.dashboard.controller;

import javax.annotation.Resource;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import egovframework.let.platform_admin.access.web.PlanAccessLevel;
import egovframework.let.platform_admin.access.web.PlanAccessPolicy;
import egovframework.let.platform_admin.dashboard.service.PlatformDashboardService;
import egovframework.let.platform_admin.dashboard.domain.model.PlatformDashboardCcpDocumentsVO;
import egovframework.let.platform_admin.dashboard.domain.model.PlatformDashboardKpisVO;
import egovframework.let.platform_admin.dashboard.domain.model.PlatformDashboardTenantCodeIssuanceVO;
import egovframework.let.platform_admin.tenants.domain.model.PlatformTenantDashboardQueryVO;
import egovframework.let.platform_admin.tenants.domain.model.PlatformTenantDashboardResultVO;

@RestController
@RequestMapping("/api/platform-admin/dashboard")
public class PlatformDashboardApiController {

    @Resource(name = "platformDashboardService")
    private PlatformDashboardService platformDashboardService;

        @PlanAccessPolicy(
            menuUrl = "/platform/tenants",
            featureCode = "FEATURE_PLATFORM_TENANT_MGMT",
            requiredPermissionLevel = PlanAccessLevel.READ
        )
    @GetMapping("/kpis")
    public PlatformDashboardKpisVO getDashboardKpis() {
        return platformDashboardService.getDashboardKpis();
    }

        @PlanAccessPolicy(
            menuUrl = "/platform/tenants",
            featureCode = "FEATURE_PLATFORM_TENANT_MGMT",
            requiredPermissionLevel = PlanAccessLevel.READ
        )
    @GetMapping("/tenant-code-issuance")
    public PlatformDashboardTenantCodeIssuanceVO getTenantCodeIssuance() {
        return platformDashboardService.getTenantCodeIssuance();
    }

        @PlanAccessPolicy(
            menuUrl = "/platform/tenants",
            featureCode = "FEATURE_PLATFORM_TENANT_MGMT",
            requiredPermissionLevel = PlanAccessLevel.READ
        )
    @GetMapping("/tenants")
    public PlatformTenantDashboardResultVO listDashboardTenants(
            @RequestParam(defaultValue = "0") int pageIndex,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) String searchField,
            @RequestParam(required = false) String searchKeyword,
            @RequestParam(required = false, defaultValue = "all") String status,
            @RequestParam(required = false, defaultValue = "all") String onboardingStatus) {
        PlatformTenantDashboardQueryVO queryVO = new PlatformTenantDashboardQueryVO();
        queryVO.setPageIndex(pageIndex);
        queryVO.setPageSize(pageSize);
        queryVO.setSearchField(searchField);
        queryVO.setSearchKeyword(searchKeyword);
        queryVO.setStatus(status);
        queryVO.setOnboardingStatus(onboardingStatus);
        return platformDashboardService.listDashboardTenants(queryVO);
    }

    @PlanAccessPolicy(
            menuUrl = "/platform/tenants",
            featureCode = "FEATURE_PLATFORM_TENANT_MGMT",
            requiredPermissionLevel = PlanAccessLevel.READ
    )
    @GetMapping("/ccp-documents")
    public PlatformDashboardCcpDocumentsVO getCcpDocuments() {
        return platformDashboardService.getCcpDocuments();
    }
}
