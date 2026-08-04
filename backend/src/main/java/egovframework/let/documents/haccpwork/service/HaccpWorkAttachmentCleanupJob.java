package egovframework.let.documents.haccpwork.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

import egovframework.let.documents.haccpwork.domain.repository.HaccpWorkDAO;
import egovframework.let.storage.StorageClient;
import egovframework.let.storage.StorageProperties;

@Component("haccpWorkAttachmentCleanupJob")
public class HaccpWorkAttachmentCleanupJob {

    private final HaccpWorkDAO haccpWorkDAO;
    private final StorageClient storageClient;
    private final StorageProperties storageProperties;

    public HaccpWorkAttachmentCleanupJob(HaccpWorkDAO haccpWorkDAO, StorageClient storageClient,
            StorageProperties storageProperties) {
        this.haccpWorkDAO = haccpWorkDAO;
        this.storageClient = storageClient;
        this.storageProperties = storageProperties;
    }

    public void executeInterface() throws Exception {
        Map<String, Object> params = new HashMap<String, Object>();
        params.put("bucketName", storageProperties.getBucket());
        List<Map<String, Object>> expiredSessions = haccpWorkDAO.selectExpiredUploadSessions(params);

        for (Map<String, Object> row : expiredSessions) {
            String objectKey = row.get("objectKey") == null ? null : String.valueOf(row.get("objectKey"));
            String bucketName = row.get("bucketName") == null ? storageProperties.getBucket() : String.valueOf(row.get("bucketName"));
            if (objectKey != null) {
                storageClient.deleteObject(bucketName, objectKey);
            }

            Map<String, Object> cleanupParams = new HashMap<String, Object>();
            cleanupParams.put("tenantId", row.get("tenantId"));
            cleanupParams.put("uploadToken", row.get("uploadToken"));
            cleanupParams.put("attachmentId", row.get("attachmentId"));
            cleanupParams.put("updatedBy", row.get("updatedBy"));
            haccpWorkDAO.markUploadSessionCleaned(cleanupParams);
            haccpWorkDAO.markAttachmentAbandoned(cleanupParams);
        }
    }
}
