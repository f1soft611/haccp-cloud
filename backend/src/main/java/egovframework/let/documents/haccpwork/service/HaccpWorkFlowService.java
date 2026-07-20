package egovframework.let.documents.haccpwork.service;

import egovframework.let.documents.haccpwork.domain.model.HaccpWorkDraftSubmitRequestVO;
import egovframework.let.documents.haccpwork.domain.model.HaccpWorkDraftTempSaveRequestVO;
import egovframework.let.documents.haccpwork.domain.model.HaccpWorkVO;
import egovframework.let.documents.haccpwork.domain.model.HaccpWorkApprovalStatusUpdateRequestVO;

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
}
