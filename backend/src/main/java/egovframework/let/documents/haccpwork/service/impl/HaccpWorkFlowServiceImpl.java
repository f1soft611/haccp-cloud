package egovframework.let.documents.haccpwork.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import javax.annotation.Resource;

import org.egovframe.rte.fdl.idgnr.EgovIdGnrService;
import org.egovframe.rte.fdl.cmmn.EgovAbstractServiceImpl;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import egovframework.let.documents.haccpwork.domain.model.HaccpWorkApprovalStatusUpdateRequestVO;
import egovframework.let.documents.haccpwork.domain.model.HaccpWorkApprovalCommentCreateRequestVO;
import egovframework.let.documents.haccpwork.domain.model.HaccpWorkApprovalCommentUpdateRequestVO;
import egovframework.let.documents.haccpwork.domain.model.HaccpWorkDraftSubmitRequestVO;
import egovframework.let.documents.haccpwork.domain.model.HaccpWorkDraftTempSaveRequestVO;
import egovframework.let.documents.haccpwork.domain.model.HaccpWorkVO;
import egovframework.let.documents.haccpwork.domain.repository.HaccpWorkDAO;
import egovframework.let.documents.haccpwork.service.HaccpWorkDraftService;
import egovframework.let.documents.haccpwork.service.HaccpWorkFlowService;
import lombok.RequiredArgsConstructor;

/**
 * HACCP 업무 작성~결재 흐름을 위한 서비스 구현 클래스
 */
@Service("haccpWorkFlowService")
@RequiredArgsConstructor
public class HaccpWorkFlowServiceImpl extends EgovAbstractServiceImpl implements HaccpWorkFlowService {

    private static final int DRAFTER_SEQ = 1;
    private static final int REVIEWER_SEQ = 2;
    private static final int APPROVER_SEQ = 3;
    private static final int FINAL_OWNER_SEQ = 4;

    private static final String DEFAULT_EABUS_NO = "001";
    private static final String DEFAULT_PLANT_CODE = "001";
    private static final String DEFAULT_LEVEL_NAME = "담당";
    private static final String DEFAULT_CATA_TYPE_CODE = "000000";
    private static final String DEFAULT_WEIGHT_TYPE_CODE = "normal";
    private static final String DEFAULT_WEIGHT_STATUS = "normal";
    private static final String HISTORY_TYPE_SYSTEM = "SYSTEM";
    private static final String HISTORY_TYPE_USER = "USER";
    private static final String HISTORY_TYPE_DELETED = "DELETED";
    private static final String DELETED_COMMENT_TEXT = "사용자에 의해 삭제 되었습니다.";
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HHmm");

    private final HaccpWorkDraftService haccpWorkDraftService;
    private final HaccpWorkDAO haccpWorkDAO;

    @Resource(name = "egovElectronicApprovalExeIdGnrService")
    private EgovIdGnrService electronicApprovalExeIdGnrService;

    @Override
    @Transactional
    public HaccpWorkVO saveTempDraft(
            Long workId,
            String tenantCode,
            HaccpWorkDraftTempSaveRequestVO payload,
            String actorLoginCode
    ) throws Exception {
        String normalizedTenantCode = normalizeTenantCode(tenantCode);
        Long tenantId = resolveTenantId(normalizedTenantCode);
        Long actorLoginId = resolveActorLoginId(tenantId, actorLoginCode);
        if (actorLoginId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "임시저장 사용자 정보를 확인할 수 없습니다.");
        }

        ensureSubmissionEditableState(tenantId, workId, actorLoginId, "임시저장");

        HaccpWorkVO work = haccpWorkDraftService.getDraftTemplate(normalizedTenantCode, workId, "work", actorLoginCode);

        LocalDateTime now = LocalDateTime.now();
        String regDate = now.format(DATE_FORMATTER);
        String twfTime = now.format(TIME_FORMATTER);
        String title = StringUtils.hasText(payload.getTitle())
                ? payload.getTitle().trim()
                : "임시저장 " + regDate;
        String templateJson = StringUtils.hasText(payload.getTemplateJson()) ? payload.getTemplateJson().trim() : "";
        String templateHtml = StringUtils.hasText(payload.getTemplateHtml()) ? payload.getTemplateHtml().trim() : "";
        String eaExeId;
        Long targetApprovalId;
        Map<String, Object> actorProfile = selectApprovalActorProfile(tenantId, actorLoginId);

        Long preApplyApprovalId = findLatestPreApplyApprovalId(tenantId, workId, actorLoginId);
        if (preApplyApprovalId == null) {
            eaExeId = buildEaExeId(now.toLocalDate());
            Map<String, Object> mainParams = new HashMap<String, Object>();
            mainParams.put("tenantId", tenantId);
            mainParams.put("workId", workId);
            mainParams.put("plantCode", DEFAULT_PLANT_CODE);
            mainParams.put("eabusNo", DEFAULT_EABUS_NO);
            mainParams.put("eaExeId", eaExeId);
            mainParams.put("regDate", regDate);
            mainParams.put("loginId", actorLoginId);
            mainParams.put("statusType", "pre_apply");
            mainParams.put("departmentId", getLong(actorProfile, "departmentId"));
            mainParams.put("levelName", resolveLevelName(actorProfile));
            mainParams.put("title", title);
            mainParams.put("twfTime", twfTime);
            mainParams.put("txtCnt", templateHtml);
            mainParams.put("txtJson", templateJson);
            mainParams.put("afterCnt", templateHtml);
            mainParams.put("afterTxtJson", templateJson);
            mainParams.put("afterTwfTime", twfTime);
            mainParams.put("cataTypeCode", normalizeCode(work.getDivisionCode(), DEFAULT_CATA_TYPE_CODE, 6));
            mainParams.put("endStatus", "pre_apply");
            mainParams.put("statusTypeName", "미완료");
            mainParams.put("reportDate", regDate);
            mainParams.put("settlePlanDate", regDate);
            mainParams.put("weightTypeCode", DEFAULT_WEIGHT_TYPE_CODE);
            mainParams.put("weightStatus", DEFAULT_WEIGHT_STATUS);
            mainParams.put("twfDate", regDate);
            mainParams.put("afterTwfDate", regDate);
            mainParams.put("deleteStatus", "N");
            mainParams.put("createdBy", actorLoginId);
            mainParams.put("updatedBy", actorLoginId);

            haccpWorkDAO.insertElectronicApprovalMain(mainParams);
            targetApprovalId = getLong(mainParams, "electronicApprovalId");
        } else {
            targetApprovalId = preApplyApprovalId;
            Map<String, Object> updateParams = new HashMap<String, Object>();
            updateParams.put("tenantId", tenantId);
            updateParams.put("approvalId", preApplyApprovalId);
            updateParams.put("title", title);
            updateParams.put("txtCnt", templateHtml);
            updateParams.put("txtJson", templateJson);
            updateParams.put("afterCnt", templateHtml);
            updateParams.put("afterTxtJson", templateJson);
            updateParams.put("statusType", "pre_apply");
            updateParams.put("statusTypeName", "미완료");
            updateParams.put("endStatus", "pre_apply");
            updateParams.put("updatedBy", actorLoginId);
            updateParams.put("updatedAt", now);
            haccpWorkDAO.updateElectronicApprovalMainDraftContent(updateParams);

            Map<String, Object> approvalMain = new HashMap<String, Object>();
            approvalMain.put("tenantId", tenantId);
            approvalMain.put("approvalId", preApplyApprovalId);
            Map<String, Object> existingMain = haccpWorkDAO.selectApprovalMainById(approvalMain);
            eaExeId = trimToEmpty(String.valueOf(existingMain == null ? "" : existingMain.get("eaExeId")));
            if (!StringUtils.hasText(eaExeId)) {
                eaExeId = buildEaExeId(now.toLocalDate());
            }
        }

        if (targetApprovalId == null) {
            throw new IllegalStateException("임시저장 결재 문서 키를 확인할 수 없습니다.");
        }

        if (!StringUtils.hasText(work.getReviewerId() == null ? "" : String.valueOf(work.getReviewerId()))
            || !StringUtils.hasText(work.getApproverId() == null ? "" : String.valueOf(work.getApproverId()))) {
            return haccpWorkDraftService.getDraftTemplate(normalizedTenantCode, workId, "work", actorLoginCode);
        }

        List<Long> referenceLoginIds = resolveReferenceLoginIds(
            tenantId,
            payload == null ? null : payload.getReferenceIds(),
            actorLoginId,
            work.getReviewerId(),
            work.getApproverId()
        );
        Map<String, Object> reviewerProfile = selectApprovalActorProfile(tenantId, work.getReviewerId());
        Map<String, Object> approverProfile = selectApprovalActorProfile(tenantId, work.getApproverId());
        rebuildPreApplyApprovalLines(
            tenantId,
            targetApprovalId,
            actorLoginId,
            work.getReviewerId(),
            work.getApproverId(),
            actorProfile,
            reviewerProfile,
            approverProfile,
            referenceLoginIds,
            now,
            eaExeId
        );

