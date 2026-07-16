package egovframework.let.documents.haccpwork.controller;

import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import egovframework.com.cmm.LoginVO;
import egovframework.com.cmm.ResponseCode;
import egovframework.com.cmm.service.ResultVO;
import egovframework.com.cmm.util.EgovUserDetailsHelper;
import egovframework.com.cmm.util.ResultVoHelper;
import egovframework.let.documents.haccpwork.domain.model.HaccpWorkApprovalStatusUpdateRequestVO;
import egovframework.let.documents.haccpwork.domain.model.HaccpWorkDraftSubmitRequestVO;
import egovframework.let.documents.haccpwork.domain.model.HaccpWorkDraftTempSaveRequestVO;
import egovframework.let.documents.haccpwork.domain.model.HaccpWorkVO;
import egovframework.let.documents.haccpwork.service.HaccpWorkDraftService;
import egovframework.let.documents.haccpwork.service.HaccpWorkFlowService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

/**
 * HACCP 업무 작성~결재 흐름을 위한 컨트롤러 클래스
 * @author SHMT-MES
 * @since 2026.07.16
 * @version 1.0
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/haccp-work")
@Tag(name = "HaccpWorkApiController", description = "HACCP 업무 작성/임시저장/결재신청")
public class HaccpWorkApiController {

    private final ResultVoHelper resultVoHelper;
    private final HaccpWorkDraftService haccpWorkDraftService;
    private final HaccpWorkFlowService haccpWorkFlowService;

    @Operation(
            summary = "기안 템플릿 조회",
            description = "작성 페이지 진입 시 템플릿 ID 또는 결재문서 ID로 기안 템플릿을 조회한다",
            security = { @SecurityRequirement(name = "Authorization") },
            tags = { "HaccpWorkApiController" }
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "403", description = "인가된 사용자가 아님"),
            @ApiResponse(responseCode = "404", description = "템플릿을 찾을 수 없음")
    })
    @GetMapping("/drafts/{id}/template")
    public ResultVO getDraftTemplate(
            @PathVariable Long id,
            @RequestParam(name = "idType", required = false, defaultValue = "work") String idType,
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            @Parameter(hidden = true) @AuthenticationPrincipal LoginVO user,
            HttpServletRequest request) throws Exception {
        String tenantCode = resolveTenantCode(tenantHeader, request);
        HaccpWorkVO item = haccpWorkDraftService.getDraftTemplate(
            tenantCode,
            id,
            idType,
            resolveLoginCode(user)
        );

        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("item", item);
        resultMap.put("user", user);
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    @Operation(
            summary = "기안 임시저장",
            description = "작성 중인 기안 내용을 업무 템플릿에 임시 저장한다",
            security = { @SecurityRequirement(name = "Authorization") },
            tags = { "HaccpWorkApiController" }
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "저장 성공"),
            @ApiResponse(responseCode = "403", description = "인가된 사용자가 아님")
    })
    @PostMapping("/drafts/{workId}/temp-save")
    public ResultVO saveTempDraft(
            @PathVariable Long workId,
            @RequestBody HaccpWorkDraftTempSaveRequestVO payload,
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            @Parameter(hidden = true) @AuthenticationPrincipal LoginVO user,
            HttpServletRequest request) throws Exception {
        String tenantCode = resolveTenantCode(tenantHeader, request);
        HaccpWorkVO item = haccpWorkFlowService.saveTempDraft(
                workId,
                tenantCode,
                payload,
                resolveLoginCode(user)
        );

        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("item", item);
        resultMap.put("message", "기안이 임시저장되었습니다.");
        resultMap.put("user", user);
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    @Operation(
            summary = "기안 결재신청",
            description = "작성 완료된 기안을 결재신청한다",
            security = { @SecurityRequirement(name = "Authorization") },
            tags = { "HaccpWorkApiController" }
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "신청 성공"),
            @ApiResponse(responseCode = "403", description = "인가된 사용자가 아님")
    })
    @PostMapping("/drafts/{workId}/submit")
    public ResultVO submitDraft(
            @PathVariable Long workId,
            @RequestBody HaccpWorkDraftSubmitRequestVO payload,
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            @Parameter(hidden = true) @AuthenticationPrincipal LoginVO user,
            HttpServletRequest request) throws Exception {
        String tenantCode = resolveTenantCode(tenantHeader, request);
            Long approvalId = haccpWorkFlowService.submitDraft(workId, tenantCode, payload, resolveLoginCode(user));

            Map<String, Object> item = new HashMap<String, Object>();
            item.put("approvalId", approvalId);
            item.put("idType", "approval");
            item.put("id", approvalId);

        Map<String, Object> resultMap = new HashMap<String, Object>();
            resultMap.put("item", item);
        resultMap.put("message", "결재신청이 완료되었습니다.");
        resultMap.put("user", user);
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

            @Operation(
                summary = "결재 상태 업데이트",
                description = "검토 승인/반송/최종 승인 이벤트에 따라 결재선 app_status와 결재 메인 상태를 갱신한다",
                security = { @SecurityRequirement(name = "Authorization") },
                tags = { "HaccpWorkApiController" }
            )
            @ApiResponses(value = {
                @ApiResponse(responseCode = "200", description = "처리 성공"),
                @ApiResponse(responseCode = "403", description = "처리 권한 없음"),
                @ApiResponse(responseCode = "404", description = "결재 문서를 찾을 수 없음")
            })
            @PostMapping("/approvals/{approvalId}/status")
            public ResultVO updateApprovalStatus(
                @PathVariable Long approvalId,
                @RequestBody HaccpWorkApprovalStatusUpdateRequestVO payload,
                @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
                @Parameter(hidden = true) @AuthenticationPrincipal LoginVO user,
                HttpServletRequest request) throws Exception {
            String tenantCode = resolveTenantCode(tenantHeader, request);
            HaccpWorkVO item = haccpWorkFlowService.updateApprovalStatus(
                approvalId,
                tenantCode,
                payload,
                resolveLoginCode(user)
            );

            Map<String, Object> resultMap = new HashMap<String, Object>();
            resultMap.put("item", item);
            resultMap.put("message", "결재 상태가 갱신되었습니다.");
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
