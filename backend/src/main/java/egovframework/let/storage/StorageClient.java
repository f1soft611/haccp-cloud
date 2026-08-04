package egovframework.let.storage;

import java.time.Duration;
import java.time.Instant;

public interface StorageClient {

    PresignedUploadResult presignUpload(PresignedUploadRequest request) throws Exception;

    PresignedDownloadResult presignDownload(PresignedDownloadRequest request) throws Exception;

    ObjectStat statObject(String bucket, String objectKey) throws Exception;

    void deleteObject(String bucket, String objectKey) throws Exception;

    final class PresignedUploadRequest {
        private final String bucket;
        private final String objectKey;
        private final String contentType;
        private final Duration expiresIn;

        public PresignedUploadRequest(String bucket, String objectKey, String contentType, Duration expiresIn) {
            this.bucket = bucket;
            this.objectKey = objectKey;
            this.contentType = contentType;
            this.expiresIn = expiresIn;
        }

        public String getBucket() {
            return bucket;
        }

        public String getObjectKey() {
            return objectKey;
        }

        public String getContentType() {
            return contentType;
        }

        public Duration getExpiresIn() {
            return expiresIn;
        }
    }

    final class PresignedUploadResult {
        private final String url;
        private final String method;
        private final int expiresInSeconds;

        public PresignedUploadResult(String url, String method, int expiresInSeconds) {
            this.url = url;
            this.method = method;
            this.expiresInSeconds = expiresInSeconds;
        }

        public String getUrl() {
            return url;
        }

        public String getMethod() {
            return method;
        }

        public int getExpiresInSeconds() {
            return expiresInSeconds;
        }
    }

    final class PresignedDownloadRequest {
        private final String bucket;
        private final String objectKey;
        private final Duration expiresIn;

        public PresignedDownloadRequest(String bucket, String objectKey, Duration expiresIn) {
            this.bucket = bucket;
            this.objectKey = objectKey;
            this.expiresIn = expiresIn;
        }

        public String getBucket() {
            return bucket;
        }

        public String getObjectKey() {
            return objectKey;
        }

        public Duration getExpiresIn() {
            return expiresIn;
        }
    }

    final class PresignedDownloadResult {
        private final String url;
        private final String method;
        private final int expiresInSeconds;

        public PresignedDownloadResult(String url, String method, int expiresInSeconds) {
            this.url = url;
            this.method = method;
            this.expiresInSeconds = expiresInSeconds;
        }

        public String getUrl() {
            return url;
        }

        public String getMethod() {
            return method;
        }

        public int getExpiresInSeconds() {
            return expiresInSeconds;
        }
    }

    final class ObjectStat {
        private final long size;
        private final String etag;
        private final Instant lastModified;
        private final String contentType;

        public ObjectStat(long size, String etag, Instant lastModified, String contentType) {
            this.size = size;
            this.etag = etag;
            this.lastModified = lastModified;
            this.contentType = contentType;
        }

        public long getSize() {
            return size;
        }

        public String getEtag() {
            return etag;
        }

        public Instant getLastModified() {
            return lastModified;
        }

        public String getContentType() {
            return contentType;
        }
    }
}