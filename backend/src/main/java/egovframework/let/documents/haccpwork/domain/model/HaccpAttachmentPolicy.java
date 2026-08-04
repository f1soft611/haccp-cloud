package egovframework.let.documents.haccpwork.domain.model;

import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * HACCP 문서 첨부 정책 검증 클래스
 */
public class HaccpAttachmentPolicy {

    private final long maxFileSizeBytes;
    private final int maxFileCount;
    private final long maxTotalSizeBytes;
    private final Set<String> allowedExtensions;

    public HaccpAttachmentPolicy(long maxFileSizeBytes, int maxFileCount, long maxTotalSizeBytes,
            List<String> allowedExtensions) {
        this.maxFileSizeBytes = maxFileSizeBytes;
        this.maxFileCount = maxFileCount;
        this.maxTotalSizeBytes = maxTotalSizeBytes;

        Set<String> normalized = new HashSet<String>();
        if (allowedExtensions != null) {
            for (String ext : allowedExtensions) {
                if (ext == null) {
                    continue;
                }
                String trimmed = ext.trim().toLowerCase(Locale.ROOT);
                if (!trimmed.isEmpty()) {
                    normalized.add(trimmed);
                }
            }
        }
        this.allowedExtensions = Collections.unmodifiableSet(normalized);
    }

    public void validateSingle(String fileName, String contentType, long fileSize) {
        String ext = extractExt(fileName);
        if (!allowedExtensions.contains(ext)) {
            throw new IllegalArgumentException("허용되지 않는 확장자입니다.");
        }

        if (contentType == null || contentType.trim().isEmpty()) {
            throw new IllegalArgumentException("콘텐츠 타입은 필수입니다.");
        }

        if (fileSize <= 0L || fileSize > maxFileSizeBytes) {
            throw new IllegalArgumentException("파일 크기 제한을 초과했습니다.");
        }
    }

    public void validateBatch(List<HaccpAttachmentUploadRequestVO> requests) {
        if (requests == null || requests.isEmpty()) {
            throw new IllegalArgumentException("업로드 요청 파일이 없습니다.");
        }

        if (requests.size() > maxFileCount) {
            throw new IllegalArgumentException("첨부파일 개수 제한을 초과했습니다.");
        }

        long totalSize = 0L;
        for (HaccpAttachmentUploadRequestVO request : requests) {
            if (request == null) {
                throw new IllegalArgumentException("업로드 요청 정보가 올바르지 않습니다.");
            }

            Long fileSize = request.getFileSize();
            long currentSize = fileSize == null ? 0L : fileSize.longValue();
            validateSingle(request.getEffectiveFileName(), request.getContentType(), currentSize);
            totalSize += currentSize;
        }

        if (totalSize > maxTotalSizeBytes) {
            throw new IllegalArgumentException("첨부파일 총 용량 제한을 초과했습니다.");
        }
    }

    private String extractExt(String fileName) {
        if (fileName == null) {
            throw new IllegalArgumentException("파일명은 필수입니다.");
        }

        String trimmed = fileName.trim();
        int index = trimmed.lastIndexOf('.');
        if (index <= 0 || index == trimmed.length() - 1) {
            throw new IllegalArgumentException("파일 확장자가 필요합니다.");
        }

        return trimmed.substring(index + 1).toLowerCase(Locale.ROOT);
    }
}