        return haccpWorkDraftService.getDraftTemplate(normalizedTenantCode, workId, "work", actorLoginCode);
    }

    @Override
    @Transactional
    public Long submitDraft(
            Long workId,
            String tenantCode,
            HaccpWorkDraftSubmitRequestVO payload,
            String actorLoginCode
    ) throws Exception {
        String normalizedTitle = payload == null ? "" : trimToEmpty(payload.getTitle());
        if (!StringUtils.hasText(normalizedTitle)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "기안 제목은 필수입니다.");
        }

        String normalizedTenantCode = normalizeTenantCode(tenantCode);
        Long tenantId = resolveTenantId(normalizedTenantCode);
        Long actorLoginId = resolveActorLoginId(tenantId, actorLoginCode);
        if (actorLoginId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "결재신청 사용자 정보를 확인할 수 없습니다.");
        }

        ensureSubmissionEditableState(tenantId, workId, actorLoginId, "결재신청");

        HaccpWorkVO work = haccpWorkDraftService.getDraftTemplate(normalizedTenantCode, workId, "work", actorLoginCode);
        if (work.getReviewerId() == null || work.getApproverId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "검토자/승인자 지정 후 결재신청할 수 있습니다.");
        }

        String templateJson = StringUtils.hasText(payload.getTemplateJson())
                ? payload.getTemplateJson().trim()
                : trimToEmpty(work.getTemplateJson());
        String templateHtml = StringUtils.hasText(payload.getTemplateHtml())
                ? payload.getTemplateHtml().trim()
                : trimToEmpty(work.getTemplateHtml());

        LocalDateTime now = LocalDateTime.now();
        String regDate = now.format(DATE_FORMATTER);
        String twfTime = now.format(TIME_FORMATTER);
        String eaExeId = buildEaExeId(now.toLocalDate());

        Map<String, Object> actorProfile = selectApprovalActorProfile(tenantId, actorLoginId);
        Map<String, Object> reviewerProfile = selectApprovalActorProfile(tenantId, work.getReviewerId());
        Map<String, Object> approverProfile = selectApprovalActorProfile(tenantId, work.getApproverId());

        Long preApplyApprovalId = findLatestPreApplyApprovalId(tenantId, workId, actorLoginId);
        Long electronicApprovalId;
        if (preApplyApprovalId == null) {
            Map<String, Object> mainParams = new HashMap<String, Object>();
            mainParams.put("tenantId", tenantId);
            mainParams.put("workId", workId);
            mainParams.put("plantCode", DEFAULT_PLANT_CODE);
            mainParams.put("eabusNo", DEFAULT_EABUS_NO);
            mainParams.put("eaExeId", eaExeId);
            mainParams.put("regDate", regDate);
            mainParams.put("loginId", actorLoginId);
            mainParams.put("statusType", "in_progress");
            mainParams.put("departmentId", getLong(actorProfile, "departmentId"));
            mainParams.put("levelName", resolveLevelName(actorProfile));
            mainParams.put("title", normalizedTitle);
            mainParams.put("twfTime", twfTime);
            mainParams.put("txtCnt", templateHtml);
            mainParams.put("txtJson", templateJson);
            mainParams.put("afterCnt", templateHtml);
            mainParams.put("afterTxtJson", templateJson);
            mainParams.put("afterTwfTime", twfTime);
            mainParams.put("cataTypeCode", normalizeCode(work.getDivisionCode(), DEFAULT_CATA_TYPE_CODE, 6));
            mainParams.put("endStatus", "in_progress");
            mainParams.put("statusTypeName", "진행중");
            mainParams.put("reportDate", regDate);
            mainParams.put("settlePlanDate", regDate);
            mainParams.put("weightTypeCode", DEFAULT_WEIGHT_TYPE_CODE);
            mainParams.put("weightStatus", DEFAULT_WEIGHT_STATUS);
            mainParams.put("twfDate", regDate);
            mainParams.put("afterTwfDate", regDate);
            mainParams.put("deleteStatus", "N");
            mainParams.put("createdBy", actorLoginId);
            mainParams.put("updatedBy", actorLoginId);

            haccpWorkDAO.insertElectronicApprovalMain(mainParams);
            electronicApprovalId = getLong(mainParams, "electronicApprovalId");
        } else {
            electronicApprovalId = preApplyApprovalId;
            Map<String, Object> updateParams = new HashMap<String, Object>();
            updateParams.put("tenantId", tenantId);
            updateParams.put("approvalId", preApplyApprovalId);
            updateParams.put("title", normalizedTitle);
            updateParams.put("txtCnt", templateHtml);
            updateParams.put("txtJson", templateJson);
            updateParams.put("afterCnt", templateHtml);
            updateParams.put("afterTxtJson", templateJson);
            updateParams.put("regDate", regDate);
            updateParams.put("twfDate", regDate);
            updateParams.put("afterTwfDate", regDate);
            updateParams.put("statusType", "in_progress");
            updateParams.put("statusTypeName", "진행중");
            updateParams.put("endStatus", "in_progress");
            updateParams.put("updatedBy", actorLoginId);
            updateParams.put("updatedAt", now);
            haccpWorkDAO.updateElectronicApprovalMainDraftContent(updateParams);

            Map<String, Object> approvalMainParams = new HashMap<String, Object>();
            approvalMainParams.put("tenantId", tenantId);
            approvalMainParams.put("approvalId", preApplyApprovalId);
            Map<String, Object> existingMain = haccpWorkDAO.selectApprovalMainById(approvalMainParams);
            String existingEaExeId = trimToEmpty(String.valueOf(existingMain == null ? "" : existingMain.get("eaExeId")));
            if (StringUtils.hasText(existingEaExeId)) {
                eaExeId = existingEaExeId;
            } else {
                Map<String, Object> keyUpdateParams = new HashMap<String, Object>();
                keyUpdateParams.put("tenantId", tenantId);
                keyUpdateParams.put("approvalId", preApplyApprovalId);
                keyUpdateParams.put("eabusNo", DEFAULT_EABUS_NO);
                keyUpdateParams.put("eaExeId", eaExeId);
                keyUpdateParams.put("updatedBy", actorLoginId);
                keyUpdateParams.put("updatedAt", now);
                haccpWorkDAO.updateElectronicApprovalMainBusinessKey(keyUpdateParams);
            }
        }
        if (electronicApprovalId == null) {
            throw new IllegalStateException("결재 메인 저장 후 키를 확인할 수 없습니다.");
        }

        Long submitHistoryLineId = insertApprovalLine(
                tenantId,
                electronicApprovalId,
                1,
                actorLoginId,
                actorProfile,
                "기안",
                "drafted",
                "approved",
                "N",
                "N",
            now,
            now,
            now,
                eaExeId
        );
        insertApprovalLine(
                tenantId,
                electronicApprovalId,
                2,
                work.getReviewerId(),
                reviewerProfile,
                "검토",
                "drafted",
            "",
                "N",
                "N",
                now,
                null,
                null,
                eaExeId
        );
        insertApprovalLine(
                tenantId,
                electronicApprovalId,
                3,
                work.getApproverId(),
                approverProfile,
                "승인",
                "drafted",
                "",
                "N",
                "Y",
                null,
                null,
                null,
                eaExeId
        );

        List<Long> referenceLoginIds = resolveReferenceLoginIds(
            tenantId,
            payload == null ? null : payload.getReferenceIds(),
            actorLoginId,
            work.getReviewerId(),
            work.getApproverId()
        );
        int sequence = 4;
        for (Long referenceLoginId : referenceLoginIds) {
            Map<String, Object> referenceProfile = selectApprovalActorProfile(tenantId, referenceLoginId);
            insertApprovalLine(
                    tenantId,
                    electronicApprovalId,
                    sequence,
                    referenceLoginId,
                    referenceProfile,
                    "참조",
                    "cooperated",
                    "",
                    "N",
                    "N",
                        now,
                        null,
                        null,
                    eaExeId
            );
            sequence++;
        }

                insertApprovalLine(
                    tenantId,
                    electronicApprovalId,
                    sequence,
                    actorLoginId,
                    actorProfile,
                    "참조",
                    "cooperated",
                    "",
                    "Y",
                    "N",
                    null,
                    null,
                    null,
                    eaExeId
                );

            Map<String, Object> clearReferenceParams = new HashMap<String, Object>();
            clearReferenceParams.put("tenantId", tenantId);
            clearReferenceParams.put("approvalId", electronicApprovalId);
            clearReferenceParams.put("keepUntilExeSeq", sequence);
            haccpWorkDAO.clearUnusedReferenceApprovalLines(clearReferenceParams);

        String submitActorName = resolveActorDisplayName(actorProfile, actorLoginCode);
            appendSystemHistoryCommentByLineId(
            tenantId,
                submitHistoryLineId,
                1,
            actorLoginId,
            now,
                buildSystemCommentMessage(submitActorName, "submit", false, null),
                eaExeId
        );

        processApprovalChain(tenantId, electronicApprovalId, actorLoginId, submitActorName, now, "submit");

        return electronicApprovalId;
    }

    @Override
    @Transactional
    public HaccpWorkVO updateApprovalStatus(
            Long approvalId,
            String tenantCode,
            HaccpWorkApprovalStatusUpdateRequestVO payload,
            String actorLoginCode
    ) throws Exception {
        if (approvalId == null || approvalId.longValue() <= 0L) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "결재 ID가 올바르지 않습니다.");
        }

        String eventType = payload == null ? "" : trimToEmpty(payload.getEventType()).toLowerCase();
        if (!StringUtils.hasText(eventType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "결재 이벤트 타입은 필수입니다.");
        }

        String normalizedTenantCode = normalizeTenantCode(tenantCode);
        Long tenantId = resolveTenantId(normalizedTenantCode);
        Long actorLoginId = resolveActorLoginId(tenantId, actorLoginCode);
        if (actorLoginId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "결재 처리 사용자 정보를 확인할 수 없습니다.");
        }
        Map<String, Object> actorProfile = selectApprovalActorProfile(tenantId, actorLoginId);
        String actorName = resolveActorDisplayName(actorProfile, actorLoginCode);

        Map<String, Object> keyParams = new HashMap<String, Object>();
        keyParams.put("tenantId", tenantId);
        keyParams.put("approvalId", approvalId);
        Map<String, Object> approvalMain = haccpWorkDAO.selectApprovalMainById(keyParams);
        if (approvalMain == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "결재 문서를 찾을 수 없습니다.");
        }

        int targetSeq;
        String lineStatus;
        String lineOption;
        String mainStatus;
        String mainStatusName;
        String endStatus;
        boolean isReferenceEvent = false;
        boolean isFinalOwnerReference = false;
        boolean shouldUpdateMain = true;
        boolean clearDownstreamLines = false;
        boolean clearFinalOwnerLine = false;

        switch (eventType) {
            case "review_approve":
                targetSeq = REVIEWER_SEQ;
                lineStatus = "approved";
                lineOption = "검토승인";
                mainStatus = "in_progress";
                mainStatusName = "진행중";
                endStatus = "in_progress";
                break;
            case "review_return":
                targetSeq = REVIEWER_SEQ;
                lineStatus = "returned";
                lineOption = "반송";
                mainStatus = "rejected";
                mainStatusName = "반송";
                endStatus = "rejected";
                clearDownstreamLines = true;
                break;
            case "final_approve":
                targetSeq = APPROVER_SEQ;
                lineStatus = "approved";
                lineOption = "최종승인";
                mainStatus = "approved";
                mainStatusName = "완료";
                endStatus = "approved";
                break;
            case "final_return":
                targetSeq = APPROVER_SEQ;
                lineStatus = "returned";
                lineOption = "반송";
                mainStatus = "rejected";
                mainStatusName = "반송";
                endStatus = "rejected";
                clearFinalOwnerLine = true;
                break;
            case "submit_cancel":
                targetSeq = -1;
                lineStatus = "cancelled";
                lineOption = "상신취소";
                mainStatus = "";
                mainStatusName = "";
                endStatus = "";
                break;
            case "reference_confirm":
                targetSeq = 0;
                lineStatus = "confirmed";
                lineOption = "참조확인";
                mainStatus = "";
                mainStatusName = "";
                endStatus = "";
                isReferenceEvent = true;
                shouldUpdateMain = false;
                break;
            default:
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "지원하지 않는 결재 이벤트입니다: " + eventType);
        }

        Long expectedActorLoginId;
        if ("submit_cancel".equals(eventType)) {
            targetSeq = resolveCancelableTargetSeq(tenantId, approvalId, actorLoginId);
            expectedActorLoginId = actorLoginId;
            if (targetSeq == 1) {
                mainStatus = "pre_apply";
                mainStatusName = "미완료";
                endStatus = "pre_apply";
            } else {
                mainStatus = "in_progress";
                mainStatusName = "진행중";
                endStatus = "in_progress";
            }
        } else if (isReferenceEvent) {
            Map<String, Object> referenceOwnerParams = new HashMap<String, Object>();
            referenceOwnerParams.put("tenantId", tenantId);
            referenceOwnerParams.put("approvalId", approvalId);
            referenceOwnerParams.put("loginId", actorLoginId);
            expectedActorLoginId = haccpWorkDAO.selectApprovalReferenceLoginId(referenceOwnerParams);
            Map<String, Object> referenceLineInfo = haccpWorkDAO.selectApprovalReferenceLineForHistoryByLogin(referenceOwnerParams);
            isFinalOwnerReference = "Y".equalsIgnoreCase(resolveMapValueIgnoreCase(referenceLineInfo, "lastOwnerStatus"));
            if (isFinalOwnerReference) {
                lineOption = "최종확인";
            }
        } else {
            Map<String, Object> lineOwnerParams = new HashMap<String, Object>();
            lineOwnerParams.put("tenantId", tenantId);
            lineOwnerParams.put("approvalId", approvalId);
            lineOwnerParams.put("exeSeq", targetSeq);
            expectedActorLoginId = haccpWorkDAO.selectApprovalLineLoginId(lineOwnerParams);
        }
        if (expectedActorLoginId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "결재선 정보를 확인할 수 없습니다.");
        }
        if (!expectedActorLoginId.equals(actorLoginId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "해당 결재선의 처리 권한이 없습니다.");
        }

        LocalDateTime now = LocalDateTime.now();
        boolean isApprovalEvent = "review_approve".equals(eventType) || "final_approve".equals(eventType);

        int updatedLineCount;
        if (isReferenceEvent) {
            Map<String, Object> referenceUpdateParams = new HashMap<String, Object>();
            referenceUpdateParams.put("tenantId", tenantId);
            referenceUpdateParams.put("approvalId", approvalId);
            referenceUpdateParams.put("loginId", actorLoginId);
            referenceUpdateParams.put("appStatus", lineStatus);
            referenceUpdateParams.put("optionName", lineOption);
            referenceUpdateParams.put("updatedAt", now);
            updatedLineCount = haccpWorkDAO.updateElectronicApprovalReferenceLineStatus(referenceUpdateParams);
        } else if (isApprovalEvent) {
            updatedLineCount = 1;
        } else {
            Map<String, Object> lineUpdateParams = new HashMap<String, Object>();
            lineUpdateParams.put("tenantId", tenantId);
            lineUpdateParams.put("approvalId", approvalId);
            lineUpdateParams.put("exeSeq", targetSeq);
            lineUpdateParams.put("appStatus", lineStatus);
            lineUpdateParams.put("optionName", lineOption);
            lineUpdateParams.put("updatedAt", now);
            updatedLineCount = haccpWorkDAO.updateElectronicApprovalLineStatus(lineUpdateParams);
        }
        if (updatedLineCount <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "결재선 상태를 갱신하지 못했습니다.");
        }

        if (shouldUpdateMain && !isApprovalEvent) {
            Map<String, Object> mainUpdateParams = new HashMap<String, Object>();
            mainUpdateParams.put("tenantId", tenantId);
            mainUpdateParams.put("approvalId", approvalId);
            mainUpdateParams.put("statusType", mainStatus);
            mainUpdateParams.put("statusTypeName", mainStatusName);
            mainUpdateParams.put("endStatus", endStatus);
            mainUpdateParams.put("updatedBy", actorLoginId);
            mainUpdateParams.put("updatedAt", now);
            haccpWorkDAO.updateElectronicApprovalMainStatus(mainUpdateParams);

            if ("submit_cancel".equals(eventType)) {
                if (targetSeq == DRAFTER_SEQ) {
                    resetDraftedLineToPending(tenantId, approvalId, REVIEWER_SEQ);
                    resetDraftedLineToPending(tenantId, approvalId, APPROVER_SEQ);
                } else if (targetSeq == REVIEWER_SEQ) {
                    reopenDraftedLineTurn(tenantId, approvalId, REVIEWER_SEQ, now, "승인요청");
                    resetDraftedLineToPending(tenantId, approvalId, APPROVER_SEQ);
                    markFinalOwnerArrival(tenantId, approvalId, now, "최종기안알림");
                } else if (targetSeq == APPROVER_SEQ) {
                    reopenDraftedLineTurn(tenantId, approvalId, APPROVER_SEQ, now, "승인요청");
                    markFinalOwnerArrival(tenantId, approvalId, now, "최종기안알림");
                }
            }
        }

        if (clearDownstreamLines) {
            resetDraftedLineToPending(tenantId, approvalId, APPROVER_SEQ);
            markFinalOwnerArrival(tenantId, approvalId, now, "최종기안알림");
        }

        if (clearFinalOwnerLine) {
            markFinalOwnerArrival(tenantId, approvalId, now, "최종기안알림");
        }

        if ("review_approve".equals(eventType) || "final_approve".equals(eventType)) {
            processApprovalChain(tenantId, approvalId, actorLoginId, actorName, now, eventType);
            return haccpWorkDraftService.getDraftTemplate(normalizedTenantCode, approvalId, "approval", actorLoginCode);
        }

        if (isReferenceEvent) {
            appendSystemHistoryCommentByReference(
                tenantId,
                approvalId,
                actorLoginId,
                now,
                buildSystemCommentMessage(actorName, eventType, isFinalOwnerReference, targetSeq)
            );
        } else {
            appendSystemHistoryCommentBySeq(
                tenantId,
                approvalId,
                targetSeq,
                actorLoginId,
                now,
                buildSystemCommentMessage(actorName, eventType, false, targetSeq)
            );
        }

        return haccpWorkDraftService.getDraftTemplate(normalizedTenantCode, approvalId, "approval", actorLoginCode);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> listApprovalComments(
            Long approvalId,
            String tenantCode,
            String actorLoginCode
    ) throws Exception {
        if (approvalId == null || approvalId.longValue() <= 0L) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "결재 ID가 올바르지 않습니다.");
        }

        String normalizedTenantCode = normalizeTenantCode(tenantCode);
        Long tenantId = resolveTenantId(normalizedTenantCode);
        Long actorLoginId = resolveActorLoginId(tenantId, actorLoginCode);
        if (actorLoginId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "결재 조회 사용자 정보를 확인할 수 없습니다.");
        }

        Map<String, Object> accessParams = new HashMap<String, Object>();
        accessParams.put("tenantId", tenantId);
        accessParams.put("approvalId", approvalId);
        accessParams.put("actorLoginId", actorLoginId);
        Integer hasAccess = haccpWorkDAO.selectApprovalTemplateAccessCount(accessParams);
        if (hasAccess == null || hasAccess.intValue() <= 0) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "해당 결재 문서 조회 권한이 없습니다.");
        }

        Map<String, Object> params = new HashMap<String, Object>();
        params.put("tenantId", tenantId);
        params.put("approvalId", approvalId);
        params.put("actorLoginId", actorLoginId);
        return haccpWorkDAO.selectApprovalHistoryCommentsByApprovalId(params);
    }

    @Override
    @Transactional
    public void createApprovalComment(
            Long approvalId,
            String tenantCode,
            HaccpWorkApprovalCommentCreateRequestVO payload,
            String actorLoginCode
    ) throws Exception {
        if (approvalId == null || approvalId.longValue() <= 0L) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "결재 ID가 올바르지 않습니다.");
        }

        String comment = payload == null ? "" : trimToEmpty(payload.getComment());
        if (!StringUtils.hasText(comment)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "댓글 내용은 필수입니다.");
        }
        Long parentCommentId = payload == null ? null : payload.getParentCommentId();

        String normalizedTenantCode = normalizeTenantCode(tenantCode);
        Long tenantId = resolveTenantId(normalizedTenantCode);
        Long actorLoginId = resolveActorLoginId(tenantId, actorLoginCode);
        if (actorLoginId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "댓글 등록 사용자 정보를 확인할 수 없습니다.");
        }

        Map<String, Object> accessParams = new HashMap<String, Object>();
        accessParams.put("tenantId", tenantId);
        accessParams.put("approvalId", approvalId);
        accessParams.put("actorLoginId", actorLoginId);
        Integer hasAccess = haccpWorkDAO.selectApprovalTemplateAccessCount(accessParams);
        if (hasAccess == null || hasAccess.intValue() <= 0) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "해당 결재 문서 댓글 등록 권한이 없습니다.");
        }

        Map<String, Object> lineParams = new HashMap<String, Object>();
        lineParams.put("tenantId", tenantId);
        lineParams.put("approvalId", approvalId);
        lineParams.put("loginId", actorLoginId);
        Map<String, Object> lineInfo = resolveHistoryLineInfo(lineParams);
        if (lineInfo == null || lineInfo.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "댓글 저장 대상 결재선 정보를 찾을 수 없습니다.");
        }

        if (parentCommentId != null && parentCommentId.longValue() > 0L) {
            Map<String, Object> parentParams = new HashMap<String, Object>();
            parentParams.put("tenantId", tenantId);
            parentParams.put("approvalId", approvalId);
            parentParams.put("commentId", parentCommentId);
            Map<String, Object> parentComment = haccpWorkDAO.selectApprovalHistoryCommentById(parentParams);
            if (parentComment == null || parentComment.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "대댓글 대상 댓글을 찾을 수 없습니다.");
            }

            String parentAnswerTypeName = resolveMapValueIgnoreCase(parentComment, "answerTypeName");
            if (HISTORY_TYPE_SYSTEM.equalsIgnoreCase(trimToEmpty(parentAnswerTypeName))) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "시스템 댓글에는 답글을 등록할 수 없습니다.");
            }
        } else {
            parentCommentId = null;
        }

        appendHistoryCommentFromLine(
            tenantId,
            lineInfo,
            actorLoginId,
            LocalDateTime.now(),
            comment,
            HISTORY_TYPE_USER,
            parentCommentId
        );
    }

    @Override
    @Transactional
    public void updateApprovalComment(
            Long approvalId,
            Long commentId,
            String tenantCode,
            HaccpWorkApprovalCommentUpdateRequestVO payload,
            String actorLoginCode
    ) throws Exception {
        requireEditableComment(approvalId, commentId, tenantCode, actorLoginCode);

        String comment = payload == null ? "" : trimToEmpty(payload.getComment());
        if (!StringUtils.hasText(comment)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "댓글 내용은 필수입니다.");
        }

        String normalizedTenantCode = normalizeTenantCode(tenantCode);
        Long tenantId = resolveTenantId(normalizedTenantCode);
        Long actorLoginId = resolveActorLoginId(tenantId, actorLoginCode);

        Map<String, Object> params = new HashMap<String, Object>();
        params.put("tenantId", tenantId);
        params.put("commentId", commentId);
        params.put("actorLoginId", actorLoginId);
        params.put("comment", comment);

        int updatedCount = haccpWorkDAO.updateElectronicApprovalHistoryComment(params);
        if (updatedCount <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "댓글을 수정하지 못했습니다.");
        }
    }

    @Override
    @Transactional
    public void deleteApprovalComment(
            Long approvalId,
            Long commentId,
            String tenantCode,
            String actorLoginCode
    ) throws Exception {
        requireEditableComment(approvalId, commentId, tenantCode, actorLoginCode);

        String normalizedTenantCode = normalizeTenantCode(tenantCode);
        Long tenantId = resolveTenantId(normalizedTenantCode);
        Long actorLoginId = resolveActorLoginId(tenantId, actorLoginCode);

        Map<String, Object> params = new HashMap<String, Object>();
        params.put("tenantId", tenantId);
        params.put("commentId", commentId);
        params.put("actorLoginId", actorLoginId);

        int deletedCount = haccpWorkDAO.softDeleteElectronicApprovalHistoryComment(params);
        if (deletedCount <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "댓글을 삭제하지 못했습니다.");
        }
    }

    @Override
    @Transactional
    public void toggleApprovalCommentLike(
            Long approvalId,
            Long commentId,
            String tenantCode,
            String actorLoginCode
    ) throws Exception {
        if (approvalId == null || approvalId.longValue() <= 0L) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "결재 ID가 올바르지 않습니다.");
        }
        if (commentId == null || commentId.longValue() <= 0L) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "댓글 ID가 올바르지 않습니다.");
        }

        String normalizedTenantCode = normalizeTenantCode(tenantCode);
        Long tenantId = resolveTenantId(normalizedTenantCode);
        Long actorLoginId = resolveActorLoginId(tenantId, actorLoginCode);
        if (actorLoginId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "좋아요 처리 사용자 정보를 확인할 수 없습니다.");
        }

        Map<String, Object> accessParams = new HashMap<String, Object>();
        accessParams.put("tenantId", tenantId);
        accessParams.put("approvalId", approvalId);
        accessParams.put("actorLoginId", actorLoginId);
        Integer hasAccess = haccpWorkDAO.selectApprovalTemplateAccessCount(accessParams);
        if (hasAccess == null || hasAccess.intValue() <= 0) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "해당 결재 문서 댓글 좋아요 권한이 없습니다.");
        }

        Map<String, Object> commentParams = new HashMap<String, Object>();
        commentParams.put("tenantId", tenantId);
        commentParams.put("approvalId", approvalId);
        commentParams.put("commentId", commentId);
        Map<String, Object> commentRow = haccpWorkDAO.selectApprovalHistoryCommentById(commentParams);
        if (commentRow == null || commentRow.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "좋아요 대상 댓글을 찾을 수 없습니다.");
        }

        String answerTypeName = trimToEmpty(resolveMapValueIgnoreCase(commentRow, "answerTypeName"));
        if (HISTORY_TYPE_SYSTEM.equalsIgnoreCase(answerTypeName)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "시스템 댓글에는 좋아요를 할 수 없습니다.");
        }
        if (HISTORY_TYPE_DELETED.equalsIgnoreCase(answerTypeName)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "삭제된 댓글에는 좋아요를 할 수 없습니다.");
        }

        Map<String, Object> likeParams = new HashMap<String, Object>();
        likeParams.put("tenantId", tenantId);
        likeParams.put("commentId", commentId);
        likeParams.put("actorLoginId", actorLoginId);

        Integer isLiked = haccpWorkDAO.selectApprovalCommentLikeExists(likeParams);
        if (isLiked != null && isLiked.intValue() > 0) {
            haccpWorkDAO.deleteApprovalCommentLike(likeParams);
            return;
        }

        int inserted = haccpWorkDAO.insertApprovalCommentLike(likeParams);
        if (inserted <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "좋아요를 반영하지 못했습니다.");
        }
    }

    @Override
    @Transactional
    public void createSystemApprovalComment(
            Long approvalId,
            String tenantCode,
            String actionLabel,
            String actionDetail,
            String actorLoginCode
    ) throws Exception {
        if (approvalId == null || approvalId.longValue() <= 0L) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "결재 ID가 올바르지 않습니다.");
        }

        String normalizedActionLabel = trimToEmpty(actionLabel);
        if (!StringUtils.hasText(normalizedActionLabel)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "시스템 댓글 액션은 필수입니다.");
        }

        String normalizedTenantCode = normalizeTenantCode(tenantCode);
        Long tenantId = resolveTenantId(normalizedTenantCode);
        Long actorLoginId = resolveActorLoginId(tenantId, actorLoginCode);
        if (actorLoginId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "댓글 등록 사용자 정보를 확인할 수 없습니다.");
        }

        Map<String, Object> accessParams = new HashMap<String, Object>();
        accessParams.put("tenantId", tenantId);
        accessParams.put("approvalId", approvalId);
        accessParams.put("actorLoginId", actorLoginId);
        Integer hasAccess = haccpWorkDAO.selectApprovalTemplateAccessCount(accessParams);
        if (hasAccess == null || hasAccess.intValue() <= 0) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "해당 결재 문서 댓글 등록 권한이 없습니다.");
        }

        Map<String, Object> lineParams = new HashMap<String, Object>();
        lineParams.put("tenantId", tenantId);
        lineParams.put("approvalId", approvalId);
        lineParams.put("loginId", actorLoginId);
        Map<String, Object> lineInfo = resolveHistoryLineInfo(lineParams);
        if (lineInfo == null || lineInfo.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "댓글 저장 대상 결재선 정보를 찾을 수 없습니다.");
        }

        Map<String, Object> actorProfile = selectApprovalActorProfile(tenantId, actorLoginId);
        String actorName = resolveActorDisplayName(actorProfile, actorLoginCode);
        String normalizedActionDetail = trimToEmpty(actionDetail);

        appendHistoryCommentFromLine(
            tenantId,
            lineInfo,
            actorLoginId,
            LocalDateTime.now(),
            buildSystemActionCommentMessage(actorName, normalizedActionLabel, normalizedActionDetail),
            HISTORY_TYPE_SYSTEM,
            null
        );
    }

    private Map<String, Object> requireEditableComment(
            Long approvalId,
            Long commentId,
            String tenantCode,
            String actorLoginCode
    ) throws Exception {
        if (approvalId == null || approvalId.longValue() <= 0L) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "결재 ID가 올바르지 않습니다.");
        }
        if (commentId == null || commentId.longValue() <= 0L) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "댓글 ID가 올바르지 않습니다.");
        }

        String normalizedTenantCode = normalizeTenantCode(tenantCode);
        Long tenantId = resolveTenantId(normalizedTenantCode);
        Long actorLoginId = resolveActorLoginId(tenantId, actorLoginCode);
        if (actorLoginId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "댓글 처리 사용자 정보를 확인할 수 없습니다.");
        }

        Map<String, Object> accessParams = new HashMap<String, Object>();
        accessParams.put("tenantId", tenantId);
        accessParams.put("approvalId", approvalId);
        accessParams.put("actorLoginId", actorLoginId);
        Integer hasAccess = haccpWorkDAO.selectApprovalTemplateAccessCount(accessParams);
        if (hasAccess == null || hasAccess.intValue() <= 0) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "해당 결재 문서 댓글 처리 권한이 없습니다.");
        }

        Map<String, Object> commentParams = new HashMap<String, Object>();
        commentParams.put("tenantId", tenantId);
        commentParams.put("approvalId", approvalId);
        commentParams.put("commentId", commentId);
        Map<String, Object> commentRow = haccpWorkDAO.selectApprovalHistoryCommentById(commentParams);
        if (commentRow == null || commentRow.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "댓글을 찾을 수 없습니다.");
        }

        String answerTypeName = trimToEmpty(resolveMapValueIgnoreCase(commentRow, "answerTypeName"));
        if (HISTORY_TYPE_SYSTEM.equalsIgnoreCase(answerTypeName)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "시스템 댓글은 수정하거나 삭제할 수 없습니다.");
        }
        if (HISTORY_TYPE_DELETED.equalsIgnoreCase(answerTypeName)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이미 삭제된 댓글입니다.");
        }

        Long createdBy = getLong(commentRow, "createdBy");
        if (createdBy == null || !createdBy.equals(actorLoginId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인이 작성한 댓글만 수정하거나 삭제할 수 있습니다.");
        }

        return commentRow;
    }

    private Map<String, Object> resolveHistoryLineInfo(Map<String, Object> lineParams) throws Exception {
        Map<String, Object> lineInfo = haccpWorkDAO.selectApprovalLineForHistoryByLogin(lineParams);
        if (lineInfo != null && !lineInfo.isEmpty()) {
            return lineInfo;
        }

        lineInfo = haccpWorkDAO.selectApprovalReferenceLineForHistoryByLogin(lineParams);
        if (lineInfo != null && !lineInfo.isEmpty()) {
            return lineInfo;
        }

        Map<String, Object> anyLineParams = new HashMap<String, Object>();
        anyLineParams.put("tenantId", lineParams.get("tenantId"));
        anyLineParams.put("approvalId", lineParams.get("approvalId"));
        return haccpWorkDAO.selectAnyApprovalLineForHistory(anyLineParams);
    }

    private Long resolveTenantId(String tenantCode) throws Exception {
        Long tenantId = haccpWorkDAO.selectTenantIdByCode(tenantCode);
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
        return haccpWorkDAO.selectLoginIdByTenantAndLoginCode(params);
    }

    private String normalizeTenantCode(String tenantCode) {
        return StringUtils.hasText(tenantCode) ? tenantCode.trim().toUpperCase() : "";
    }

    private String trimToEmpty(String value) {
        return value == null ? "" : value.trim();
    }

    private String buildEaExeId(LocalDate nowDate) throws Exception {
        String seqRaw = electronicApprovalExeIdGnrService.getNextStringId();
        String numericPart = trimToEmpty(seqRaw).replaceAll("[^0-9]", "");
        if (!StringUtils.hasText(numericPart)) {
            numericPart = "0";
        }

        if (numericPart.length() > 4) {
            numericPart = numericPart.substring(numericPart.length() - 4);
        }

        while (numericPart.length() < 4) {
            numericPart = "0" + numericPart;
        }

        return nowDate.format(DATE_FORMATTER) + numericPart;
    }

    private Map<String, Object> selectApprovalActorProfile(Long tenantId, Long loginId) throws Exception {
        if (tenantId == null || loginId == null) {
            return new HashMap<String, Object>();
        }

        Map<String, Object> params = new HashMap<String, Object>();
        params.put("tenantId", tenantId);
        params.put("loginId", loginId);
        Map<String, Object> profile = haccpWorkDAO.selectApprovalActorProfile(params);
        if (profile == null) {
            return new HashMap<String, Object>();
        }
        return profile;
    }

    private String resolveLevelName(Map<String, Object> profile) {
        String departmentName = profile == null ? "" : trimToEmpty(String.valueOf(profile.getOrDefault("departmentName", "")));
        if (StringUtils.hasText(departmentName)) {
            return normalizeCode(departmentName, DEFAULT_LEVEL_NAME, 20);
        }
        return DEFAULT_LEVEL_NAME;
    }

    private Long getLong(Map<String, Object> map, String key) {
        if (map == null || key == null) {
            return null;
        }

        Object value = getValueIgnoreCase(map, key);
        if (value == null) {
            return null;
        }

        if (value instanceof Number) {
            return ((Number) value).longValue();
        }

        String text = String.valueOf(value).trim();
        if (!StringUtils.hasText(text)) {
            return null;
        }

        try {
            return Long.valueOf(text);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private String normalizeCode(String value, String fallback, int maxLength) {
        String normalized = trimToEmpty(value);
        if (!StringUtils.hasText(normalized)) {
            normalized = fallback;
        }

        if (normalized.length() > maxLength) {
            return normalized.substring(0, maxLength);
        }

        return normalized;
    }

    private Long insertApprovalLine(
            Long tenantId,
            Long electronicApprovalId,
            int exeSeq,
            Long loginId,
            Map<String, Object> profile,
            String stageName,
            String muldecStatus,
            String appStatus,
            String lastOwnerStatus,
            String lastCnfrmerStatus,
                LocalDateTime arrivalAt,
                LocalDateTime exeAt,
                LocalDateTime openAt,
            String eaExeId
    ) throws Exception {
        Map<String, Object> params = new HashMap<String, Object>();
        params.put("tenantId", tenantId);
        params.put("electronicApprovalId", electronicApprovalId);
        params.put("exeSeq", exeSeq);
        params.put("loginId", loginId);
        params.put("departmentId", getLong(profile, "departmentId"));
        params.put("levelName", resolveLevelName(profile));
        params.put("appStatus", appStatus);
        params.put("arbdecStatus", "N");
        params.put("repdecStatus", "N");
        params.put("stageName", stageName);
        params.put("muldecStatus", muldecStatus);
        params.put("arrivalAt", arrivalAt);
        params.put("exeAt", exeAt);
        params.put("optionName", stageName);
        params.put("openAt", openAt);
        params.put("approvalType", "drafted");
        params.put("lastOwnerStatus", lastOwnerStatus);
        params.put("orderSeq", exeSeq);
        params.put("lastCnfrmerStatus", lastCnfrmerStatus);
        params.put("roleName", stageName);
        params.put("referencerViewStatus", "pre_approved");
        params.put("connOfficialStatus", "excluded");
        params.put("eabusNo", DEFAULT_EABUS_NO);
        params.put("eaExeId", eaExeId);
        params.put("createdBy", loginId);
        return haccpWorkDAO.upsertElectronicApprovalLine(params);
    }

        private void rebuildPreApplyApprovalLines(
            Long tenantId,
            Long electronicApprovalId,
            Long drafterLoginId,
            Long reviewerLoginId,
            Long approverLoginId,
            Map<String, Object> drafterProfile,
            Map<String, Object> reviewerProfile,
            Map<String, Object> approverProfile,
            List<Long> referenceLoginIds,
            LocalDateTime now,
            String eaExeId
        ) throws Exception {
        insertApprovalLine(
            tenantId,
            electronicApprovalId,
            1,
            drafterLoginId,
            drafterProfile,
            "기안",
            "drafted",
            "",
            "N",
            "N",
            null,
            null,
            null,
            eaExeId
        );
        insertApprovalLine(
            tenantId,
            electronicApprovalId,
            2,
            reviewerLoginId,
            reviewerProfile,
            "검토",
            "drafted",
            "",
            "N",
            "N",
            null,
            null,
            null,
            eaExeId
        );
        insertApprovalLine(
            tenantId,
            electronicApprovalId,
            3,
            approverLoginId,
            approverProfile,
            "승인",
            "drafted",
            "",
            "N",
            "Y",
            null,
            null,
            null,
            eaExeId
        );

        int sequence = 4;
        if (referenceLoginIds == null) {
            return;
        }

        for (Long referenceLoginId : referenceLoginIds) {
            Map<String, Object> referenceProfile = selectApprovalActorProfile(tenantId, referenceLoginId);
            insertApprovalLine(
                tenantId,
                electronicApprovalId,
                sequence,
                referenceLoginId,
                referenceProfile,
                "참조",
                "cooperated",
                "",
                "N",
                "N",
                null,
                null,
                null,
                eaExeId
            );
            sequence++;
        }

        insertApprovalLine(
            tenantId,
            electronicApprovalId,
            sequence,
            drafterLoginId,
            drafterProfile,
            "최종기안",
            "drafted",
            "",
            "Y",
            "N",
            null,
            null,
            null,
            eaExeId
        );

        Map<String, Object> clearReferenceParams = new HashMap<String, Object>();
        clearReferenceParams.put("tenantId", tenantId);
        clearReferenceParams.put("approvalId", electronicApprovalId);
        clearReferenceParams.put("keepUntilExeSeq", sequence);
        haccpWorkDAO.clearUnusedReferenceApprovalLines(clearReferenceParams);
        }

    private List<Long> resolveReferenceLoginIds(
            Long tenantId,
            List<String> sourceIds,
            Long drafterLoginId,
            Long reviewerLoginId,
            Long approverLoginId
    ) throws Exception {
        if (sourceIds == null || sourceIds.isEmpty()) {
            return new ArrayList<Long>();
        }

        Set<Long> excluded = new LinkedHashSet<Long>();
        if (drafterLoginId != null) {
            excluded.add(drafterLoginId);
        }
        if (reviewerLoginId != null) {
            excluded.add(reviewerLoginId);
        }
        if (approverLoginId != null) {
            excluded.add(approverLoginId);
        }

        Set<Long> resolved = new LinkedHashSet<Long>();
        for (String sourceId : sourceIds) {
            Long loginId = resolveLoginIdCandidate(tenantId, sourceId);
            if (loginId == null || excluded.contains(loginId)) {
                continue;
            }
            resolved.add(loginId);
        }

        return new ArrayList<Long>(resolved);
    }

    private Long resolveLoginIdCandidate(Long tenantId, String sourceId) throws Exception {
        if (!StringUtils.hasText(sourceId)) {
            return null;
        }

        String normalized = sourceId.trim();
        Long candidateId;
        try {
            candidateId = Long.valueOf(normalized);
        } catch (NumberFormatException ex) {
            return null;
        }

        Map<String, Object> params = new HashMap<String, Object>();
        params.put("tenantId", tenantId);
        params.put("candidateId", candidateId);
        return haccpWorkDAO.selectLoginIdByTenantAndUserOrLoginId(params);
    }

    private Long findLatestPreApplyApprovalId(Long tenantId, Long workId, Long loginId) throws Exception {
        Map<String, Object> params = new HashMap<String, Object>();
        params.put("tenantId", tenantId);
        params.put("workId", workId);
        params.put("loginId", loginId);
        return haccpWorkDAO.selectLatestPreApplyApprovalIdByWorkAndLogin(params);
    }

    private int resolveCancelableTargetSeq(Long tenantId, Long approvalId, Long actorLoginId) throws Exception {
        Map<String, Object> params = new HashMap<String, Object>();
        params.put("tenantId", tenantId);
        params.put("approvalId", approvalId);

        Integer finalOwnerConfirmedCount = haccpWorkDAO.selectFinalOwnerConfirmedCountByApprovalId(params);
        if (finalOwnerConfirmedCount != null && finalOwnerConfirmedCount.intValue() > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "최종기안 확인 완료 후에는 결재취소할 수 없습니다.");
        }

        Integer latestCompletedSeq = haccpWorkDAO.selectLatestCompletedDraftedSeqByApprovalId(params);
        if (latestCompletedSeq == null || latestCompletedSeq.intValue() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "취소 가능한 결재 이력이 없습니다.");
        }

        params.put("loginId", actorLoginId);
        Integer actorLatestCompletedSeq = haccpWorkDAO.selectLatestCompletedDraftedSeqByApprovalAndLogin(params);
        if (actorLatestCompletedSeq == null || actorLatestCompletedSeq.intValue() <= 0) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인의 결재 처리 이력이 없어 취소할 수 없습니다.");
        }

        if (!latestCompletedSeq.equals(actorLatestCompletedSeq)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "최근 결재 처리자부터 순차적으로 취소할 수 있습니다."
            );
        }

        return latestCompletedSeq.intValue();
    }

    private void resetDraftedLineToPending(Long tenantId, Long approvalId, int exeSeq) throws Exception {
        Map<String, Object> params = new HashMap<String, Object>();
        params.put("tenantId", tenantId);
        params.put("approvalId", approvalId);
        params.put("exeSeq", exeSeq);
        haccpWorkDAO.updateElectronicApprovalLineToPending(params);
    }

    private void reopenDraftedLineTurn(Long tenantId, Long approvalId, int exeSeq, LocalDateTime arrivalAt, String optionName) throws Exception {
        resetDraftedLineToPending(tenantId, approvalId, exeSeq);

        Map<String, Object> params = new HashMap<String, Object>();
        params.put("tenantId", tenantId);
        params.put("approvalId", approvalId);
        params.put("exeSeq", exeSeq);
        params.put("arrivalAt", arrivalAt);
        params.put("optionName", optionName);
        haccpWorkDAO.updateElectronicApprovalLineArrival(params);
    }

    private void markFinalOwnerArrival(Long tenantId, Long approvalId, LocalDateTime arrivalAt, String optionName) throws Exception {
        Map<String, Object> finalOwnerParams = new HashMap<String, Object>();
        finalOwnerParams.put("tenantId", tenantId);
        finalOwnerParams.put("approvalId", approvalId);
        Integer finalOwnerSeq = haccpWorkDAO.selectFinalOwnerExeSeqByApprovalId(finalOwnerParams);
        if (finalOwnerSeq == null || finalOwnerSeq.intValue() < FINAL_OWNER_SEQ) {
            return;
        }

        Map<String, Object> params = new HashMap<String, Object>();
        params.put("tenantId", tenantId);
        params.put("approvalId", approvalId);
        params.put("exeSeq", finalOwnerSeq);
        params.put("arrivalAt", arrivalAt);
        params.put("optionName", optionName);
        haccpWorkDAO.updateElectronicApprovalLineArrival(params);
    }

    private void processApprovalChain(
            Long tenantId,
            Long approvalId,
            Long actorLoginId,
            String actorName,
            LocalDateTime now,
            String eventType
    ) throws Exception {
        if ("submit".equals(eventType)) {
            if (!isApprovalLineOwnedByActor(tenantId, approvalId, REVIEWER_SEQ, actorLoginId)) {
                return;
            }

            processApprovalStep(
                tenantId,
                approvalId,
                REVIEWER_SEQ,
                actorLoginId,
                actorName,
                now,
                "approved",
                "검토승인",
                "in_progress",
                "진행중",
                "in_progress",
                "review_approve"
            );

            markNextApprovalArrival(tenantId, approvalId, APPROVER_SEQ, now, "승인요청");

            if (isApprovalLineOwnedByActor(tenantId, approvalId, APPROVER_SEQ, actorLoginId)) {
                processApprovalStep(
                    tenantId,
                    approvalId,
                    APPROVER_SEQ,
                    actorLoginId,
                    actorName,
                    now,
                    "approved",
                    "최종승인",
                    "approved",
                    "완료",
                    "approved",
                    "final_approve"
                );
                markFinalOwnerArrival(tenantId, approvalId, now, "최종기안알림");
            }
            return;
        }

        if ("review_approve".equals(eventType)) {
            processApprovalStep(
                tenantId,
                approvalId,
                REVIEWER_SEQ,
                actorLoginId,
                actorName,
                now,
                "approved",
                "검토승인",
                "in_progress",
                "진행중",
                "in_progress",
                "review_approve"
            );

            markNextApprovalArrival(tenantId, approvalId, APPROVER_SEQ, now, "승인요청");

            if (isApprovalLineOwnedByActor(tenantId, approvalId, APPROVER_SEQ, actorLoginId)) {
                processApprovalStep(
                    tenantId,
                    approvalId,
                    APPROVER_SEQ,
                    actorLoginId,
                    actorName,
                    now,
                    "approved",
                    "최종승인",
                    "approved",
                    "완료",
                    "approved",
                    "final_approve"
                );
                markFinalOwnerArrival(tenantId, approvalId, now, "최종기안알림");
            }
            return;
        }

        if ("final_approve".equals(eventType)) {
            processApprovalStep(
                tenantId,
                approvalId,
                APPROVER_SEQ,
                actorLoginId,
                actorName,
                now,
                "approved",
                "최종승인",
                "approved",
                "완료",
                "approved",
                "final_approve"
            );
            markFinalOwnerArrival(tenantId, approvalId, now, "최종기안알림");
        }
    }

    private void processApprovalStep(
            Long tenantId,
            Long approvalId,
            int targetSeq,
            Long actorLoginId,
            String actorName,
            LocalDateTime now,
            String lineStatus,
            String lineOption,
            String mainStatus,
            String mainStatusName,
            String endStatus,
            String eventType
    ) throws Exception {
        Map<String, Object> lineUpdateParams = new HashMap<String, Object>();
        lineUpdateParams.put("tenantId", tenantId);
        lineUpdateParams.put("approvalId", approvalId);
        lineUpdateParams.put("exeSeq", targetSeq);
        lineUpdateParams.put("appStatus", lineStatus);
        lineUpdateParams.put("optionName", lineOption);
        lineUpdateParams.put("updatedAt", now);
        int updatedLineCount = haccpWorkDAO.updateElectronicApprovalLineStatus(lineUpdateParams);
        if (updatedLineCount <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "결재선 상태를 갱신하지 못했습니다.");
        }

        Map<String, Object> mainUpdateParams = new HashMap<String, Object>();
        mainUpdateParams.put("tenantId", tenantId);
        mainUpdateParams.put("approvalId", approvalId);
        mainUpdateParams.put("statusType", mainStatus);
        mainUpdateParams.put("statusTypeName", mainStatusName);
        mainUpdateParams.put("endStatus", endStatus);
        mainUpdateParams.put("updatedBy", actorLoginId);
        mainUpdateParams.put("updatedAt", now);
        haccpWorkDAO.updateElectronicApprovalMainStatus(mainUpdateParams);

        appendSystemHistoryCommentBySeq(
            tenantId,
            approvalId,
            targetSeq,
            actorLoginId,
            now,
            buildSystemCommentMessage(actorName, eventType, false, targetSeq)
        );
    }

    private boolean isApprovalLineOwnedByActor(Long tenantId, Long approvalId, int exeSeq, Long actorLoginId) throws Exception {
        Map<String, Object> lineOwnerParams = new HashMap<String, Object>();
        lineOwnerParams.put("tenantId", tenantId);
        lineOwnerParams.put("approvalId", approvalId);
        lineOwnerParams.put("exeSeq", exeSeq);
        Long expectedActorLoginId = haccpWorkDAO.selectApprovalLineLoginId(lineOwnerParams);
        return expectedActorLoginId != null && expectedActorLoginId.equals(actorLoginId);
    }

    private void markNextApprovalArrival(Long tenantId, Long approvalId, int exeSeq, LocalDateTime arrivalAt, String optionName) throws Exception {
        Map<String, Object> nextArrivalParams = new HashMap<String, Object>();
        nextArrivalParams.put("tenantId", tenantId);
        nextArrivalParams.put("approvalId", approvalId);
        nextArrivalParams.put("exeSeq", exeSeq);
        nextArrivalParams.put("arrivalAt", arrivalAt);
        nextArrivalParams.put("optionName", optionName);
        haccpWorkDAO.updateElectronicApprovalLineArrival(nextArrivalParams);
    }

    private String resolveActorDisplayName(Map<String, Object> actorProfile, String actorLoginCode) {
        String actorName = resolveMapValueIgnoreCase(actorProfile, "userName");
        if (StringUtils.hasText(actorName)) {
            return actorName;
        }
        if (StringUtils.hasText(actorLoginCode)) {
            return actorLoginCode.trim();
        }
        return "사용자";
    }

    private String buildSystemCommentMessage(String actorName, String eventType, boolean isFinalOwnerReference, Integer cancelTargetSeq) {
        String normalizedActorName = StringUtils.hasText(actorName) ? actorName.trim() : "사용자";
        String action;
        if ("submit".equals(eventType)) {
            action = "결재신청";
        } else if ("review_approve".equals(eventType)) {
            action = "검토승인";
        } else if ("final_approve".equals(eventType)) {
            action = "최종승인";
        } else if ("review_return".equals(eventType) || "final_return".equals(eventType)) {
            action = "반려";
        } else if ("submit_cancel".equals(eventType)) {
            action = resolveSubmitCancelAction(cancelTargetSeq);
        } else if ("reference_confirm".equals(eventType)) {
            action = isFinalOwnerReference ? "최종확인" : "참조확인";
        } else if ("final_confirm".equals(eventType)) {
            action = "최종확인";
        } else {
            action = "처리";
        }

        return "[시스템] " + normalizedActorName + "님이 " + action + " 처리했습니다.";
    }

    private String buildSystemActionCommentMessage(String actorName, String actionLabel, String actionDetail) {
        String normalizedActorName = StringUtils.hasText(actorName) ? actorName.trim() : "사용자";
        String normalizedActionLabel = StringUtils.hasText(actionLabel) ? actionLabel.trim() : "처리";
        String message = "[시스템] " + normalizedActorName + "님이 " + normalizedActionLabel + " 처리했습니다.";
        if (!StringUtils.hasText(actionDetail)) {
            return message;
        }
        return message + " (대상: " + actionDetail.trim() + ")";
    }

    private String resolveSubmitCancelAction(Integer cancelTargetSeq) {
        if (cancelTargetSeq == null) {
            return "상신취소";
        }
        if (cancelTargetSeq.intValue() == REVIEWER_SEQ) {
            return "검토승인 취소";
        }
        if (cancelTargetSeq.intValue() == APPROVER_SEQ) {
            return "승인 취소";
        }
        return "상신취소";
    }

    private void appendSystemHistoryCommentBySeq(
            Long tenantId,
            Long approvalId,
            int exeSeq,
            Long actorLoginId,
            LocalDateTime now,
            String message
    ) throws Exception {
        Map<String, Object> lineParams = new HashMap<String, Object>();
        lineParams.put("tenantId", tenantId);
        lineParams.put("approvalId", approvalId);
        lineParams.put("exeSeq", exeSeq);
        Map<String, Object> lineInfo = haccpWorkDAO.selectApprovalLineForHistoryBySeq(lineParams);
        appendHistoryCommentFromLine(tenantId, lineInfo, actorLoginId, now, message, HISTORY_TYPE_SYSTEM);
    }

    private void appendSystemHistoryCommentByReference(
            Long tenantId,
            Long approvalId,
            Long actorLoginId,
            LocalDateTime now,
            String message
    ) throws Exception {
        Map<String, Object> lineParams = new HashMap<String, Object>();
        lineParams.put("tenantId", tenantId);
        lineParams.put("approvalId", approvalId);
        lineParams.put("loginId", actorLoginId);
        Map<String, Object> lineInfo = haccpWorkDAO.selectApprovalReferenceLineForHistoryByLogin(lineParams);
        appendHistoryCommentFromLine(tenantId, lineInfo, actorLoginId, now, message, HISTORY_TYPE_SYSTEM);
    }

    private void appendSystemHistoryCommentByLogin(
            Long tenantId,
            Long approvalId,
            Long actorLoginId,
            LocalDateTime now,
            String message
    ) throws Exception {
        Map<String, Object> lineParams = new HashMap<String, Object>();
        lineParams.put("tenantId", tenantId);
        lineParams.put("approvalId", approvalId);
        lineParams.put("loginId", actorLoginId);
        Map<String, Object> lineInfo = haccpWorkDAO.selectApprovalLineForHistoryByLogin(lineParams);
        appendHistoryCommentFromLine(tenantId, lineInfo, actorLoginId, now, message, HISTORY_TYPE_SYSTEM);
    }

    private void appendSystemHistoryCommentByLineId(
            Long tenantId,
            Long lineId,
            int exeSeq,
            Long actorLoginId,
            LocalDateTime now,
            String message,
            String eaExeId
    ) throws Exception {
        if (lineId == null || lineId.longValue() <= 0L) {
            throw new IllegalStateException("결재선 키를 확인할 수 없습니다.");
        }

        Map<String, Object> seqParams = new HashMap<String, Object>();
        seqParams.put("tenantId", tenantId);
        seqParams.put("electronicApprovalLineId", lineId);
        seqParams.put("exeSeq", exeSeq);
        Integer answerSeq = haccpWorkDAO.selectNextApprovalHistoryAnswerSeq(seqParams);
        if (answerSeq == null || answerSeq.intValue() <= 0) {
            answerSeq = Integer.valueOf(1);
        }

        String normalizedEaExeId = StringUtils.hasText(eaExeId)
            ? eaExeId.trim()
            : buildEaExeId(now.toLocalDate());

        Map<String, Object> insertParams = new HashMap<String, Object>();
        insertParams.put("tenantId", tenantId);
        insertParams.put("electronicApprovalLineId", lineId);
        insertParams.put("parentHistoryId", null);
        insertParams.put("answerSeq", answerSeq);
        insertParams.put("answerTypeName", HISTORY_TYPE_SYSTEM);
        insertParams.put("answerAt", now);
        insertParams.put("answerCnt", truncateToMaxLength(message, 4000));
        insertParams.put("notOpenStatus", null);
        insertParams.put("mainViewStatus", null);
        insertParams.put("exeSeq", exeSeq);
        insertParams.put("approvalType", "drafted");
        insertParams.put("eabusNo", DEFAULT_EABUS_NO);
        insertParams.put("eaExeId", normalizedEaExeId);
        insertParams.put("createdBy", actorLoginId);
        insertParams.put("createdAt", now);
        haccpWorkDAO.insertElectronicApprovalHistoryMain(insertParams);
    }

        private void appendHistoryCommentFromLine(
            Long tenantId,
            Map<String, Object> lineInfo,
            Long actorLoginId,
            LocalDateTime now,
            String message,
            String answerTypeName
    ) throws Exception {
        appendHistoryCommentFromLine(
            tenantId,
            lineInfo,
            actorLoginId,
            now,
            message,
            answerTypeName,
            null
        );
    }

    private void appendHistoryCommentFromLine(
            Long tenantId,
            Map<String, Object> lineInfo,
            Long actorLoginId,
            LocalDateTime now,
            String message,
            String answerTypeName,
            Long parentHistoryId
    ) throws Exception {
        Long lineId = getLong(lineInfo, "electronicApprovalLineId");
        Integer exeSeq = getInteger(lineInfo, "exeSeq");
        if (lineId == null || exeSeq == null || exeSeq.intValue() <= 0) {
                throw new IllegalStateException("이력 저장 대상 결재선 정보를 찾을 수 없습니다.");
        }

        Map<String, Object> seqParams = new HashMap<String, Object>();
        seqParams.put("tenantId", tenantId);
        seqParams.put("electronicApprovalLineId", lineId);
        seqParams.put("exeSeq", exeSeq);
        Integer answerSeq = haccpWorkDAO.selectNextApprovalHistoryAnswerSeq(seqParams);
        if (answerSeq == null || answerSeq.intValue() <= 0) {
            answerSeq = Integer.valueOf(1);
        }

        String approvalType = resolveMapValueIgnoreCase(lineInfo, "approvalType");
        if (!StringUtils.hasText(approvalType)) {
            approvalType = "drafted";
        }

        String eabusNo = resolveMapValueIgnoreCase(lineInfo, "eabusNo");
        if (!StringUtils.hasText(eabusNo)) {
            eabusNo = DEFAULT_EABUS_NO;
        }

        String eaExeId = resolveMapValueIgnoreCase(lineInfo, "eaExeId");
        if (!StringUtils.hasText(eaExeId)) {
            eaExeId = buildEaExeId(now.toLocalDate());
        }

        Map<String, Object> insertParams = new HashMap<String, Object>();
        insertParams.put("tenantId", tenantId);
        insertParams.put("electronicApprovalLineId", lineId);
        insertParams.put("parentHistoryId", parentHistoryId);
        insertParams.put("answerSeq", answerSeq);
        insertParams.put("answerTypeName", answerTypeName);
        insertParams.put("answerAt", now);
        insertParams.put("answerCnt", truncateToMaxLength(message, 4000));
        insertParams.put("notOpenStatus", null);
        insertParams.put("mainViewStatus", null);
        insertParams.put("exeSeq", exeSeq);
        insertParams.put("approvalType", approvalType);
        insertParams.put("eabusNo", eabusNo);
        insertParams.put("eaExeId", eaExeId);
        insertParams.put("createdBy", actorLoginId);
        insertParams.put("createdAt", now);
        haccpWorkDAO.insertElectronicApprovalHistoryMain(insertParams);
    }

    private Integer getInteger(Map<String, Object> map, String key) {
        if (map == null || key == null) {
            return null;
        }

        Object value = getValueIgnoreCase(map, key);
        if (value == null) {
            return null;
        }

        if (value instanceof Number) {
            return Integer.valueOf(((Number) value).intValue());
        }

        String text = String.valueOf(value).trim();
        if (!StringUtils.hasText(text)) {
            return null;
        }

        try {
            return Integer.valueOf(text);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private Object getValueIgnoreCase(Map<String, Object> map, String key) {
        if (map == null || key == null) {
            return null;
        }

        if (map.containsKey(key)) {
            return map.get(key);
        }

        for (Map.Entry<String, Object> entry : map.entrySet()) {
            String entryKey = entry.getKey();
            if (entryKey != null && entryKey.equalsIgnoreCase(key)) {
                return entry.getValue();
            }
        }

        return null;
    }

    private String truncateToMaxLength(String value, int maxLength) {
        String normalized = value == null ? "" : value;
        if (normalized.length() <= maxLength) {
            return normalized;
        }
        return normalized.substring(0, maxLength);
    }

    private String resolveMapValueIgnoreCase(Map<String, Object> source, String... keys) {
        if (source == null || source.isEmpty() || keys == null || keys.length == 0) {
            return "";
        }

        for (String key : keys) {
            if (!StringUtils.hasText(key)) {
                continue;
            }
            if (source.containsKey(key)) {
                return trimToEmpty(String.valueOf(source.get(key)));
            }
        }

        for (Map.Entry<String, Object> entry : source.entrySet()) {
            String entryKey = entry.getKey();
            if (!StringUtils.hasText(entryKey)) {
                continue;
            }
            for (String key : keys) {
                if (StringUtils.hasText(key) && entryKey.equalsIgnoreCase(key)) {
                    return trimToEmpty(String.valueOf(entry.getValue()));
                }
            }
        }

        return "";
    }

    private void ensureSubmissionEditableState(Long tenantId, Long workId, Long loginId, String actionLabel) throws Exception {
        Map<String, Object> params = new HashMap<String, Object>();
        params.put("tenantId", tenantId);
        params.put("workId", workId);
        params.put("loginId", loginId);

        Map<String, Object> latest = haccpWorkDAO.selectLatestApprovalStatusByWorkAndLogin(params);
        String latestStatus = trimToEmpty(String.valueOf(latest == null ? "" : latest.get("statusType"))).toLowerCase();
        if ("in_progress".equals(latestStatus) || "approved".equals(latestStatus)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                actionLabel + "은(는) 결재 취소 후에만 가능합니다."
            );
        }
    }
}
