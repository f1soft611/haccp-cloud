package egovframework.let.documents.haccpwork.service.impl;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import org.egovframe.rte.fdl.cmmn.EgovAbstractServiceImpl;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import egovframework.let.documents.haccpwork.domain.model.HaccpAttachmentCompleteRequestVO;
import egovframework.let.documents.haccpwork.domain.model.HaccpAttachmentPolicy;
import egovframework.let.documents.haccpwork.domain.model.HaccpAttachmentUploadRequestVO;
import egovframework.let.documents.haccpwork.domain.repository.HaccpWorkDAO;
import egovframework.let.documents.haccpwork.service.HaccpWorkAttachmentService;
import egovframework.let.documents.haccpwork.service.HaccpWorkFlowService;
import egovframework.let.storage.StorageClient;
import egovframework.let.storage.StorageProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service("haccpWorkAttachmentService")
@RequiredArgsConstructor
@Slf4j
public class HaccpWorkAttachmentServiceImpl extends EgovAbstractServiceImpl implements HaccpWorkAttachmentService {

    private static final Duration UPLOAD_EXPIRY = Duration.ofMinutes(10);
    private static final Duration DOWNLOAD_EXPIRY = Duration.ofSeconds(60);
    private static final String DEFAULT_TENANT = "PLATFORM";
    private static final String DEFAULT_BUCKET = "haccp-attachments";

    private static final HaccpAttachmentPolicy DEFAULT_POLICY = new HaccpAttachmentPolicy(
            20L * 1024L * 1024L,
            20,
            100L * 1024L * 1024L,
            Arrays.asList("pdf", "png", "jpg", "jpeg", "gif", "doc", "docx", "xls", "xlsx", "hwp", "ppt", "pptx")
    );

