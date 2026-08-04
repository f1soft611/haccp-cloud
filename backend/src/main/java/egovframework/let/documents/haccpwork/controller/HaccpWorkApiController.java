package egovframework.let.documents.haccpwork.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
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
import egovframework.let.documents.haccpwork.domain.model.HaccpWorkApprovalCommentCreateRequestVO;
import egovframework.let.documents.haccpwork.domain.model.HaccpWorkApprovalCommentUpdateRequestVO;
import egovframework.let.documents.haccpwork.domain.model.HaccpWorkDraftSubmitRequestVO;
import egovframework.let.documents.haccpwork.domain.model.HaccpWorkDraftTempSaveRequestVO;
import egovframework.let.documents.haccpwork.domain.model.HaccpWorkVO;
import egovframework.let.documents.haccpwork.domain.model.HaccpAttachmentCompleteRequestVO;
import egovframework.let.documents.haccpwork.domain.model.HaccpAttachmentUploadRequestVO;
import egovframework.let.documents.haccpwork.service.HaccpWorkAttachmentService;
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
 *
 * @author SHMT-MES
 * @version 1.0
 * @since 2026.07.16
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/haccp-work")
@Tag(name = "HaccpWorkApiController", description = "HACCP 업무 작성/임시저장/결재신청")
public class HaccpWorkApiController {

    private final ResultVoHelper resultVoHelper;
    private final HaccpWorkDraftService haccpWorkDraftService;
    private final HaccpWorkFlowService haccpWorkFlowService;
    private final HaccpWorkAttachmentService haccpWorkAttachmentService;

