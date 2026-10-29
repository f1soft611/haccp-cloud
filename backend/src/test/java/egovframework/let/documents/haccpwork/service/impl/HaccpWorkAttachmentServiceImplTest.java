package egovframework.let.documents.haccpwork.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.startsWith;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import egovframework.let.documents.haccpwork.domain.model.HaccpAttachmentCompleteRequestVO;
import egovframework.let.documents.haccpwork.domain.model.HaccpAttachmentUploadRequestVO;
import egovframework.let.documents.haccpwork.domain.repository.HaccpWorkDAO;
import egovframework.let.documents.haccpwork.service.HaccpWorkFlowService;
import egovframework.let.storage.StorageClient;
import egovframework.let.storage.StorageProperties;

class HaccpWorkAttachmentServiceImplTest {

    @Test
    void presignUpload_shouldFailWhenNoApprovalAccess() throws Exception {
        HaccpWorkDAO haccpWorkDAO = mock(HaccpWorkDAO.class);
        StorageClient storageClient = mock(StorageClient.class);
        HaccpWorkFlowService haccpWorkFlowService = mock(HaccpWorkFlowService.class);
        StorageProperties storageProperties = new StorageProperties();
        storageProperties.setBucket("haccp-attachments");
        HaccpWorkAttachmentServiceImpl service = new HaccpWorkAttachmentServiceImpl(haccpWorkDAO, storageClient, storageProperties, haccpWorkFlowService);

        when(haccpWorkDAO.selectTenantIdByCode("PLATFORM")).thenReturn(1L);
        when(haccpWorkDAO.selectLoginIdByTenantAndLoginCode(anyMap())).thenReturn(1001L);
        when(haccpWorkDAO.selectApprovalTemplateAccessCount(anyMap())).thenReturn(0);

        HaccpAttachmentUploadRequestVO request = new HaccpAttachmentUploadRequestVO();
        request.setFileName("a.pdf");
        request.setContentType("application/pdf");
        request.setFileSize(123L);

        assertThatThrownBy(() -> service.presignUpload(
                100L,
                "platform",
                Collections.singletonList(request),
                "platform_admin",
                "127.0.0.1",
                "JUnit"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting("status")
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void presignDownload_shouldWriteAuditLog() throws Exception {
        HaccpWorkDAO haccpWorkDAO = mock(HaccpWorkDAO.class);
        StorageClient storageClient = mock(StorageClient.class);
        HaccpWorkFlowService haccpWorkFlowService = mock(HaccpWorkFlowService.class);
        StorageProperties storageProperties = new StorageProperties();
        storageProperties.setBucket("haccp-attachments");
        HaccpWorkAttachmentServiceImpl service = new HaccpWorkAttachmentServiceImpl(haccpWorkDAO, storageClient, storageProperties, haccpWorkFlowService);

        when(haccpWorkDAO.selectTenantIdByCode("PLATFORM")).thenReturn(1L);
        when(haccpWorkDAO.selectLoginIdByTenantAndLoginCode(anyMap())).thenReturn(1001L);
        when(haccpWorkDAO.selectApprovalTemplateAccessCount(anyMap())).thenReturn(1);

        Map<String, Object> attachment = new HashMap<String, Object>();
        attachment.put("attachmentId", 77L);
        attachment.put("approvalId", 100L);
        attachment.put("objectKey", "tenants/PLATFORM/approvals/100/2026/08/a.pdf");
        attachment.put("bucketName", "haccp-attachments");
        attachment.put("contentType", "application/pdf");
        when(haccpWorkDAO.selectDocumentAttachmentById(anyMap())).thenReturn(attachment);

        when(storageClient.presignDownload(org.mockito.ArgumentMatchers.any(StorageClient.PresignedDownloadRequest.class)))
                .thenReturn(new StorageClient.PresignedDownloadResult("https://example/download", "GET", 60));

        Map<String, Object> result = service.presignDownload(
                100L,
                77L,
                "platform",
                "platform_admin",
                "127.0.0.1",
                "JUnit");

        assertThat(result.get("downloadUrl")).isEqualTo("https://example/download");
        verify(haccpWorkDAO).insertDocumentAttachmentAuditLog(anyMap());
    }

    @Test
    void completeUpload_shouldPersistCompletedAttachment() throws Exception {
        HaccpWorkDAO haccpWorkDAO = mock(HaccpWorkDAO.class);
        StorageClient storageClient = mock(StorageClient.class);
        HaccpWorkFlowService haccpWorkFlowService = mock(HaccpWorkFlowService.class);
        StorageProperties storageProperties = new StorageProperties();
        storageProperties.setBucket("haccp-attachments");
        HaccpWorkAttachmentServiceImpl service = new HaccpWorkAttachmentServiceImpl(haccpWorkDAO, storageClient, storageProperties, haccpWorkFlowService);

        when(haccpWorkDAO.selectTenantIdByCode("PLATFORM")).thenReturn(1L);
        when(haccpWorkDAO.selectLoginIdByTenantAndLoginCode(anyMap())).thenReturn(1001L);
        when(haccpWorkDAO.selectApprovalTemplateAccessCount(anyMap())).thenReturn(1);

        HaccpAttachmentUploadRequestVO uploadRequest = new HaccpAttachmentUploadRequestVO();
        uploadRequest.setFileName("a.pdf");
        uploadRequest.setContentType("application/pdf");
        uploadRequest.setFileSize(123L);

        doAnswer(invocation -> {
            @SuppressWarnings("unchecked")
            Map<String, Object> params = (Map<String, Object>) invocation.getArgument(0);
            params.put("attachmentId", 88L);
            return null;
        }).when(haccpWorkDAO).insertDocumentAttachment(anyMap());

        when(storageClient.presignUpload(org.mockito.ArgumentMatchers.any(StorageClient.PresignedUploadRequest.class)))
                .thenReturn(new StorageClient.PresignedUploadResult("https://example/upload", "PUT", 600));

        Map<String, Object> issued = service.presignUpload(
                100L,
                "platform",
                Collections.singletonList(uploadRequest),
                "platform_admin",
                "127.0.0.1",
                "JUnit");

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> issuedItems = (List<Map<String, Object>>) issued.get("items");
        Map<String, Object> firstIssued = issuedItems.get(0);

        Map<String, Object> session = new HashMap<String, Object>();
        session.put("uploadToken", firstIssued.get("uploadToken"));
        session.put("objectKey", firstIssued.get("objectKey"));
        session.put("attachmentId", 88L);
        session.put("approvalId", 100L);
        session.put("sessionStatus", "ISSUED");
        session.put("expiresAt", java.sql.Timestamp.valueOf(LocalDateTime.now().plusMinutes(3)));
        when(haccpWorkDAO.selectDocumentAttachmentUploadSessionByToken(anyMap())).thenReturn(session);

        Map<String, Object> attachmentBefore = new HashMap<String, Object>();
        attachmentBefore.put("attachmentId", 88L);
        attachmentBefore.put("approvalId", 100L);
        attachmentBefore.put("contentType", "application/pdf");
        attachmentBefore.put("bucketName", "haccp-attachments");
        attachmentBefore.put("objectKey", String.valueOf(firstIssued.get("objectKey")));

        when(storageClient.statObject(eq("haccp-attachments"), eq(String.valueOf(firstIssued.get("objectKey")))))
                .thenReturn(new StorageClient.ObjectStat(123L, "etag", Instant.now(), "application/pdf"));

        Map<String, Object> completedAttachment = new HashMap<String, Object>();
        completedAttachment.put("attachmentId", 88L);
        completedAttachment.put("approvalId", 100L);
        completedAttachment.put("contentType", "application/pdf");
        completedAttachment.put("fileSize", 123L);
        completedAttachment.put("uploadStatus", "COMPLETED");
        when(haccpWorkDAO.selectDocumentAttachmentById(anyMap())).thenReturn(attachmentBefore, completedAttachment);
        when(haccpWorkDAO.updateDocumentAttachmentUploadSessionStatus(anyMap())).thenReturn(1);
        when(haccpWorkDAO.updateDocumentAttachmentStatus(anyMap())).thenReturn(1);

        HaccpAttachmentCompleteRequestVO completeRequest = new HaccpAttachmentCompleteRequestVO();
        completeRequest.setUploadToken(String.valueOf(firstIssued.get("uploadToken")));
        completeRequest.setObjectKey(String.valueOf(firstIssued.get("objectKey")));
        completeRequest.setFileName("a.pdf");
        completeRequest.setContentType("application/pdf");
        completeRequest.setFileSize(123L);

        List<Map<String, Object>> result = service.completeUpload(
                100L,
                "platform",
                Collections.singletonList(completeRequest),
                "platform_admin");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).get("attachmentId")).isEqualTo(88L);
        verify(haccpWorkDAO).updateDocumentAttachmentUploadSessionStatus(anyMap());
    }

    @Test
    void completeUpload_shouldAppendApprovalHistoryComment() throws Exception {
        HaccpWorkDAO haccpWorkDAO = mock(HaccpWorkDAO.class);
        StorageClient storageClient = mock(StorageClient.class);
        HaccpWorkFlowService haccpWorkFlowService = mock(HaccpWorkFlowService.class);
        StorageProperties storageProperties = new StorageProperties();
        storageProperties.setBucket("haccp-attachments");
        HaccpWorkAttachmentServiceImpl service = new HaccpWorkAttachmentServiceImpl(haccpWorkDAO, storageClient, storageProperties, haccpWorkFlowService);

        when(haccpWorkDAO.selectTenantIdByCode("PLATFORM")).thenReturn(1L);
        when(haccpWorkDAO.selectLoginIdByTenantAndLoginCode(anyMap())).thenReturn(1001L);
        when(haccpWorkDAO.selectApprovalTemplateAccessCount(anyMap())).thenReturn(1);

        HaccpAttachmentUploadRequestVO uploadRequest = new HaccpAttachmentUploadRequestVO();
        uploadRequest.setFileName("a.pdf");
        uploadRequest.setContentType("application/pdf");
        uploadRequest.setFileSize(123L);

        doAnswer(invocation -> {
            @SuppressWarnings("unchecked")
            Map<String, Object> params = (Map<String, Object>) invocation.getArgument(0);
            params.put("attachmentId", 88L);
            return null;
        }).when(haccpWorkDAO).insertDocumentAttachment(anyMap());

        when(storageClient.presignUpload(org.mockito.ArgumentMatchers.any(StorageClient.PresignedUploadRequest.class)))
                .thenReturn(new StorageClient.PresignedUploadResult("https://example/upload", "PUT", 600));

        Map<String, Object> issued = service.presignUpload(
                100L,
                "platform",
                Collections.singletonList(uploadRequest),
                "platform_admin",
                "127.0.0.1",
                "JUnit");

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> issuedItems = (List<Map<String, Object>>) issued.get("items");
        Map<String, Object> firstIssued = issuedItems.get(0);

        Map<String, Object> session = new HashMap<String, Object>();
        session.put("uploadToken", firstIssued.get("uploadToken"));
        session.put("objectKey", firstIssued.get("objectKey"));
        session.put("attachmentId", 88L);
        session.put("approvalId", 100L);
        session.put("sessionStatus", "ISSUED");
        session.put("expiresAt", java.sql.Timestamp.valueOf(LocalDateTime.now().plusMinutes(3)));
        when(haccpWorkDAO.selectDocumentAttachmentUploadSessionByToken(anyMap())).thenReturn(session);

        Map<String, Object> attachmentBefore = new HashMap<String, Object>();
        attachmentBefore.put("attachmentId", 88L);
        attachmentBefore.put("approvalId", 100L);
        attachmentBefore.put("contentType", "application/pdf");
        attachmentBefore.put("bucketName", "haccp-attachments");
        attachmentBefore.put("objectKey", String.valueOf(firstIssued.get("objectKey")));
        attachmentBefore.put("originalFileName", "a.pdf");

        when(storageClient.statObject(eq("haccp-attachments"), eq(String.valueOf(firstIssued.get("objectKey")))))
                .thenReturn(new StorageClient.ObjectStat(123L, "etag", Instant.now(), "application/pdf"));

        Map<String, Object> completedAttachment = new HashMap<String, Object>();
        completedAttachment.put("attachmentId", 88L);
        completedAttachment.put("approvalId", 100L);
        completedAttachment.put("contentType", "application/pdf");
        completedAttachment.put("fileSize", 123L);
        completedAttachment.put("uploadStatus", "COMPLETED");
        completedAttachment.put("originalFileName", "a.pdf");
        when(haccpWorkDAO.selectDocumentAttachmentById(anyMap())).thenReturn(attachmentBefore, completedAttachment);
        when(haccpWorkDAO.updateDocumentAttachmentUploadSessionStatus(anyMap())).thenReturn(1);
        when(haccpWorkDAO.updateDocumentAttachmentStatus(anyMap())).thenReturn(1);

        HaccpAttachmentCompleteRequestVO completeRequest = new HaccpAttachmentCompleteRequestVO();
        completeRequest.setUploadToken(String.valueOf(firstIssued.get("uploadToken")));
        completeRequest.setObjectKey(String.valueOf(firstIssued.get("objectKey")));
        completeRequest.setFileName("a.pdf");
        completeRequest.setContentType("application/pdf");
        completeRequest.setFileSize(123L);

        service.completeUpload(
                100L,
                "platform",
                Collections.singletonList(completeRequest),
                "platform_admin");

        verify(haccpWorkFlowService).createSystemApprovalComment(
                100L,
                "PLATFORM",
                "첨부파일 업로드",
                "a.pdf",
                "platform_admin");
    }

    @Test
    void completeUpload_shouldAppendApprovalHistoryCommentUsingFallbackLineInfo() throws Exception {
        HaccpWorkDAO haccpWorkDAO = mock(HaccpWorkDAO.class);
        StorageClient storageClient = mock(StorageClient.class);
        HaccpWorkFlowService haccpWorkFlowService = mock(HaccpWorkFlowService.class);
        StorageProperties storageProperties = new StorageProperties();
        storageProperties.setBucket("haccp-attachments");
        HaccpWorkAttachmentServiceImpl service = new HaccpWorkAttachmentServiceImpl(haccpWorkDAO, storageClient, storageProperties, haccpWorkFlowService);

        when(haccpWorkDAO.selectTenantIdByCode("PLATFORM")).thenReturn(1L);
        when(haccpWorkDAO.selectLoginIdByTenantAndLoginCode(anyMap())).thenReturn(1001L);
        when(haccpWorkDAO.selectApprovalTemplateAccessCount(anyMap())).thenReturn(1);

        HaccpAttachmentUploadRequestVO uploadRequest = new HaccpAttachmentUploadRequestVO();
        uploadRequest.setFileName("a.pdf");
        uploadRequest.setContentType("application/pdf");
        uploadRequest.setFileSize(123L);

        doAnswer(invocation -> {
            @SuppressWarnings("unchecked")
            Map<String, Object> params = (Map<String, Object>) invocation.getArgument(0);
            params.put("attachmentId", 88L);
            return null;
        }).when(haccpWorkDAO).insertDocumentAttachment(anyMap());

        when(storageClient.presignUpload(org.mockito.ArgumentMatchers.any(StorageClient.PresignedUploadRequest.class)))
                .thenReturn(new StorageClient.PresignedUploadResult("https://example/upload", "PUT", 600));

        Map<String, Object> issued = service.presignUpload(
                100L,
                "platform",
                Collections.singletonList(uploadRequest),
                "platform_admin",
                "127.0.0.1",
                "JUnit");

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> issuedItems = (List<Map<String, Object>>) issued.get("items");
        Map<String, Object> firstIssued = issuedItems.get(0);

        Map<String, Object> session = new HashMap<String, Object>();
        session.put("uploadToken", firstIssued.get("uploadToken"));
        session.put("objectKey", firstIssued.get("objectKey"));
        session.put("attachmentId", 88L);
        session.put("approvalId", 100L);
        session.put("sessionStatus", "ISSUED");
        session.put("expiresAt", java.sql.Timestamp.valueOf(LocalDateTime.now().plusMinutes(3)));
        when(haccpWorkDAO.selectDocumentAttachmentUploadSessionByToken(anyMap())).thenReturn(session);

        Map<String, Object> attachmentBefore = new HashMap<String, Object>();
        attachmentBefore.put("attachmentId", 88L);
        attachmentBefore.put("approvalId", 100L);
        attachmentBefore.put("contentType", "application/pdf");
        attachmentBefore.put("bucketName", "haccp-attachments");
        attachmentBefore.put("objectKey", String.valueOf(firstIssued.get("objectKey")));
        attachmentBefore.put("originalFileName", "a.pdf");

        when(storageClient.statObject(eq("haccp-attachments"), eq(String.valueOf(firstIssued.get("objectKey")))))
                .thenReturn(new StorageClient.ObjectStat(123L, "etag", Instant.now(), "application/pdf"));

        Map<String, Object> completedAttachment = new HashMap<String, Object>();
        completedAttachment.put("attachmentId", 88L);
        completedAttachment.put("approvalId", 100L);
        completedAttachment.put("contentType", "application/pdf");
        completedAttachment.put("fileSize", 123L);
        completedAttachment.put("uploadStatus", "COMPLETED");
        completedAttachment.put("originalFileName", "a.pdf");
        when(haccpWorkDAO.selectDocumentAttachmentById(anyMap())).thenReturn(attachmentBefore, completedAttachment);
        when(haccpWorkDAO.updateDocumentAttachmentUploadSessionStatus(anyMap())).thenReturn(1);
        when(haccpWorkDAO.updateDocumentAttachmentStatus(anyMap())).thenReturn(1);

        HaccpAttachmentCompleteRequestVO completeRequest = new HaccpAttachmentCompleteRequestVO();
        completeRequest.setUploadToken(String.valueOf(firstIssued.get("uploadToken")));
        completeRequest.setObjectKey(String.valueOf(firstIssued.get("objectKey")));
        completeRequest.setFileName("a.pdf");
        completeRequest.setContentType("application/pdf");
        completeRequest.setFileSize(123L);

        service.completeUpload(
                100L,
                "platform",
                Collections.singletonList(completeRequest),
                "platform_admin");

        verify(haccpWorkFlowService).createSystemApprovalComment(
                100L,
                "PLATFORM",
                "첨부파일 업로드",
                "a.pdf",
                "platform_admin");
    }

    @Test
    void completeUpload_shouldFailWhenSessionStateTransitionRejected() throws Exception {
        HaccpWorkDAO haccpWorkDAO = mock(HaccpWorkDAO.class);
        StorageClient storageClient = mock(StorageClient.class);
        HaccpWorkFlowService haccpWorkFlowService = mock(HaccpWorkFlowService.class);
        StorageProperties storageProperties = new StorageProperties();
        storageProperties.setBucket("haccp-attachments");
        HaccpWorkAttachmentServiceImpl service = new HaccpWorkAttachmentServiceImpl(haccpWorkDAO, storageClient, storageProperties, haccpWorkFlowService);

        when(haccpWorkDAO.selectTenantIdByCode("PLATFORM")).thenReturn(1L);
        when(haccpWorkDAO.selectLoginIdByTenantAndLoginCode(anyMap())).thenReturn(1001L);
        when(haccpWorkDAO.selectApprovalTemplateAccessCount(anyMap())).thenReturn(1);

        Map<String, Object> session = new HashMap<String, Object>();
        session.put("uploadToken", "token-1");
        session.put("objectKey", "tenants/PLATFORM/approvals/100/2026/08/a.pdf");
        session.put("attachmentId", 88L);
        session.put("approvalId", 100L);
        session.put("sessionStatus", "ISSUED");
        session.put("expiresAt", java.sql.Timestamp.valueOf(LocalDateTime.now().plusMinutes(3)));
        when(haccpWorkDAO.selectDocumentAttachmentUploadSessionByToken(anyMap())).thenReturn(session);

        Map<String, Object> attachment = new HashMap<String, Object>();
        attachment.put("attachmentId", 88L);
        attachment.put("approvalId", 100L);
        attachment.put("contentType", "application/pdf");
        attachment.put("bucketName", "haccp-attachments");
        attachment.put("objectKey", "tenants/PLATFORM/approvals/100/2026/08/a.pdf");
        when(haccpWorkDAO.selectDocumentAttachmentById(anyMap())).thenReturn(attachment);

        when(storageClient.statObject(eq("haccp-attachments"), eq("tenants/PLATFORM/approvals/100/2026/08/a.pdf")))
                .thenReturn(new StorageClient.ObjectStat(123L, "etag", Instant.now(), "application/pdf"));
        when(haccpWorkDAO.updateDocumentAttachmentUploadSessionStatus(anyMap())).thenReturn(0);

        HaccpAttachmentCompleteRequestVO completeRequest = new HaccpAttachmentCompleteRequestVO();
        completeRequest.setUploadToken("token-1");
        completeRequest.setObjectKey("tenants/PLATFORM/approvals/100/2026/08/a.pdf");
        completeRequest.setFileName("a.pdf");
        completeRequest.setContentType("application/pdf");
        completeRequest.setFileSize(123L);

        assertThatThrownBy(() -> service.completeUpload(
                100L,
                "platform",
                Collections.singletonList(completeRequest),
                "platform_admin"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting("status")
                .isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void presignPreview_shouldRejectNonPreviewableType() throws Exception {
        HaccpWorkDAO haccpWorkDAO = mock(HaccpWorkDAO.class);
        StorageClient storageClient = mock(StorageClient.class);
        HaccpWorkFlowService haccpWorkFlowService = mock(HaccpWorkFlowService.class);
        StorageProperties storageProperties = new StorageProperties();
        storageProperties.setBucket("haccp-attachments");
        HaccpWorkAttachmentServiceImpl service = new HaccpWorkAttachmentServiceImpl(haccpWorkDAO, storageClient, storageProperties, haccpWorkFlowService);

        when(haccpWorkDAO.selectTenantIdByCode("PLATFORM")).thenReturn(1L);
        when(haccpWorkDAO.selectLoginIdByTenantAndLoginCode(anyMap())).thenReturn(1001L);
        when(haccpWorkDAO.selectApprovalTemplateAccessCount(anyMap())).thenReturn(1);

        Map<String, Object> attachment = new HashMap<String, Object>();
        attachment.put("attachmentId", 77L);
        attachment.put("approvalId", 100L);
        attachment.put("objectKey", "tenants/PLATFORM/approvals/100/2026/08/a.docx");
        attachment.put("bucketName", "haccp-attachments");
        attachment.put("contentType", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        when(haccpWorkDAO.selectDocumentAttachmentById(anyMap())).thenReturn(attachment);

        assertThatThrownBy(() -> service.presignPreview(
                100L,
                77L,
                "platform",
                "platform_admin",
                "127.0.0.1",
                "JUnit"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting("status")
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void deleteAttachment_shouldSoftDeleteAndRemoveObject() throws Exception {
        HaccpWorkDAO haccpWorkDAO = mock(HaccpWorkDAO.class);
        StorageClient storageClient = mock(StorageClient.class);
        HaccpWorkFlowService haccpWorkFlowService = mock(HaccpWorkFlowService.class);
        StorageProperties storageProperties = new StorageProperties();
        storageProperties.setBucket("haccp-attachments");
        HaccpWorkAttachmentServiceImpl service = new HaccpWorkAttachmentServiceImpl(haccpWorkDAO, storageClient, storageProperties, haccpWorkFlowService);

        when(haccpWorkDAO.selectTenantIdByCode("PLATFORM")).thenReturn(1L);
        when(haccpWorkDAO.selectLoginIdByTenantAndLoginCode(anyMap())).thenReturn(1001L);
        when(haccpWorkDAO.selectApprovalTemplateAccessCount(anyMap())).thenReturn(1);

        Map<String, Object> attachment = new HashMap<String, Object>();
        attachment.put("attachmentId", 77L);
        attachment.put("approvalId", 100L);
        attachment.put("objectKey", "tenants/PLATFORM/approvals/100/2026/08/a.pdf");
        attachment.put("bucketName", "haccp-attachments");
                attachment.put("originalFileName", "a.pdf");
        when(haccpWorkDAO.selectDocumentAttachmentById(anyMap())).thenReturn(attachment);
        when(haccpWorkDAO.softDeleteDocumentAttachment(anyMap())).thenReturn(1);

        service.deleteAttachment(100L, 77L, "platform", "platform_admin");

        verify(haccpWorkDAO).softDeleteDocumentAttachment(anyMap());
        verify(haccpWorkFlowService).createSystemApprovalComment(
                100L,
                "PLATFORM",
                "첨부파일 삭제",
                "a.pdf",
                "platform_admin");
        verify(storageClient).deleteObject("haccp-attachments", "tenants/PLATFORM/approvals/100/2026/08/a.pdf");
    }

    @Test
    void listAttachments_shouldReturnDaoRows() throws Exception {
        HaccpWorkDAO haccpWorkDAO = mock(HaccpWorkDAO.class);
        StorageClient storageClient = mock(StorageClient.class);
        HaccpWorkFlowService haccpWorkFlowService = mock(HaccpWorkFlowService.class);
        StorageProperties storageProperties = new StorageProperties();
        storageProperties.setBucket("haccp-attachments");
        HaccpWorkAttachmentServiceImpl service = new HaccpWorkAttachmentServiceImpl(haccpWorkDAO, storageClient, storageProperties, haccpWorkFlowService);

        when(haccpWorkDAO.selectTenantIdByCode("PLATFORM")).thenReturn(1L);
        when(haccpWorkDAO.selectLoginIdByTenantAndLoginCode(anyMap())).thenReturn(1001L);
        when(haccpWorkDAO.selectApprovalTemplateAccessCount(anyMap())).thenReturn(1);

        Map<String, Object> item = new HashMap<String, Object>();
        item.put("attachmentId", 77L);
        item.put("originalFileName", "a.pdf");
        when(haccpWorkDAO.selectDocumentAttachmentsByApprovalId(anyMap())).thenReturn(Arrays.asList(item));

        List<Map<String, Object>> list = service.listAttachments(100L, "platform", "platform_admin");

        assertThat(list).hasSize(1);
        assertThat(list.get(0).get("attachmentId")).isEqualTo(77L);
    }

    private HaccpWorkDAO mockCopyDao(String sourceStatus, Long sourceLoginId) throws Exception {
        HaccpWorkDAO haccpWorkDAO = mock(HaccpWorkDAO.class);
        when(haccpWorkDAO.selectTenantIdByCode("PLATFORM")).thenReturn(1L);
        when(haccpWorkDAO.selectLoginIdByTenantAndLoginCode(anyMap())).thenReturn(1001L);
        when(haccpWorkDAO.selectApprovalTemplateAccessCount(anyMap())).thenReturn(1);
        when(haccpWorkDAO.selectApprovalMainById(anyMap())).thenAnswer(invocation -> {
            @SuppressWarnings("unchecked")
            Map<String, Object> params = (Map<String, Object>) invocation.getArgument(0);
            Map<String, Object> main = new HashMap<String, Object>();
            boolean isSource = Long.valueOf(100L).equals(params.get("approvalId"));
            // PostgreSQL 은 따옴표 없는 별칭을 소문자로 돌려준다
            main.put("draftingworkcategoryid", 5L);
            main.put("loginid", isSource ? sourceLoginId : 1001L);
            main.put("statustype", isSource ? sourceStatus : "pre_apply");
            return main;
        });

        Map<String, Object> completed = new HashMap<String, Object>();
        completed.put("attachmentId", 11L);
        completed.put("approvalId", 100L);
        completed.put("objectKey", "tenants/PLATFORM/approvals/100/2026/10/uuid_a.pdf");
        completed.put("originalFileName", "a.pdf");
        completed.put("fileExt", "pdf");
        completed.put("contentType", "application/pdf");
        completed.put("fileSize", 123L);
        completed.put("uploadStatus", "COMPLETED");
        completed.put("previewableYn", "Y");
        completed.put("bucketName", "haccp-attachments");

        Map<String, Object> pending = new HashMap<String, Object>(completed);
        pending.put("attachmentId", 12L);
        pending.put("objectKey", "tenants/PLATFORM/approvals/100/2026/10/uuid_b.pdf");
        pending.put("uploadStatus", "PENDING");

        when(haccpWorkDAO.selectDocumentAttachmentsByApprovalId(anyMap()))
                .thenReturn(Arrays.asList(completed, pending));
        return haccpWorkDAO;
    }

    private HaccpWorkAttachmentServiceImpl createCopyService(HaccpWorkDAO dao, StorageClient storageClient) {
        StorageProperties storageProperties = new StorageProperties();
        storageProperties.setBucket("haccp-attachments");
        return new HaccpWorkAttachmentServiceImpl(dao, storageClient, storageProperties, mock(HaccpWorkFlowService.class));
    }

    @Test
    void copyAttachmentsFromApproval_shouldCopyCompletedAttachmentsOnly() throws Exception {
        HaccpWorkDAO haccpWorkDAO = mockCopyDao("rejected", 1001L);
        StorageClient storageClient = mock(StorageClient.class);
        HaccpWorkAttachmentServiceImpl service = createCopyService(haccpWorkDAO, storageClient);

        int copied = service.copyAttachmentsFromApproval(200L, 100L, "platform", "platform_admin");

        assertThat(copied).isEqualTo(1);
        verify(storageClient).copyObject(
                eq("haccp-attachments"),
                eq("tenants/PLATFORM/approvals/100/2026/10/uuid_a.pdf"),
                eq("haccp-attachments"),
                startsWith("tenants/PLATFORM/approvals/200/"));
        verify(haccpWorkDAO).insertDocumentAttachment(argThat(params ->
                Long.valueOf(200L).equals(params.get("approvalId"))
                        && "COMPLETED".equals(params.get("uploadStatus"))
                        && "a.pdf".equals(params.get("originalFileName"))));
    }

    @Test
    void copyAttachmentsFromApproval_shouldRejectWhenSourceIsNotRejected() throws Exception {
        HaccpWorkDAO haccpWorkDAO = mockCopyDao("in_progress", 1001L);
        StorageClient storageClient = mock(StorageClient.class);
        HaccpWorkAttachmentServiceImpl service = createCopyService(haccpWorkDAO, storageClient);

        assertThatThrownBy(() -> service.copyAttachmentsFromApproval(200L, 100L, "platform", "platform_admin"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting("status")
                .isEqualTo(HttpStatus.CONFLICT);
        verify(storageClient, never()).copyObject(anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void copyAttachmentsFromApproval_shouldRejectOtherDrafterSource() throws Exception {
        HaccpWorkDAO haccpWorkDAO = mockCopyDao("rejected", 2002L);
        StorageClient storageClient = mock(StorageClient.class);
        HaccpWorkAttachmentServiceImpl service = createCopyService(haccpWorkDAO, storageClient);

        assertThatThrownBy(() -> service.copyAttachmentsFromApproval(200L, 100L, "platform", "platform_admin"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting("status")
                .isEqualTo(HttpStatus.FORBIDDEN);
    }
}