    private final HaccpWorkDAO haccpWorkDAO;
    private final StorageClient storageClient;
    private final StorageProperties storageProperties;
    private final HaccpWorkFlowService haccpWorkFlowService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> presignUpload(
            Long approvalId,
            String tenantCode,
            List<HaccpAttachmentUploadRequestVO> items,
            String actorLoginCode,
            String actorIp,
            String actorUserAgent
    ) throws Exception {
        validateApprovalId(approvalId);
        DEFAULT_POLICY.validateBatch(items);

        String normalizedTenant = normalizeTenantCode(tenantCode);
        Long tenantId = resolveTenantId(normalizedTenant);
        Long actorLoginId = resolveActorLoginId(tenantId, actorLoginCode);
        ensureApprovalAccess(tenantId, approvalId, actorLoginId);

        LocalDateTime now = LocalDateTime.now();
        String bucketName = resolveBucketName();

        List<Map<String, Object>> resultItems = new ArrayList<Map<String, Object>>();
        for (HaccpAttachmentUploadRequestVO item : items) {
            String effectiveFileName = item.getEffectiveFileName();
            String objectKey = buildObjectKey(normalizedTenant, approvalId, effectiveFileName, now);
            String uploadToken = UUID.randomUUID().toString();

            StorageClient.PresignedUploadResult presigned = storageClient.presignUpload(
                    new StorageClient.PresignedUploadRequest(
                            bucketName,
                            objectKey,
                            item.getContentType(),
                            UPLOAD_EXPIRY
                    )
            );

                Map<String, Object> attachmentParams = new HashMap<String, Object>();
                attachmentParams.put("tenantId", tenantId);
                attachmentParams.put("approvalId", approvalId);
                attachmentParams.put("objectKey", objectKey);
                attachmentParams.put("originalFileName", effectiveFileName);
                attachmentParams.put("fileExt", extractExtension(effectiveFileName));
                attachmentParams.put("contentType", trimToEmpty(item.getContentType()));
                attachmentParams.put("fileSize", item.getFileSize());
                attachmentParams.put("checksumSha256", trimToNull(item.getChecksumSha256()));
                attachmentParams.put("uploadStatus", "PENDING");
                attachmentParams.put("previewableYn", isPreviewableContentType(item.getContentType()) ? "Y" : "N");
                attachmentParams.put("storageProvider", "MINIO");
                attachmentParams.put("bucketName", bucketName);
                attachmentParams.put("createdBy", actorLoginId);
                haccpWorkDAO.insertDocumentAttachment(attachmentParams);

            Map<String, Object> sessionParams = new HashMap<String, Object>();
            sessionParams.put("tenantId", tenantId);
            sessionParams.put("approvalId", approvalId);
            sessionParams.put("attachmentId", attachmentParams.get("attachmentId"));
            sessionParams.put("uploadToken", uploadToken);
            sessionParams.put("objectKey", objectKey);
            sessionParams.put("expectedFileName", effectiveFileName);
            sessionParams.put("expectedContentType", trimToNull(item.getContentType()));
            sessionParams.put("expectedFileSize", item.getFileSize());
            sessionParams.put("sessionStatus", "ISSUED");
            sessionParams.put("expiresAt", Timestamp.valueOf(now.plusSeconds(presigned.getExpiresInSeconds())));
            sessionParams.put("completedAt", null);
            sessionParams.put("createdBy", actorLoginId);
            haccpWorkDAO.insertDocumentAttachmentUploadSession(sessionParams);

            Map<String, Object> responseItem = new HashMap<String, Object>();
            responseItem.put("uploadToken", uploadToken);
            responseItem.put("objectKey", objectKey);
            responseItem.put("uploadUrl", presigned.getUrl());
            Map<String, Object> requiredHeaders = new HashMap<String, Object>();
            requiredHeaders.put("Content-Type", trimToEmpty(item.getContentType()));
            responseItem.put("requiredHeaders", requiredHeaders);
            responseItem.put("expiresAt", now.plusSeconds(presigned.getExpiresInSeconds()).toString());
            resultItems.add(responseItem);
        }

        Map<String, Object> result = new HashMap<String, Object>();
        result.put("items", resultItems);
        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public List<Map<String, Object>> completeUpload(
            Long approvalId,
            String tenantCode,
            List<HaccpAttachmentCompleteRequestVO> items,
            String actorLoginCode
    ) throws Exception {
        validateApprovalId(approvalId);
        if (items == null || items.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "완료 처리할 첨부파일이 없습니다.");
        }

        String normalizedTenant = normalizeTenantCode(tenantCode);
        Long tenantId = resolveTenantId(normalizedTenant);
        Long actorLoginId = resolveActorLoginId(tenantId, actorLoginCode);
        ensureApprovalAccess(tenantId, approvalId, actorLoginId);

        List<Map<String, Object>> resultList = new ArrayList<Map<String, Object>>();
        for (HaccpAttachmentCompleteRequestVO item : items) {
            String uploadToken = trimToNull(item.getUploadToken());
            String objectKey = trimToNull(item.getObjectKey());
            if (!StringUtils.hasText(uploadToken) || !StringUtils.hasText(objectKey)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "업로드 토큰 또는 오브젝트 키가 누락되었습니다.");
            }

            Map<String, Object> sessionParams = new HashMap<String, Object>();
            sessionParams.put("tenantId", tenantId);
            sessionParams.put("uploadToken", uploadToken);
            Map<String, Object> session = haccpWorkDAO.selectDocumentAttachmentUploadSessionByToken(sessionParams);
            if (session == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "업로드 세션을 찾을 수 없습니다.");
            }

