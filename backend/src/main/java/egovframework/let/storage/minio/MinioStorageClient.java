package egovframework.let.storage.minio;

import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Component;

import egovframework.let.storage.StorageClient;
import egovframework.let.storage.StorageProperties;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import io.minio.RemoveObjectArgs;
import io.minio.StatObjectArgs;
import io.minio.StatObjectResponse;
import io.minio.http.Method;

@Component
@ConditionalOnExpression("'${storage.provider:}'.trim().toLowerCase() == 'minio'")
public class MinioStorageClient implements StorageClient {

    private static final int MAX_PRESIGN_SECONDS = 7 * 24 * 60 * 60;

    private final StorageProperties properties;
    private final MinioOperations operations;

    @Autowired
    public MinioStorageClient(StorageProperties properties) {
        this(properties, createDefaultOperations(properties));
    }

    MinioStorageClient(StorageProperties properties, MinioOperations operations) {
        this.properties = properties;
        this.operations = operations;
    }

    @Override
    public PresignedUploadResult presignUpload(PresignedUploadRequest request) throws Exception {
        String bucket = resolveBucket(request.getBucket());
        int expiresInSeconds = resolveExpirySeconds(request.getExpiresIn());
        String url = operations.presign("PUT", bucket, request.getObjectKey(), expiresInSeconds, request.getContentType());
        return new PresignedUploadResult(url, "PUT", expiresInSeconds);
    }

    @Override
    public PresignedDownloadResult presignDownload(PresignedDownloadRequest request) throws Exception {
        String bucket = resolveBucket(request.getBucket());
        int expiresInSeconds = resolveExpirySeconds(request.getExpiresIn());
        String url = operations.presign("GET", bucket, request.getObjectKey(), expiresInSeconds, null);
        return new PresignedDownloadResult(url, "GET", expiresInSeconds);
    }

    @Override
    public ObjectStat statObject(String bucket, String objectKey) throws Exception {
        return operations.statObject(resolveBucket(bucket), objectKey);
    }

    @Override
    public void deleteObject(String bucket, String objectKey) throws Exception {
        operations.deleteObject(resolveBucket(bucket), objectKey);
    }

    private static MinioOperations createDefaultOperations(StorageProperties properties) {
        MinioClient.Builder builder = MinioClient.builder()
                .endpoint(properties.getEndpoint())
                .credentials(properties.getAccessKey(), properties.getSecretKey());

        if (hasText(properties.getRegion())) {
            builder.region(properties.getRegion());
        }

        return new DefaultMinioOperations(builder.build());
    }

    private String resolveBucket(String bucket) {
        if (hasText(bucket)) {
            return bucket;
        }
        if (hasText(properties.getBucket())) {
            return properties.getBucket();
        }
        throw new IllegalArgumentException("스토리지 버킷이 비어 있습니다.");
    }

    private int resolveExpirySeconds(Duration duration) {
        long seconds = duration != null ? duration.getSeconds() : properties.getPresignExpirySeconds();
        if (seconds <= 0L || seconds > MAX_PRESIGN_SECONDS) {
            throw new IllegalArgumentException("presign 만료시간은 1초 이상 7일 이하여야 합니다.");
        }
        return (int) seconds;
    }

    private static boolean hasText(String value) {
        return value != null && value.trim().length() > 0;
    }

    interface MinioOperations {
        String presign(String method, String bucket, String objectKey, int expiresInSeconds, String contentType) throws Exception;

        ObjectStat statObject(String bucket, String objectKey) throws Exception;

        void deleteObject(String bucket, String objectKey) throws Exception;
    }

    static class DefaultMinioOperations implements MinioOperations {

        private final MinioClient minioClient;

        DefaultMinioOperations(MinioClient minioClient) {
            this.minioClient = minioClient;
        }

        @Override
        public String presign(String method, String bucket, String objectKey, int expiresInSeconds, String contentType)
                throws Exception {
            GetPresignedObjectUrlArgs.Builder builder = GetPresignedObjectUrlArgs.builder()
                    .method(Method.valueOf(method))
                    .bucket(bucket)
                    .object(objectKey)
                    .expiry(expiresInSeconds);

            if ("PUT".equals(method) && hasText(contentType)) {
                Map<String, String> headers = new HashMap<String, String>();
                headers.put("Content-Type", contentType);
                builder.extraHeaders(headers);
            }

            return minioClient.getPresignedObjectUrl(builder.build());
        }

        @Override
        public ObjectStat statObject(String bucket, String objectKey) throws Exception {
            StatObjectResponse response = minioClient.statObject(
                    StatObjectArgs.builder().bucket(bucket).object(objectKey).build());
            Instant lastModified = response.lastModified() != null ? response.lastModified().toInstant() : null;
            return new ObjectStat(response.size(), response.etag(), lastModified, response.contentType());
        }

        @Override
        public void deleteObject(String bucket, String objectKey) throws Exception {
            minioClient.removeObject(RemoveObjectArgs.builder().bucket(bucket).object(objectKey).build());
        }
    }
}