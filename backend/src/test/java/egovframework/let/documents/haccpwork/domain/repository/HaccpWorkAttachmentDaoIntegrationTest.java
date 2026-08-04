package egovframework.let.documents.haccpwork.domain.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.FileSystemResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;

import javax.sql.DataSource;

import egovframework.EgovBootApplication;

@SpringBootTest(classes = EgovBootApplication.class)
class HaccpWorkAttachmentDaoIntegrationTest {

    private static final long TEST_TENANT_ID = 1L;
    private static final long TEST_APPROVAL_ID = 100L;
    private static final long TEST_CREATED_BY = 1L;

    @Autowired
    private HaccpWorkDAO haccpWorkDAO;

    @Autowired
    private DataSource dataSource;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void applyAttachmentMigration() {
        ResourceDatabasePopulator populator = new ResourceDatabasePopulator();
        populator.addScript(new FileSystemResource("DATABASE/migrate_postgresql_add_document_attachment_tables.sql"));
        populator.execute(dataSource);
        cleanAttachmentTables();
    }

    @AfterEach
    void cleanupAttachmentTables() {
        cleanAttachmentTables();
    }

    private void cleanAttachmentTables() {
        jdbcTemplate.execute(
                "TRUNCATE TABLE tb_document_attachment_audit_log, tb_document_attachment_upload_session, tb_document_attachment RESTART IDENTITY");
    }

    private String repeatChar(char ch, int count) {
        StringBuilder builder = new StringBuilder(count);
        for (int i = 0; i < count; i++) {
            builder.append(ch);
        }
        return builder.toString();
    }

    @Test
    void insertAndSelectAttachment_shouldPersistMetadata() throws Exception {
        String objectKey = "tenants/PLATFORM/approvals/100/2026/08/" + UUID.randomUUID().toString() + "_a.pdf";
        String checksumSha256 = repeatChar('a', 64);

        Map<String, Object> params = new HashMap<String, Object>();
        params.put("tenantId", TEST_TENANT_ID);
        params.put("approvalId", TEST_APPROVAL_ID);
        params.put("objectKey", objectKey);
        params.put("originalFileName", "a.pdf");
        params.put("fileExt", "pdf");
        params.put("contentType", "application/pdf");
        params.put("fileSize", 1234L);
        params.put("checksumSha256", checksumSha256);
        params.put("uploadStatus", "COMPLETED");
        params.put("previewableYn", "Y");
        params.put("createdBy", TEST_CREATED_BY);

        haccpWorkDAO.insertDocumentAttachment(params);
        List<Map<String, Object>> list = haccpWorkDAO.selectDocumentAttachmentsByApprovalId(params);

        assertThat(params.get("attachmentId")).isNotNull();
        assertThat(list).hasSize(1);

        Map<String, Object> attachment = list.get(0);
        assertThat(attachment.get("tenantId")).isEqualTo(TEST_TENANT_ID);
        assertThat(attachment.get("approvalId")).isEqualTo(TEST_APPROVAL_ID);
        assertThat(attachment.get("objectKey")).isEqualTo(objectKey);
        assertThat(attachment.get("originalFileName")).isEqualTo("a.pdf");
        assertThat(attachment.get("fileExt")).isEqualTo("pdf");
        assertThat(attachment.get("contentType")).isEqualTo("application/pdf");
        assertThat(((Number) attachment.get("fileSize")).longValue()).isEqualTo(1234L);
        assertThat(attachment.get("checksumSha256")).isEqualTo(checksumSha256);
        assertThat(attachment.get("uploadStatus")).isEqualTo("COMPLETED");
        assertThat(attachment.get("previewableYn")).isEqualTo("Y");
        assertThat(attachment.get("storageProvider")).isEqualTo("MINIO");
        assertThat(attachment.get("bucketName")).isEqualTo("haccp-attachments");
        assertThat(attachment.get("createdBy")).isEqualTo(TEST_CREATED_BY);
        assertThat(attachment.get("attachmentId")).isNotNull();
        assertThat(attachment.get("createdAt")).isNotNull();
        assertThat(attachment.get("updatedAt")).isNotNull();
    }

    @Test
    void selectDocumentAttachmentById_shouldExcludeSoftDeletedRow() throws Exception {
        Map<String, Object> inserted = insertAttachment("deleted-target.pdf", "deleted-checksum");
        Long attachmentId = ((Number) inserted.get("attachmentId")).longValue();

        jdbcTemplate.update(
                "UPDATE tb_document_attachment SET deleted_yn = 'Y' WHERE tenant_id = ? AND attachment_id = ?",
                TEST_TENANT_ID,
                attachmentId);

        Map<String, Object> selectParams = new HashMap<String, Object>();
        selectParams.put("tenantId", TEST_TENANT_ID);
        selectParams.put("attachmentId", attachmentId);

        Map<String, Object> item = haccpWorkDAO.selectDocumentAttachmentById(selectParams);
        List<Map<String, Object>> list = haccpWorkDAO.selectDocumentAttachmentsByApprovalId(new HashMap<String, Object>() {
            private static final long serialVersionUID = 1L;
            {
                put("tenantId", TEST_TENANT_ID);
                put("approvalId", TEST_APPROVAL_ID);
            }
        });

        assertThat(item).isNull();
        assertThat(list).isEmpty();
    }

