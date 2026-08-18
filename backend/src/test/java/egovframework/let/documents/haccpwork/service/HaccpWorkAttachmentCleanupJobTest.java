package egovframework.let.documents.haccpwork.service;

import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.Test;

import egovframework.let.documents.haccpwork.domain.repository.HaccpWorkDAO;
import egovframework.let.storage.StorageClient;
import egovframework.let.storage.StorageProperties;

class HaccpWorkAttachmentCleanupJobTest {

    @Test
    void executeInterface_shouldDeleteExpiredObjectsAndMarkSessionAsCleaned() throws Exception {
        HaccpWorkDAO haccpWorkDAO = mock(HaccpWorkDAO.class);
        StorageClient storageClient = mock(StorageClient.class);
        StorageProperties storageProperties = new StorageProperties();
        storageProperties.setBucket("haccp-attachments");

        HaccpWorkAttachmentCleanupJob job = new HaccpWorkAttachmentCleanupJob(haccpWorkDAO, storageClient, storageProperties);

        Map<String, Object> expiredRow = new HashMap<String, Object>();
        expiredRow.put("attachmentId", 42L);
        expiredRow.put("uploadToken", "token-42");
        expiredRow.put("objectKey", "tenants/PLATFORM/approvals/100/expired.pdf");
        expiredRow.put("bucketName", "haccp-attachments");
        when(haccpWorkDAO.selectExpiredUploadSessions(anyMap())).thenReturn(Collections.singletonList(expiredRow));

        job.executeInterface();

        verify(storageClient).deleteObject(anyString(), anyString());
        verify(haccpWorkDAO).markUploadSessionCleaned(anyMap());
        verify(haccpWorkDAO).markAttachmentAbandoned(anyMap());
    }
}
