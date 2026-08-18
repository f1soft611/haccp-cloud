package egovframework.let.storage.minio;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.time.Instant;

import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import egovframework.let.storage.StorageClient;
import egovframework.let.storage.StorageClient.ObjectStat;
import egovframework.let.storage.StorageClient.PresignedDownloadRequest;
import egovframework.let.storage.StorageClient.PresignedDownloadResult;
import egovframework.let.storage.StorageClient.PresignedUploadRequest;
import egovframework.let.storage.StorageClient.PresignedUploadResult;
import egovframework.let.storage.StorageProperties;

class MinioStorageClientTest {

    @Test
    void presignUpload_shouldReturnPutUrlWithExpiry() throws Exception {
        StorageProperties properties = createProperties();
        MinioStorageClient.MinioOperations operations = Mockito.mock(MinioStorageClient.MinioOperations.class);
        when(operations.presign(eq("PUT"), eq("bucket"), eq("key.pdf"), eq(600), eq("application/pdf")))
                .thenReturn("http://localhost:9000/bucket/key.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256");

        StorageClient storageClient = new MinioStorageClient(properties, operations);
        PresignedUploadResult result = storageClient.presignUpload(
                new PresignedUploadRequest("bucket", "key.pdf", "application/pdf", Duration.ofMinutes(10)));

        assertThat(result.getMethod()).isEqualTo("PUT");
        assertThat(result.getExpiresInSeconds()).isEqualTo(600);
        assertThat(result.getUrl()).contains("X-Amz-Algorithm");
    }

    @Test
    void presignDownload_shouldReturnGetUrlWithExpiry() throws Exception {
        StorageProperties properties = createProperties();
        MinioStorageClient.MinioOperations operations = Mockito.mock(MinioStorageClient.MinioOperations.class);
        when(operations.presign(eq("GET"), eq("bucket"), eq("key.pdf"), eq(120), eq(null)))
                .thenReturn("http://localhost:9000/bucket/key.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256");

        StorageClient storageClient = new MinioStorageClient(properties, operations);
        PresignedDownloadResult result = storageClient
                .presignDownload(new PresignedDownloadRequest("bucket", "key.pdf", Duration.ofSeconds(120)));

        assertThat(result.getMethod()).isEqualTo("GET");
        assertThat(result.getExpiresInSeconds()).isEqualTo(120);
        assertThat(result.getUrl()).contains("X-Amz-Algorithm");
    }

    @Test
    void statObject_shouldReturnMetadata() throws Exception {
        StorageProperties properties = createProperties();
        MinioStorageClient.MinioOperations operations = Mockito.mock(MinioStorageClient.MinioOperations.class);

        ObjectStat expected = new ObjectStat(1234L, "etag-1", Instant.parse("2026-08-03T10:15:30Z"), "application/pdf");
        when(operations.statObject("bucket", "key.pdf")).thenReturn(expected);

        StorageClient storageClient = new MinioStorageClient(properties, operations);
        ObjectStat result = storageClient.statObject("bucket", "key.pdf");

        assertThat(result.getSize()).isEqualTo(1234L);
        assertThat(result.getEtag()).isEqualTo("etag-1");
        assertThat(result.getLastModified()).isEqualTo(Instant.parse("2026-08-03T10:15:30Z"));
        assertThat(result.getContentType()).isEqualTo("application/pdf");
    }

    @Test
    void deleteObject_shouldDelegateToOperations() throws Exception {
        StorageProperties properties = createProperties();
        MinioStorageClient.MinioOperations operations = Mockito.mock(MinioStorageClient.MinioOperations.class);

        StorageClient storageClient = new MinioStorageClient(properties, operations);
        storageClient.deleteObject("bucket", "key.pdf");

        verify(operations).deleteObject("bucket", "key.pdf");
    }

    @Test
    void presignUpload_shouldRejectWhenExpiryIsZero() {
        StorageProperties properties = createProperties();
        MinioStorageClient.MinioOperations operations = Mockito.mock(MinioStorageClient.MinioOperations.class);

        StorageClient storageClient = new MinioStorageClient(properties, operations);

        assertThatThrownBy(() -> storageClient.presignUpload(
                new PresignedUploadRequest("bucket", "key.pdf", "application/pdf", Duration.ZERO)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("만료시간");
    }

    @Test
    void presignDownload_shouldRejectWhenExpiryExceedsLimit() {
        StorageProperties properties = createProperties();
        MinioStorageClient.MinioOperations operations = Mockito.mock(MinioStorageClient.MinioOperations.class);

        StorageClient storageClient = new MinioStorageClient(properties, operations);

        assertThatThrownBy(() -> storageClient.presignDownload(
                new PresignedDownloadRequest("bucket", "key.pdf", Duration.ofDays(8))))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("7일");
    }

    @Test
    void statObject_shouldUseConfiguredBucketWhenRequestBucketMissing() throws Exception {
        StorageProperties properties = createProperties();
        MinioStorageClient.MinioOperations operations = Mockito.mock(MinioStorageClient.MinioOperations.class);
        ObjectStat expected = new ObjectStat(1L, "etag", Instant.now(), "application/pdf");
        when(operations.statObject("document-attachments", "key.pdf")).thenReturn(expected);

        StorageClient storageClient = new MinioStorageClient(properties, operations);
        storageClient.statObject(" ", "key.pdf");

        verify(operations).statObject("document-attachments", "key.pdf");
    }

    @Test
    void deleteObject_shouldFailWhenBucketNotProvidedAnywhere() {
        StorageProperties properties = createProperties();
        properties.setBucket(" ");
        MinioStorageClient.MinioOperations operations = Mockito.mock(MinioStorageClient.MinioOperations.class);

        StorageClient storageClient = new MinioStorageClient(properties, operations);

        assertThatThrownBy(() -> storageClient.deleteObject(" ", "key.pdf"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("버킷");
    }

    private StorageProperties createProperties() {
        StorageProperties properties = new StorageProperties();
        properties.setProvider("minio");
        properties.setBucket("document-attachments");
        properties.setEndpoint("http://localhost:9000");
        properties.setAccessKey("minioadmin");
        properties.setSecretKey("minioadmin");
        properties.setRegion("us-east-1");
        properties.setPresignExpirySeconds(600);
        return properties;
    }
}