    @PostMapping("/approvals/{approvalId}/attachments/presign-upload")
    public ResultVO presignUpload(
            @PathVariable Long approvalId,
            @RequestBody Map<String, List<HaccpAttachmentUploadRequestVO>> payload,
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            @Parameter(hidden = true) @AuthenticationPrincipal LoginVO user,
            HttpServletRequest request) throws Exception {
        String tenantCode = resolveTenantCode(tenantHeader, request);
        List<HaccpAttachmentUploadRequestVO> items = payload == null ? null : payload.get("items");

        Map<String, Object> resultMap = haccpWorkAttachmentService.presignUpload(
                approvalId,
                tenantCode,
                items,
                resolveLoginCode(user),
                resolveClientIp(request),
                resolveUserAgent(request)
        );
        resultMap.put("user", user);
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    @PostMapping("/approvals/{approvalId}/attachments/complete")
    public ResultVO completeUpload(
            @PathVariable Long approvalId,
            @RequestBody Map<String, List<HaccpAttachmentCompleteRequestVO>> payload,
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            @Parameter(hidden = true) @AuthenticationPrincipal LoginVO user,
            HttpServletRequest request) throws Exception {
        String tenantCode = resolveTenantCode(tenantHeader, request);
        List<HaccpAttachmentCompleteRequestVO> items = payload == null ? null : payload.get("items");

        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put(
                "resultList",
                haccpWorkAttachmentService.completeUpload(
                        approvalId,
                        tenantCode,
                        items,
                        resolveLoginCode(user)
                )
        );
        resultMap.put("user", user);
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    @GetMapping("/approvals/{approvalId}/attachments")
    public ResultVO listAttachments(
            @PathVariable Long approvalId,
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            @Parameter(hidden = true) @AuthenticationPrincipal LoginVO user,
            HttpServletRequest request) throws Exception {
        String tenantCode = resolveTenantCode(tenantHeader, request);
        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put(
                "resultList",
                haccpWorkAttachmentService.listAttachments(
                        approvalId,
                        tenantCode,
                        resolveLoginCode(user)
                )
        );
        resultMap.put("user", user);
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    @PostMapping("/approvals/{approvalId}/attachments/{attachmentId}/presign-download")
    public ResultVO presignDownload(
            @PathVariable Long approvalId,
            @PathVariable Long attachmentId,
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            @Parameter(hidden = true) @AuthenticationPrincipal LoginVO user,
            HttpServletRequest request) throws Exception {
        String tenantCode = resolveTenantCode(tenantHeader, request);
        Map<String, Object> resultMap = haccpWorkAttachmentService.presignDownload(
                approvalId,
                attachmentId,
                tenantCode,
                resolveLoginCode(user),
                resolveClientIp(request),
                resolveUserAgent(request)
        );
        resultMap.put("user", user);
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    @PostMapping("/approvals/{approvalId}/attachments/{attachmentId}/presign-preview")
    public ResultVO presignPreview(
            @PathVariable Long approvalId,
            @PathVariable Long attachmentId,
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            @Parameter(hidden = true) @AuthenticationPrincipal LoginVO user,
            HttpServletRequest request) throws Exception {
        String tenantCode = resolveTenantCode(tenantHeader, request);
        Map<String, Object> resultMap = haccpWorkAttachmentService.presignPreview(
                approvalId,
                attachmentId,
                tenantCode,
                resolveLoginCode(user),
                resolveClientIp(request),
                resolveUserAgent(request)
        );
        resultMap.put("user", user);
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    @DeleteMapping("/approvals/{approvalId}/attachments/{attachmentId}")
    public ResultVO deleteAttachment(
            @PathVariable Long approvalId,
            @PathVariable Long attachmentId,
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            @Parameter(hidden = true) @AuthenticationPrincipal LoginVO user,
            HttpServletRequest request) throws Exception {
        String tenantCode = resolveTenantCode(tenantHeader, request);
        haccpWorkAttachmentService.deleteAttachment(
                approvalId,
                attachmentId,
                tenantCode,
                resolveLoginCode(user)
        );

        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("message", "첨부파일이 삭제되었습니다.");
        resultMap.put("user", user);
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    @Operation(
            summary = "기안 템플릿 조회",
            description = "작성 페이지 진입 시 템플릿 ID 또는 결재문서 ID로 기안 템플릿을 조회한다",
            security = {@SecurityRequirement(name = "Authorization")},
            tags = {"HaccpWorkApiController"}
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
            summary = "결재 댓글 이력 조회",
            description = "결재 문서의 시스템/사용자 댓글 이력을 최신순으로 조회한다",
            security = {@SecurityRequirement(name = "Authorization")},
            tags = {"HaccpWorkApiController"}
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "403", description = "인가된 사용자가 아님"),
            @ApiResponse(responseCode = "404", description = "결재 문서를 찾을 수 없음")
    })
    @GetMapping("/approvals/{approvalId}/comments")
    public ResultVO listApprovalComments(
            @PathVariable Long approvalId,
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            @Parameter(hidden = true) @AuthenticationPrincipal LoginVO user,
            HttpServletRequest request) throws Exception {
        String tenantCode = resolveTenantCode(tenantHeader, request);
        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put(
                "resultList",
                haccpWorkFlowService.listApprovalComments(
                        approvalId,
                        tenantCode,
                        resolveLoginCode(user)
                )
        );
        resultMap.put("user", user);
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    @Operation(
            summary = "결재 댓글 등록",
            description = "결재 문서에 사용자 댓글을 등록한다",
            security = {@SecurityRequirement(name = "Authorization")},
            tags = {"HaccpWorkApiController"}
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "등록 성공"),
            @ApiResponse(responseCode = "403", description = "인가된 사용자가 아님"),
            @ApiResponse(responseCode = "404", description = "결재 문서를 찾을 수 없음")
    })
    @PostMapping("/approvals/{approvalId}/comments")
    public ResultVO createApprovalComment(
            @PathVariable Long approvalId,
            @RequestBody HaccpWorkApprovalCommentCreateRequestVO payload,
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            @Parameter(hidden = true) @AuthenticationPrincipal LoginVO user,
            HttpServletRequest request) throws Exception {
        String tenantCode = resolveTenantCode(tenantHeader, request);
        haccpWorkFlowService.createApprovalComment(
                approvalId,
                tenantCode,
                payload,
                resolveLoginCode(user)
        );

        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("message", "댓글이 등록되었습니다.");
        resultMap.put("user", user);
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

        @PatchMapping("/approvals/{approvalId}/comments/{commentId}")
        public ResultVO updateApprovalComment(
                        @PathVariable Long approvalId,
                        @PathVariable Long commentId,
                        @RequestBody HaccpWorkApprovalCommentUpdateRequestVO payload,
                        @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
                        @Parameter(hidden = true) @AuthenticationPrincipal LoginVO user,
                        HttpServletRequest request) throws Exception {
                String tenantCode = resolveTenantCode(tenantHeader, request);
                haccpWorkFlowService.updateApprovalComment(
                                approvalId,
                                commentId,
                                tenantCode,
                                payload,
                                resolveLoginCode(user)
                );

                Map<String, Object> resultMap = new HashMap<String, Object>();
                resultMap.put("message", "댓글이 수정되었습니다.");
                resultMap.put("user", user);
                return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
        }

        @DeleteMapping("/approvals/{approvalId}/comments/{commentId}")
        public ResultVO deleteApprovalComment(
                        @PathVariable Long approvalId,
                        @PathVariable Long commentId,
                        @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
                        @Parameter(hidden = true) @AuthenticationPrincipal LoginVO user,
                        HttpServletRequest request) throws Exception {
                String tenantCode = resolveTenantCode(tenantHeader, request);
                haccpWorkFlowService.deleteApprovalComment(
                                approvalId,
                                commentId,
                                tenantCode,
                                resolveLoginCode(user)
                );

                Map<String, Object> resultMap = new HashMap<String, Object>();
                resultMap.put("message", "댓글이 삭제되었습니다.");
                resultMap.put("user", user);
                return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
        }

    @Operation(
            summary = "HACCP 문서 목록 조회",
            description = "HACCP 문서관리 페이지의 문서 목록을 조회한다",
            security = {@SecurityRequirement(name = "Authorization")},
            tags = {"HaccpWorkApiController"}
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "403", description = "인가된 사용자가 아님")
    })
    @GetMapping("/documents")
    public ResultVO listDocuments(
            @RequestParam(defaultValue = "1") int pageIndex,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) String workType,
            @RequestParam(required = false) String workDivisionId,
            @RequestParam(required = false) String workDivision,
            @RequestParam(required = false) String draftNumber,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String writer,
            @RequestParam(required = false) String participantType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestHeader(value = "x-tenant-code", required = false) String tenantHeader,
            @Parameter(hidden = true) @AuthenticationPrincipal LoginVO user,
            HttpServletRequest request
    ) throws Exception {
        String tenantCode = resolveTenantCode(tenantHeader, request);
        String actorLoginCode = resolveLoginCode(user);
        String actorRoleCode = resolveRoleCode(user);

        Map<String, Object> resultMap = haccpWorkDraftService.listDocumentsPaged(
                tenantCode,
                actorLoginCode,
                actorRoleCode,
                workType,
                workDivisionId,
                workDivision,
                draftNumber,
                title,
                writer,
                participantType,
                status,
                startDate,
                endDate,
                pageIndex,
                pageSize
        );
        resultMap.put("user", user);
        return resultVoHelper.buildFromMap(resultMap, ResponseCode.SUCCESS);
    }

    @Operation(
            summary = "기안 임시저장",
            description = "작성 중인 기안 내용을 업무 템플릿에 임시 저장한다",
            security = {@SecurityRequirement(name = "Authorization")},
            tags = {"HaccpWorkApiController"}
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
            security = {@SecurityRequirement(name = "Authorization")},
            tags = {"HaccpWorkApiController"}
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
            security = {@SecurityRequirement(name = "Authorization")},
            tags = {"HaccpWorkApiController"}
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

                try {
                        Object userDetails = EgovUserDetailsHelper.getAuthenticatedUser();
                        if (userDetails instanceof LoginVO) {
                                LoginVO loginVO = (LoginVO) userDetails;
                                if (StringUtils.hasText(loginVO.getTenantCode())) {
                                        return loginVO.getTenantCode().trim().toUpperCase();
                                }
            }
                } catch (RuntimeException ignored) {
                        // 테스트/비인증 시점에서는 helper가 null authentication으로 예외를 낼 수 있다.
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

                try {
                        Object userDetails = EgovUserDetailsHelper.getAuthenticatedUser();
                        if (userDetails instanceof LoginVO) {
                                LoginVO loginVO = (LoginVO) userDetails;
                                if (StringUtils.hasText(loginVO.getId())) {
                                        return loginVO.getId().trim();
                                }
            }
                } catch (RuntimeException ignored) {
                        // noop
        }
        return null;
    }

    private String resolveRoleCode(LoginVO user) {
        if (user != null && StringUtils.hasText(user.getRoleCode())) {
            return user.getRoleCode().trim().toUpperCase();
        }

                try {
                        Object userDetails = EgovUserDetailsHelper.getAuthenticatedUser();
                        if (userDetails instanceof LoginVO) {
                                LoginVO loginVO = (LoginVO) userDetails;
                                if (StringUtils.hasText(loginVO.getRoleCode())) {
                                        return loginVO.getRoleCode().trim().toUpperCase();
                                }
            }
                } catch (RuntimeException ignored) {
                        // noop
        }
        return "";
    }

        private String resolveClientIp(HttpServletRequest request) {
                if (request == null) {
                        return null;
                }

                String forwardedFor = request.getHeader("X-Forwarded-For");
                if (StringUtils.hasText(forwardedFor)) {
                        String[] parts = forwardedFor.split(",");
                        if (parts.length > 0 && StringUtils.hasText(parts[0])) {
                                return parts[0].trim();
                        }
                }
                return request.getRemoteAddr();
        }

        private String resolveUserAgent(HttpServletRequest request) {
                if (request == null) {
                        return null;
                }
                return request.getHeader("User-Agent");
        }
}
