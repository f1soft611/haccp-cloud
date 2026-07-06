package egovframework.let.platform_admin.dashboard.controller;

import javax.annotation.Resource;
import java.util.HashMap;
import java.util.Map;

import egovframework.com.cmm.ResponseCode;
import egovframework.com.cmm.service.ResultVO;
import egovframework.com.cmm.util.ResultVoHelper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import egovframework.let.platform_admin.access.web.PlanAccessLevel;
import egovframework.let.platform_admin.access.web.PlanAccessPolicy;
import egovframework.let.platform_admin.dashboard.service.PlatformDashboardService;
import egovframework.let.platform_admin.tenants.domain.model.PlatformTenantDashboardQueryVO;

/**
 * 플랫폼 대시보드 API 컨트롤러
 * @author SHMT-MES
 * @since 2026.07.03
 * @version 1.0
 * @see
 *
 * <pre>
 * << 개정이력(Modification Information) >>
 *
 *   수정일      수정자           수정내용
 *  -------    --------    ---------------------------
 *   2026.07.03 SHMT-MES          최초 생성
 *
 * </pre>
 */
@RestController
@Tag(name = "PlatformDashboardApiController", description = "플랫폼 대시보드 관리")
@RequestMapping("/api/v1/platform-admin/dashboard")
public class PlatformDashboardApiController {

    @Resource(name = "platformDashboardService")
    private PlatformDashboardService platformDashboardService;

        @Resource(name = "resultVoHelper")
        private ResultVoHelper resultVoHelper;

    /**
     * 대시보드 KPI 정보를 조회한다.
     */
    @Operation(
            summary = "대시보드 KPI 조회",
            description = "플랫폼 대시보드 KPI 정보를 조회",
            security = {@SecurityRequirement(name = "Authorization")},
            tags = {"PlatformDashboardApiController"}
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "403", description = "인가 실패")
    })
    @PlanAccessPolicy(
            menuUrl = "/platform/tenants",
            featureCode = "FEATURE_PLATFORM_TENANT_MGMT",
            requiredPermissionLevel = PlanAccessLevel.READ
    )
    @GetMapping("/kpis")
        public ResultVO getDashboardKpis() {
                Map<String, Object> resultMap = new HashMap<String, Object>();
                resultMap.put("data", platformDashboardService.getDashboardKpis());
                return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    /**
     * 테넌트 코드 발급 현황을 조회한다.
     */
    @Operation(
            summary = "테넌트 코드 발급 현황 조회",
            description = "테넌트 코드 발급 집계 및 최근 이력을 조회",
            security = {@SecurityRequirement(name = "Authorization")},
            tags = {"PlatformDashboardApiController"}
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "403", description = "인가 실패")
    })
    @PlanAccessPolicy(
            menuUrl = "/platform/tenants",
            featureCode = "FEATURE_PLATFORM_TENANT_MGMT",
            requiredPermissionLevel = PlanAccessLevel.READ
    )
    @GetMapping("/tenant-code-issuance")
        public ResultVO getTenantCodeIssuance() {
                Map<String, Object> resultMap = new HashMap<String, Object>();
                resultMap.put("data", platformDashboardService.getTenantCodeIssuance());
                return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    /**
     * 대시보드 테넌트 목록을 조회한다.
     */
    @Operation(
            summary = "대시보드 테넌트 목록 조회",
            description = "검색/상태 조건 기반 대시보드 테넌트 목록을 조회",
            security = {@SecurityRequirement(name = "Authorization")},
            tags = {"PlatformDashboardApiController"}
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "403", description = "인가 실패")
    })
    @PlanAccessPolicy(
            menuUrl = "/platform/tenants",
            featureCode = "FEATURE_PLATFORM_TENANT_MGMT",
            requiredPermissionLevel = PlanAccessLevel.READ
    )
    @GetMapping("/tenants")
        public ResultVO listDashboardTenants(
            @Parameter(description = "페이지 인덱스") @RequestParam(defaultValue = "0") int pageIndex,
            @Parameter(description = "페이지 크기") @RequestParam(defaultValue = "10") int pageSize,
            @Parameter(description = "검색 필드") @RequestParam(required = false) String searchField,
            @Parameter(description = "검색어") @RequestParam(required = false) String searchKeyword,
            @Parameter(description = "사용 상태") @RequestParam(required = false, defaultValue = "all") String status,
            @Parameter(description = "온보딩 상태") @RequestParam(required = false, defaultValue = "all") String onboardingStatus) {
        PlatformTenantDashboardQueryVO queryVO = new PlatformTenantDashboardQueryVO();
        queryVO.setPageIndex(pageIndex);
        queryVO.setPageSize(pageSize);
        queryVO.setSearchField(searchField);
        queryVO.setSearchKeyword(searchKeyword);
        queryVO.setStatus(status);
        queryVO.setOnboardingStatus(onboardingStatus);
                Map<String, Object> resultMap = new HashMap<String, Object>();
                resultMap.put("data", platformDashboardService.listDashboardTenants(queryVO));
                return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

        /**
         * CCP 문서 현황 정보를 조회한다.
         */
        @Operation(
            summary = "CCP 문서 현황 조회",
            description = "테넌트별 CCP 문서 현황을 조회",
            security = {@SecurityRequirement(name = "Authorization")},
            tags = {"PlatformDashboardApiController"}
        )
        @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "403", description = "인가 실패")
        })
    @PlanAccessPolicy(
            menuUrl = "/platform/tenants",
            featureCode = "FEATURE_PLATFORM_TENANT_MGMT",
            requiredPermissionLevel = PlanAccessLevel.READ
    )
    @GetMapping("/ccp-documents")
        public ResultVO getCcpDocuments() {
                Map<String, Object> resultMap = new HashMap<String, Object>();
                resultMap.put("data", platformDashboardService.getCcpDocuments());
                return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }
}