    @Test
    void updateDocumentAttachmentStatus_shouldKeepChecksumWhenNullProvided() throws Exception {
        Map<String, Object> inserted = insertAttachment("checksum-keep.pdf", "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
        Long attachmentId = ((Number) inserted.get("attachmentId")).longValue();

        Map<String, Object> updateParams = new HashMap<String, Object>();
        updateParams.put("tenantId", TEST_TENANT_ID);
        updateParams.put("attachmentId", attachmentId);
        updateParams.put("uploadStatus", "COMPLETED");
        updateParams.put("checksumSha256", null);
        updateParams.put("updatedBy", TEST_CREATED_BY);

        int updatedCount = haccpWorkDAO.updateDocumentAttachmentStatus(updateParams);

        Map<String, Object> selectParams = new HashMap<String, Object>();
        selectParams.put("tenantId", TEST_TENANT_ID);
        selectParams.put("attachmentId", attachmentId);
        Map<String, Object> item = haccpWorkDAO.selectDocumentAttachmentById(selectParams);

        assertThat(updatedCount).isEqualTo(1);
        assertThat(item).isNotNull();
        assertThat(item.get("checksumSha256")).isEqualTo(inserted.get("checksumSha256"));
    }

    @Test
    void updateUploadSessionStatus_shouldRespectExpectedStatusAndExpiryGuards() throws Exception {
        Map<String, Object> inserted = insertAttachment("session-guard.pdf", "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc");
        Long attachmentId = ((Number) inserted.get("attachmentId")).longValue();

        String uploadToken = "token-" + UUID.randomUUID().toString();
        Map<String, Object> sessionParams = new HashMap<String, Object>();
        sessionParams.put("tenantId", TEST_TENANT_ID);
        sessionParams.put("approvalId", TEST_APPROVAL_ID);
        sessionParams.put("attachmentId", attachmentId);
        sessionParams.put("uploadToken", uploadToken);
        sessionParams.put("objectKey", inserted.get("objectKey"));
        sessionParams.put("expectedFileName", "session-guard.pdf");
        sessionParams.put("expectedContentType", "application/pdf");
        sessionParams.put("expectedFileSize", 1234L);
        sessionParams.put("sessionStatus", "ISSUED");
        sessionParams.put("expiresAt", Timestamp.valueOf(LocalDateTime.now().plusMinutes(10)));
        sessionParams.put("completedAt", null);
        sessionParams.put("createdBy", TEST_CREATED_BY);
        haccpWorkDAO.insertDocumentAttachmentUploadSession(sessionParams);

        Map<String, Object> wrongStatusUpdate = new HashMap<String, Object>();
        wrongStatusUpdate.put("tenantId", TEST_TENANT_ID);
        wrongStatusUpdate.put("uploadToken", uploadToken);
        wrongStatusUpdate.put("sessionStatus", "COMPLETED");
        wrongStatusUpdate.put("attachmentId", attachmentId);
        wrongStatusUpdate.put("completedAt", Timestamp.valueOf(LocalDateTime.now()));
        wrongStatusUpdate.put("updatedBy", TEST_CREATED_BY);
        wrongStatusUpdate.put("expectedSessionStatus", "COMPLETED");
        wrongStatusUpdate.put("requireNotExpired", Boolean.TRUE);

        int mismatchUpdated = haccpWorkDAO.updateDocumentAttachmentUploadSessionStatus(wrongStatusUpdate);

        Map<String, Object> validUpdate = new HashMap<String, Object>(wrongStatusUpdate);
        validUpdate.put("expectedSessionStatus", "ISSUED");
        int validUpdated = haccpWorkDAO.updateDocumentAttachmentUploadSessionStatus(validUpdate);

        jdbcTemplate.update(
                "UPDATE tb_document_attachment_upload_session SET session_status = 'ISSUED', expires_at = NOW() - INTERVAL '1 minute' WHERE tenant_id = ? AND upload_token = ?",
                TEST_TENANT_ID,
                uploadToken);

        int expiredUpdated = haccpWorkDAO.updateDocumentAttachmentUploadSessionStatus(validUpdate);

        assertThat(mismatchUpdated).isEqualTo(0);
        assertThat(validUpdated).isEqualTo(1);
        assertThat(expiredUpdated).isEqualTo(0);
    }

    private Map<String, Object> insertAttachment(String originalFileName, String checksumSha256) throws Exception {
        String objectKey = "tenants/PLATFORM/approvals/100/2026/08/" + UUID.randomUUID().toString() + "_" + originalFileName;

        Map<String, Object> params = new HashMap<String, Object>();
        params.put("tenantId", TEST_TENANT_ID);
        params.put("approvalId", TEST_APPROVAL_ID);
        params.put("objectKey", objectKey);
        params.put("originalFileName", originalFileName);
        params.put("fileExt", "pdf");
        params.put("contentType", "application/pdf");
        params.put("fileSize", 1234L);
        params.put("checksumSha256", checksumSha256);
        params.put("uploadStatus", "COMPLETED");
        params.put("previewableYn", "Y");
        params.put("createdBy", TEST_CREATED_BY);

        haccpWorkDAO.insertDocumentAttachment(params);
        return params;
    }
}
