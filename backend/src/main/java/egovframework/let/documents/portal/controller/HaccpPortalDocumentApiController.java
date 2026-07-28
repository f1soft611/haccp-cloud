package egovframework.let.documents.portal.controller;

import java.util.HashMap;
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
import egovframework.let.documents.portal.service.HaccpPortalDocumentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

/**
 * HACCP 문서포탈 컨트롤러
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/docs/portal")
@Tag(name = "HaccpPortalDocumentApiController", description = "HACCP 문서포탈 목록 조회")
public class HaccpPortalDocumentApiController {

    private final ResultVoHelper resultVoHelper;
    private final HaccpPortalDocumentService haccpPortalDocumentService;

    @Operation(
            summary = "HACCP 문서포탈 목록 조회",
            description = "관리자용 HACCP 문서포탈 목록을 분류별 표시용 데이터로 조회한다",
            security = {@SecurityRequirement(name = "Authorization")},
            tags = {"HaccpPortalDocumentApiController"}
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "403", description = "인가된 사용자가 아님")
    })
    @GetMapping
    public ResultVO listPortalDocuments(
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            @Parameter(hidden = true) @AuthenticationPrincipal LoginVO user,
            HttpServletRequest request) throws Exception {
        String tenantCode = resolveTenantCode(tenantHeader, request);

        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("resultList", haccpPortalDocumentService.listPortalDocuments(tenantCode));
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
}
