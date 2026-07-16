package egovframework.let.dashboard.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import egovframework.com.cmm.LoginVO;
import egovframework.com.cmm.ResponseCode;
import egovframework.com.cmm.service.ResultVO;
import egovframework.com.cmm.util.EgovUserDetailsHelper;
import egovframework.com.cmm.util.ResultVoHelper;
import egovframework.let.dashboard.domain.model.DashboardNoticeVO;
import egovframework.let.dashboard.domain.model.DashboardOverviewVO;
import egovframework.let.dashboard.domain.model.DashboardTodoVO;
import egovframework.let.dashboard.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

/**
 * 대시보드 조회를 위한 컨트롤러 클래스
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/dashboard")
@Tag(name = "DashboardApiController", description = "대시보드 조회")
public class DashboardApiController {

    private final ResultVoHelper resultVoHelper;
    private final DashboardService dashboardService;

    @Operation(
            summary = "대시보드 할일 목록 조회",
            description = "대시보드에서 노출할 내 할일 목록을 조회한다",
            security = { @SecurityRequirement(name = "Authorization") },
            tags = { "DashboardApiController" }
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "403", description = "인가된 사용자가 아님")
    })
    @GetMapping("/todos")
    public ResultVO listMyTodos(
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            @Parameter(hidden = true) @AuthenticationPrincipal LoginVO user,
            HttpServletRequest request) throws Exception {
        String tenantCode = resolveTenantCode(tenantHeader, request);
        List<DashboardTodoVO> resultList = dashboardService.listMyTodos(tenantCode, resolveLoginCode(user));

        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("resultList", resultList);
        resultMap.put("user", user);

        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    @Operation(
            summary = "대시보드 결재 알림 목록 조회",
            description = "대시보드에서 노출할 내 결재 알림 목록을 조회한다",
            security = { @SecurityRequirement(name = "Authorization") },
            tags = { "DashboardApiController" }
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "403", description = "인가된 사용자가 아님")
    })
    @GetMapping("/approval-alerts")
    public ResultVO listMyApprovalAlerts(
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            @Parameter(hidden = true) @AuthenticationPrincipal LoginVO user,
            HttpServletRequest request) throws Exception {
        String tenantCode = resolveTenantCode(tenantHeader, request);
        List<DashboardTodoVO> resultList = dashboardService.listMyApprovalAlerts(tenantCode, resolveLoginCode(user));

        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("resultList", resultList);
        resultMap.put("user", user);

        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    @Operation(
            summary = "대시보드 공지 목록 조회",
            description = "대시보드 공지 목록을 조회한다",
            security = { @SecurityRequirement(name = "Authorization") },
            tags = { "DashboardApiController" }
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "403", description = "인가된 사용자가 아님")
    })
    @GetMapping("/notices")
    public ResultVO listNotices(
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            @Parameter(hidden = true) @AuthenticationPrincipal LoginVO user,
            HttpServletRequest request) throws Exception {
        String tenantCode = resolveTenantCode(tenantHeader, request);
        List<DashboardNoticeVO> resultList = dashboardService.listNotices(tenantCode, resolveLoginCode(user));

        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("resultList", resultList);
        resultMap.put("user", user);

        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    @Operation(
            summary = "대시보드 통합 조회",
            description = "할일, 공지, 집계를 한 번에 조회한다",
            security = { @SecurityRequirement(name = "Authorization") },
            tags = { "DashboardApiController" }
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "403", description = "인가된 사용자가 아님")
    })
    @GetMapping("/overview")
    public ResultVO getOverview(
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            @Parameter(hidden = true) @AuthenticationPrincipal LoginVO user,
            HttpServletRequest request) throws Exception {
        String tenantCode = resolveTenantCode(tenantHeader, request);
        DashboardOverviewVO overview = dashboardService.getOverview(tenantCode, resolveLoginCode(user));

        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("item", overview);
        resultMap.put("user", user);

        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    private String resolveTenantCode(String tenantHeader, HttpServletRequest request) {
        if (StringUtils.hasText(tenantHeader)) {
            return tenantHeader.trim().toUpperCase();
        }

        Object userDetails = EgovUserDetailsHelper.getAuthenticatedUser();
        if (userDetails instanceof LoginVO) {
            LoginVO loginVO = (LoginVO) userDetails;
            if (StringUtils.hasText(loginVO.getTenantCode())) {
                return loginVO.getTenantCode().trim().toUpperCase();
            }
        }

        Object attributeTenantCode = request.getAttribute("tenantCode");
        if (attributeTenantCode != null && StringUtils.hasText(String.valueOf(attributeTenantCode))) {
            return String.valueOf(attributeTenantCode).trim().toUpperCase();
        }

        return "PLATFORM";
    }

    private String resolveLoginCode(LoginVO user) {
        if (user != null && StringUtils.hasText(user.getId())) {
            return user.getId().trim();
        }

        Object userDetails = EgovUserDetailsHelper.getAuthenticatedUser();
        if (userDetails instanceof LoginVO) {
            LoginVO loginVO = (LoginVO) userDetails;
            if (StringUtils.hasText(loginVO.getId())) {
                return loginVO.getId().trim();
            }
        }
        return null;
    }
}