            if (!approvalId.equals(getLong(session, "approvalId"))) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "다른 결재 문서의 업로드 세션입니다.");
            }

            String sessionObjectKey = session.get("objectKey") == null ? null : String.valueOf(session.get("objectKey"));
            if (!objectKey.equals(sessionObjectKey)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "업로드 오브젝트 키가 일치하지 않습니다.");
            }

            String sessionStatus = trimToEmpty(String.valueOf(session.get("sessionStatus"))).toUpperCase(Locale.ROOT);
            if (!"ISSUED".equals(sessionStatus)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "완료 가능한 업로드 세션 상태가 아닙니다.");
            }

            LocalDateTime expiresAt = toLocalDateTime(session.get("expiresAt"));
            if (expiresAt != null && !expiresAt.isAfter(LocalDateTime.now())) {
                throw new ResponseStatusException(HttpStatus.GONE, "업로드 세션이 만료되었습니다.");
            }

            Long attachmentId = getLong(session, "attachmentId");
            if (attachmentId == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "첨부 메타데이터를 찾을 수 없습니다.");
            }

            Map<String, Object> currentAttachment = new HashMap<String, Object>();
            currentAttachment.put("tenantId", tenantId);
            currentAttachment.put("attachmentId", attachmentId);
            Map<String, Object> attachmentRow = haccpWorkDAO.selectDocumentAttachmentById(currentAttachment);
            if (attachmentRow == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "첨부 메타데이터를 찾을 수 없습니다.");
            }

            Long attachmentApprovalId = getLong(attachmentRow, "approvalId");
            if (attachmentApprovalId == null || !approvalId.equals(attachmentApprovalId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "다른 결재 문서의 첨부파일에는 접근할 수 없습니다.");
            }

            String bucketName = resolveBucketName(asString(attachmentRow.get("bucketName")));
            StorageClient.ObjectStat objectStat = storageClient.statObject(bucketName, objectKey);
            if (item.getFileSize() != null && objectStat.getSize() != item.getFileSize().longValue()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "업로드된 파일 크기가 요청과 다릅니다.");
            }

            if (StringUtils.hasText(item.getContentType()) && StringUtils.hasText(objectStat.getContentType())
                    && !item.getContentType().equalsIgnoreCase(objectStat.getContentType())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "업로드된 파일 타입이 요청과 다릅니다.");
            }

            Map<String, Object> sessionUpdate = new HashMap<String, Object>();
            sessionUpdate.put("tenantId", tenantId);
            sessionUpdate.put("uploadToken", uploadToken);
            sessionUpdate.put("sessionStatus", "COMPLETED");
            sessionUpdate.put("attachmentId", attachmentId);
            sessionUpdate.put("completedAt", Timestamp.valueOf(LocalDateTime.now()));
            sessionUpdate.put("updatedBy", actorLoginId);
            sessionUpdate.put("expectedSessionStatus", "ISSUED");
            sessionUpdate.put("requireNotExpired", Boolean.TRUE);
            int updatedSessionCount = haccpWorkDAO.updateDocumentAttachmentUploadSessionStatus(sessionUpdate);
            if (updatedSessionCount <= 0) {
                Map<String, Object> currentSession = haccpWorkDAO.selectDocumentAttachmentUploadSessionByToken(sessionParams);
                LocalDateTime currentExpiresAt = toLocalDateTime(currentSession == null ? null : currentSession.get("expiresAt"));
                if (currentExpiresAt != null && !currentExpiresAt.isAfter(LocalDateTime.now())) {
                    throw new ResponseStatusException(HttpStatus.GONE, "업로드 세션이 만료되었습니다.");
                }
                throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 처리되었거나 상태가 변경된 업로드 세션입니다.");
            }

            Map<String, Object> attachmentUpdate = new HashMap<String, Object>();
            attachmentUpdate.put("tenantId", tenantId);
            attachmentUpdate.put("attachmentId", attachmentId);
            attachmentUpdate.put("uploadStatus", "COMPLETED");
            attachmentUpdate.put("checksumSha256", trimToNull(item.getChecksumSha256()));
            attachmentUpdate.put("updatedBy", actorLoginId);
            int updatedAttachmentCount = haccpWorkDAO.updateDocumentAttachmentStatus(attachmentUpdate);
            if (updatedAttachmentCount <= 0) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "첨부파일 상태를 완료로 갱신하지 못했습니다.");
            }

            Map<String, Object> selectParams = new HashMap<String, Object>();
            selectParams.put("tenantId", tenantId);
            selectParams.put("attachmentId", attachmentId);
            Map<String, Object> attachment = haccpWorkDAO.selectDocumentAttachmentById(selectParams);
            if (attachment != null) {
                haccpWorkFlowService.createSystemApprovalComment(
                        approvalId,
                        normalizedTenant,
                    "첨부파일 업로드",
                    resolveAttachmentFileName(attachment),
                        actorLoginCode
                );
                resultList.add(attachment);
            }
        }

        return resultList;
    }

    @Override
    public List<Map<String, Object>> listAttachments(Long approvalId, String tenantCode, String actorLoginCode) throws Exception {
        validateApprovalId(approvalId);
        String normalizedTenant = normalizeTenantCode(tenantCode);
        Long tenantId = resolveTenantId(normalizedTenant);
        Long actorLoginId = resolveActorLoginId(tenantId, actorLoginCode);
        ensureApprovalAccess(tenantId, approvalId, actorLoginId);

        Map<String, Object> params = new HashMap<String, Object>();
        params.put("tenantId", tenantId);
        params.put("approvalId", approvalId);
        return haccpWorkDAO.selectDocumentAttachmentsByApprovalId(params);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> presignDownload(
            Long approvalId,
            Long attachmentId,
            String tenantCode,
            String actorLoginCode,
            String actorIp,
            String actorUserAgent
    ) throws Exception {
        return presignReadUrl(approvalId, attachmentId, tenantCode, actorLoginCode, actorIp, actorUserAgent, "DOWNLOAD", false);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> presignPreview(
            Long approvalId,
            Long attachmentId,
            String tenantCode,
            String actorLoginCode,
            String actorIp,
            String actorUserAgent
    ) throws Exception {
        return presignReadUrl(approvalId, attachmentId, tenantCode, actorLoginCode, actorIp, actorUserAgent, "PREVIEW", true);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteAttachment(Long approvalId, Long attachmentId, String tenantCode, String actorLoginCode) throws Exception {
        validateApprovalId(approvalId);
        if (attachmentId == null || attachmentId.longValue() <= 0L) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "첨부파일 ID가 올바르지 않습니다.");
        }

        String normalizedTenant = normalizeTenantCode(tenantCode);
        Long tenantId = resolveTenantId(normalizedTenant);
        Long actorLoginId = resolveActorLoginId(tenantId, actorLoginCode);
        ensureApprovalAccess(tenantId, approvalId, actorLoginId);

        Map<String, Object> attachment = selectAttachment(tenantId, approvalId, attachmentId);

        Map<String, Object> deleteParams = new HashMap<String, Object>();
        deleteParams.put("tenantId", tenantId);
        deleteParams.put("attachmentId", attachmentId);
        deleteParams.put("updatedBy", actorLoginId);
        int updated = haccpWorkDAO.softDeleteDocumentAttachment(deleteParams);
        if (updated <= 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "삭제할 첨부파일을 찾을 수 없습니다.");
        }

        haccpWorkFlowService.createSystemApprovalComment(
            approvalId,
            normalizedTenant,
            "첨부파일 삭제",
            resolveAttachmentFileName(attachment),
            actorLoginCode
        );

        String bucketName = resolveBucketName(asString(attachment.get("bucketName")));
        String objectKey = String.valueOf(attachment.get("objectKey"));
        try {
            storageClient.deleteObject(bucketName, objectKey);
        } catch (Exception storageError) {
            // Keep logical deletion successful even when storage cleanup fails.
            log.warn("첨부파일 스토리지 삭제 실패: tenantId={}, approvalId={}, attachmentId={}, bucket={}, objectKey={}",
                    tenantId, approvalId, attachmentId, bucketName, objectKey, storageError);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public int copyAttachmentsFromApproval(
            Long targetApprovalId,
            Long sourceApprovalId,
            String tenantCode,
            String actorLoginCode
    ) throws Exception {
        validateApprovalId(targetApprovalId);
        validateApprovalId(sourceApprovalId);
        if (targetApprovalId.equals(sourceApprovalId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "같은 문서의 첨부파일은 복사할 수 없습니다.");
        }

        String normalizedTenant = normalizeTenantCode(tenantCode);
        Long tenantId = resolveTenantId(normalizedTenant);
        Long actorLoginId = resolveActorLoginId(tenantId, actorLoginCode);
        ensureApprovalAccess(tenantId, sourceApprovalId, actorLoginId);
        ensureApprovalAccess(tenantId, targetApprovalId, actorLoginId);

        Map<String, Object> sourceMain = selectApprovalMain(tenantId, sourceApprovalId);
        Map<String, Object> targetMain = selectApprovalMain(tenantId, targetApprovalId);
        Long sourceWorkId = getLongIgnoreCase(sourceMain, "draftingWorkCategoryId");
        if (!actorLoginId.equals(getLongIgnoreCase(sourceMain, "loginId"))
                || !actorLoginId.equals(getLongIgnoreCase(targetMain, "loginId"))
                || sourceWorkId == null
                || !sourceWorkId.equals(getLongIgnoreCase(targetMain, "draftingWorkCategoryId"))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인이 기안한 같은 업무 문서끼리만 첨부파일을 복사할 수 있습니다.");
        }
        String sourceStatus = trimToEmpty(asString(getValueIgnoreCase(sourceMain, "statusType"))).toLowerCase(Locale.ROOT);
        if (!"rejected".equals(sourceStatus)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "반려된 문서의 첨부파일만 복사할 수 있습니다.");
        }

        Map<String, Object> listParams = new HashMap<String, Object>();
        listParams.put("tenantId", tenantId);
        listParams.put("approvalId", sourceApprovalId);
        List<Map<String, Object>> sourceAttachments = haccpWorkDAO.selectDocumentAttachmentsByApprovalId(listParams);

        LocalDateTime now = LocalDateTime.now();
        int copiedCount = 0;
        for (Map<String, Object> source : sourceAttachments) {
            if (!"COMPLETED".equalsIgnoreCase(trimToEmpty(asString(source.get("uploadStatus"))))) {
                continue;
            }

            String fileName = resolveAttachmentFileName(source);
            String bucketName = resolveBucketName(asString(source.get("bucketName")));
            String objectKey = buildObjectKey(normalizedTenant, targetApprovalId, fileName, now);
            // ponytail: 오브젝트 복사 후 DB 롤백되면 복사본이 고아로 남음, 문제되면 정리 스케줄러에서 키 대조
            storageClient.copyObject(bucketName, asString(source.get("objectKey")), bucketName, objectKey);

            Map<String, Object> attachmentParams = new HashMap<String, Object>();
            attachmentParams.put("tenantId", tenantId);
            attachmentParams.put("approvalId", targetApprovalId);
            attachmentParams.put("objectKey", objectKey);
            attachmentParams.put("originalFileName", fileName);
            attachmentParams.put("fileExt", extractExtension(fileName));
            attachmentParams.put("contentType", trimToEmpty(asString(source.get("contentType"))));
            attachmentParams.put("fileSize", source.get("fileSize"));
            attachmentParams.put("checksumSha256", trimToNull(asString(source.get("checksumSha256"))));
            attachmentParams.put("uploadStatus", "COMPLETED");
            attachmentParams.put("previewableYn", isPreviewableContentType(asString(source.get("contentType"))) ? "Y" : "N");
            attachmentParams.put("storageProvider", "MINIO");
            attachmentParams.put("bucketName", bucketName);
            attachmentParams.put("createdBy", actorLoginId);
            haccpWorkDAO.insertDocumentAttachment(attachmentParams);

            haccpWorkFlowService.createSystemApprovalComment(
                    targetApprovalId,
                    normalizedTenant,
                    "첨부파일 승계",
                    fileName,
                    actorLoginCode
            );
            copiedCount++;
        }
        return copiedCount;
    }

    private Map<String, Object> selectApprovalMain(Long tenantId, Long approvalId) throws Exception {
        Map<String, Object> params = new HashMap<String, Object>();
        params.put("tenantId", tenantId);
        params.put("approvalId", approvalId);
        Map<String, Object> main = haccpWorkDAO.selectApprovalMainById(params);
        if (main == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "결재 문서를 찾을 수 없습니다.");
        }
        return main;
    }

    private static Object getValueIgnoreCase(Map<String, Object> row, String key) {
        if (row == null) {
            return null;
        }
        if (row.containsKey(key)) {
            return row.get(key);
        }
        for (Map.Entry<String, Object> entry : row.entrySet()) {
            if (key.equalsIgnoreCase(entry.getKey())) {
                return entry.getValue();
            }
        }
        return null;
    }

    private static Long getLongIgnoreCase(Map<String, Object> row, String key) {
        Map<String, Object> single = new HashMap<String, Object>();
        single.put(key, getValueIgnoreCase(row, key));
        return getLong(single, key);
    }

    private Map<String, Object> presignReadUrl(
            Long approvalId,
            Long attachmentId,
            String tenantCode,
            String actorLoginCode,
            String actorIp,
            String actorUserAgent,
            String actionType,
            boolean previewOnly
    ) throws Exception {
        validateApprovalId(approvalId);
        if (attachmentId == null || attachmentId.longValue() <= 0L) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "첨부파일 ID가 올바르지 않습니다.");
        }

        String normalizedTenant = normalizeTenantCode(tenantCode);
        Long tenantId = resolveTenantId(normalizedTenant);
        Long actorLoginId = resolveActorLoginId(tenantId, actorLoginCode);
        ensureApprovalAccess(tenantId, approvalId, actorLoginId);

        Map<String, Object> attachment = selectAttachment(tenantId, approvalId, attachmentId);
        String contentType = trimToEmpty((String) attachment.get("contentType")).toLowerCase(Locale.ROOT);
        if (previewOnly && !isPreviewableContentType(contentType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "미리보기 가능한 파일 형식이 아닙니다.");
        }

        String bucketName = resolveBucketName(asString(attachment.get("bucketName")));
        String objectKey = String.valueOf(attachment.get("objectKey"));

        StorageClient.PresignedDownloadResult presigned = storageClient.presignDownload(
                new StorageClient.PresignedDownloadRequest(bucketName, objectKey, DOWNLOAD_EXPIRY)
        );

        Map<String, Object> auditParams = new HashMap<String, Object>();
        auditParams.put("tenantId", tenantId);
        auditParams.put("attachmentId", attachmentId);
        auditParams.put("approvalId", approvalId);
        auditParams.put("actionType", actionType);
        auditParams.put("actorLoginId", actorLoginId);
        auditParams.put("actorIp", trimToNull(actorIp));
        auditParams.put("actorUserAgent", trimToNull(actorUserAgent));
        auditParams.put("detailText", objectKey);
        haccpWorkDAO.insertDocumentAttachmentAuditLog(auditParams);

        Map<String, Object> result = new HashMap<String, Object>();
        if (previewOnly) {
            result.put("previewUrl", presigned.getUrl());
        } else {
            result.put("downloadUrl", presigned.getUrl());
        }
        result.put("expiresAt", LocalDateTime.now().plusSeconds(presigned.getExpiresInSeconds()).toString());
        return result;
    }

    private Map<String, Object> selectAttachment(Long tenantId, Long approvalId, Long attachmentId) throws Exception {
        Map<String, Object> selectParams = new HashMap<String, Object>();
        selectParams.put("tenantId", tenantId);
        selectParams.put("attachmentId", attachmentId);
        Map<String, Object> attachment = haccpWorkDAO.selectDocumentAttachmentById(selectParams);
        if (attachment == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "첨부파일을 찾을 수 없습니다.");
        }

        Long attachmentApprovalId = getLong(attachment, "approvalId");
        if (attachmentApprovalId == null || !approvalId.equals(attachmentApprovalId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "다른 결재 문서의 첨부파일에는 접근할 수 없습니다.");
        }
        return attachment;
    }

    private void ensureApprovalAccess(Long tenantId, Long approvalId, Long actorLoginId) throws Exception {
        if (tenantId == null || approvalId == null || actorLoginId == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "해당 결재 문서 접근 권한이 없습니다.");
        }

        Map<String, Object> accessParams = new HashMap<String, Object>();
        accessParams.put("tenantId", tenantId);
        accessParams.put("approvalId", approvalId);
        accessParams.put("actorLoginId", actorLoginId);

        Integer accessCount = haccpWorkDAO.selectApprovalTemplateAccessCount(accessParams);
        if (accessCount == null || accessCount.intValue() <= 0) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "해당 결재 문서 접근 권한이 없습니다.");
        }
    }

    private String buildObjectKey(String tenantCode, Long approvalId, String fileName, LocalDateTime now) {
        String yyyy = now.format(DateTimeFormatter.ofPattern("yyyy"));
        String mm = now.format(DateTimeFormatter.ofPattern("MM"));
        String safeFileName = sanitizeFileName(fileName);
        return "tenants/" + tenantCode + "/approvals/" + approvalId + "/" + yyyy + "/" + mm + "/" + UUID.randomUUID().toString() + "_" + safeFileName;
    }

    private String sanitizeFileName(String fileName) {
        String normalized = trimToEmpty(fileName);
        if (!StringUtils.hasText(normalized)) {
            return "file";
        }

        String replaced = normalized.replaceAll("[^A-Za-z0-9._-]", "_");
        return replaced.isEmpty() ? "file" : replaced;
    }

    private String extractExtension(String fileName) {
        String normalized = trimToEmpty(fileName);
        int lastDot = normalized.lastIndexOf('.');
        if (lastDot <= 0 || lastDot >= normalized.length() - 1) {
            return "bin";
        }
        return normalized.substring(lastDot + 1).toLowerCase(Locale.ROOT);
    }

    private boolean isPreviewableContentType(String contentType) {
        String value = trimToEmpty(contentType).toLowerCase(Locale.ROOT);
        return value.startsWith("image/") || "application/pdf".equals(value);
    }

    private void validateApprovalId(Long approvalId) {
        if (approvalId == null || approvalId.longValue() <= 0L) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "결재 문서 ID가 올바르지 않습니다.");
        }
    }

    private String normalizeTenantCode(String tenantCode) {
        if (!StringUtils.hasText(tenantCode)) {
            return DEFAULT_TENANT;
        }
        return tenantCode.trim().toUpperCase(Locale.ROOT);
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
        Long actorLoginId = haccpWorkDAO.selectLoginIdByTenantAndLoginCode(params);
        if (actorLoginId != null) {
            return actorLoginId;
        }

        try {
            return Long.valueOf(actorLoginCode.trim());
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private String resolveBucketName() {
        return resolveBucketName(null);
    }

    private String resolveBucketName(String bucketName) {
        if (StringUtils.hasText(bucketName)) {
            return bucketName.trim();
        }
        if (storageProperties != null && StringUtils.hasText(storageProperties.getBucket())) {
            return storageProperties.getBucket().trim();
        }
        return DEFAULT_BUCKET;
    }

    private String resolveAttachmentFileName(Map<String, Object> attachment) {
        String fileName = "";
        if (attachment != null) {
            fileName = trimToEmpty(asString(attachment.get("originalFileName")));
            if (!StringUtils.hasText(fileName)) {
                fileName = trimToEmpty(asString(attachment.get("fileName")));
            }
        }
        if (!StringUtils.hasText(fileName)) {
            fileName = "파일명 없음";
        }

        return fileName;
    }

    private static String asString(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private static Long getLong(Map<String, Object> row, String key) {
        if (row == null) {
            return null;
        }
        Object value = row.get(key);
        if (value == null) {
            return null;
        }
        if (value instanceof Number) {
            return ((Number) value).longValue();
        }
        try {
            return Long.valueOf(String.valueOf(value));
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private static LocalDateTime toLocalDateTime(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Timestamp) {
            return ((Timestamp) value).toLocalDateTime();
        }
        if (value instanceof LocalDateTime) {
            return (LocalDateTime) value;
        }
        return null;
    }

    private static String trimToEmpty(String value) {
        return value == null ? "" : value.trim();
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
