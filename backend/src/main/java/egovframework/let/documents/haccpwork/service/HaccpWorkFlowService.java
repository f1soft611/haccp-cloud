package egovframework.let.documents.haccpwork.service;

import java.util.List;
import java.util.Map;

import egovframework.let.documents.haccpwork.domain.model.HaccpWorkDraftSubmitRequestVO;
import egovframework.let.documents.haccpwork.domain.model.HaccpWorkDraftTempSaveRequestVO;
import egovframework.let.documents.haccpwork.domain.model.HaccpWorkVO;
import egovframework.let.documents.haccpwork.domain.model.HaccpWorkApprovalStatusUpdateRequestVO;
import egovframework.let.documents.haccpwork.domain.model.HaccpWorkApprovalCommentCreateRequestVO;
import egovframework.let.documents.haccpwork.domain.model.HaccpWorkApprovalCommentUpdateRequestVO;

/**
 * HACCP 업무 작성~결재 흐름을 위한 서비스 인터페이스 클래스
 */
public interface HaccpWorkFlowService {

        public HaccpWorkVO saveTempDraft(
            Long workId,
            String tenantCode,
            HaccpWorkDraftTempSaveRequestVO payload,
            String actorLoginCode
    ) throws Exception;

    public Long submitDraft(
            Long workId,
            String tenantCode,
            HaccpWorkDraftSubmitRequestVO payload,
            String actorLoginCode
    ) throws Exception;

    public HaccpWorkVO updateApprovalStatus(
            Long approvalId,
            String tenantCode,
            HaccpWorkApprovalStatusUpdateRequestVO payload,
            String actorLoginCode
    ) throws Exception;

    public List<Map<String, Object>> listApprovalComments(
            Long approvalId,
            String tenantCode,
            String actorLoginCode
    ) throws Exception;

    public void createApprovalComment(
            Long approvalId,
            String tenantCode,
            HaccpWorkApprovalCommentCreateRequestVO payload,
            String actorLoginCode
    ) throws Exception;

    public void updateApprovalComment(
            Long approvalId,
            Long commentId,
            String tenantCode,
            HaccpWorkApprovalCommentUpdateRequestVO payload,
            String actorLoginCode
    ) throws Exception;

    public void deleteApprovalComment(
            Long approvalId,
            Long commentId,
            String tenantCode,
            String actorLoginCode
    ) throws Exception;

    public void createSystemApprovalComment(
            Long approvalId,
            String tenantCode,
            String actionLabel,
            String actionDetail,
            String actorLoginCode
    ) throws Exception;
}
