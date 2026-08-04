package egovframework.let.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.beans.factory.InitializingBean;

@Component
public class StorageProperties implements InitializingBean {

    @Value("${storage.provider:}")
    private String provider;

    @Value("${storage.bucket:document-attachments}")
    private String bucket;

        @Value("${storage.endpoint:http://218.155.74.34:9000}")
    private String endpoint;

    @Value("${storage.accessKey:}")
    private String accessKey;

    @Value("${storage.secretKey:}")
    private String secretKey;

    @Value("${storage.region:us-east-1}")
    private String region;

    @Value("${storage.presignExpirySeconds:600}")
    private int presignExpirySeconds;

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getBucket() {
        return bucket;
    }

    public void setBucket(String bucket) {
        this.bucket = bucket;
    }

    public String getEndpoint() {
        return endpoint;
    }

    public void setEndpoint(String endpoint) {
        this.endpoint = endpoint;
    }

    public String getAccessKey() {
        return accessKey;
    }

    public void setAccessKey(String accessKey) {
        this.accessKey = accessKey;
    }

    public String getSecretKey() {
        return secretKey;
    }

    public void setSecretKey(String secretKey) {
        this.secretKey = secretKey;
    }

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }

    public int getPresignExpirySeconds() {
        return presignExpirySeconds;
    }

    public void setPresignExpirySeconds(int presignExpirySeconds) {
        this.presignExpirySeconds = presignExpirySeconds;
    }

    @Override
    public void afterPropertiesSet() {
        String normalizedProvider = provider == null ? "" : provider.trim().toLowerCase();
        if ("minio".equals(normalizedProvider)) {
            if (!StringUtils.hasText(accessKey) || !StringUtils.hasText(secretKey)) {
                throw new IllegalStateException("storage.accessKey/storage.secretKey 설정이 필요합니다.");
            }
        }
    }
}