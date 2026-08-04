package egovframework.let.documents.haccpwork.service;

import java.util.List;
import java.util.Map;

import egovframework.let.documents.haccpwork.domain.model.HaccpAttachmentCompleteRequestVO;
import egovframework.let.documents.haccpwork.domain.model.HaccpAttachmentUploadRequestVO;

public interface HaccpWorkAttachmentService {

    Map<String, Object> presignUpload(
            Long approvalId,
            String tenantCode,
            List<HaccpAttachmentUploadRequestVO> items,
            String actorLoginCode,
            String actorIp,
            String actorUserAgent
    ) throws Exception;

    List<Map<String, Object>> completeUpload(
            Long approvalId,
            String tenantCode,
            List<HaccpAttachmentCompleteRequestVO> items,
            String actorLoginCode
    ) throws Exception;

    List<Map<String, Object>> listAttachments(
            Long approvalId,
            String tenantCode,
            String actorLoginCode
    ) throws Exception;

    Map<String, Object> presignDownload(
            Long approvalId,
            Long attachmentId,
            String tenantCode,
            String actorLoginCode,
            String actorIp,
            String actorUserAgent
    ) throws Exception;

    Map<String, Object> presignPreview(
            Long approvalId,
            Long attachmentId,
            String tenantCode,
            String actorLoginCode,
            String actorIp,
            String actorUserAgent
    ) throws Exception;

    void deleteAttachment(
            Long approvalId,
            Long attachmentId,
            String tenantCode,
            String actorLoginCode
    ) throws Exception;
}
