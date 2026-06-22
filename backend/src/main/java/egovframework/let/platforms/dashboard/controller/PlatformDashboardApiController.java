package egovframework.let.platforms.dashboard.controller;

import javax.annotation.Resource;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import egovframework.let.platforms.dashboard.service.PlatformDashboardService;
import egovframework.let.platforms.dashboard.domain.model.PlatformDashboardCcpDocumentsVO;
import egovframework.let.platforms.dashboard.domain.model.PlatformDashboardKpisVO;
import egovframework.let.platforms.dashboard.domain.model.PlatformDashboardTenantCodeIssuanceVO;
import egovframework.let.platforms.factories.domain.model.PlatformTenantDashboardQueryVO;
import egovframework.let.platforms.factories.domain.model.PlatformTenantDashboardResultVO;

@RestController
@RequestMapping("/api/platform-admin/dashboard")
public class PlatformDashboardApiController {

    @Resource(name = "platformDashboardService")
    private PlatformDashboardService platformDashboardService;

    @GetMapping("/kpis")
    public PlatformDashboardKpisVO getDashboardKpis() {
        return platformDashboardService.getDashboardKpis();
    }

    @GetMapping("/tenant-code-issuance")
    public PlatformDashboardTenantCodeIssuanceVO getTenantCodeIssuance() {
        return platformDashboardService.getTenantCodeIssuance();
    }

    @GetMapping("/tenants")
    public PlatformTenantDashboardResultVO listDashboardTenants(
            @RequestParam(defaultValue = "0") int pageIndex,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) String searchField,
            @RequestParam(required = false) String searchKeyword,
            @RequestParam(required = false, defaultValue = "all") String status) {
        PlatformTenantDashboardQueryVO queryVO = new PlatformTenantDashboardQueryVO();
        queryVO.setPageIndex(pageIndex);
        queryVO.setPageSize(pageSize);
        queryVO.setSearchField(searchField);
        queryVO.setSearchKeyword(searchKeyword);
        queryVO.setStatus(status);
        return platformDashboardService.listDashboardTenants(queryVO);
    }

    @GetMapping("/ccp-documents")
    public PlatformDashboardCcpDocumentsVO getCcpDocuments() {
        return platformDashboardService.getCcpDocuments();
    }
}
