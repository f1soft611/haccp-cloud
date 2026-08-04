package egovframework.let.documents.haccpwork.domain.model;

import java.io.Serializable;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;
import org.springframework.util.StringUtils;

/**
 * HACCP 문서 첨부 업로드 요청을 위한 VO 클래스
 */
@Schema(description = "HACCP 문서 첨부 업로드 요청 모델")
@Getter
@Setter
public class HaccpAttachmentUploadRequestVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "파일명")
    private String fileName;

    @Schema(description = "원본 파일명(하위호환)")
    private String originalFileName;

    @Schema(description = "콘텐츠 타입")
    private String contentType;

    @Schema(description = "파일 크기(byte)")
    private Long fileSize;

    @Schema(description = "체크섬 SHA-256")
    private String checksumSha256;

    @Schema(description = "스토리지 오브젝트 키")
    private String objectKey;

    @Schema(description = "업로드 세션 토큰")
    private String uploadToken;

    public String getEffectiveFileName() {
        if (StringUtils.hasText(fileName)) {
            return fileName.trim();
        }
        return StringUtils.hasText(originalFileName) ? originalFileName.trim() : "";
    }
}
