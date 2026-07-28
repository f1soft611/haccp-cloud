package egovframework.let.organization.users.domain.model;

import java.io.Serializable;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 마이페이지 이미지 변경 요청을 위한 VO 클래스
 * @author SHMT-MES
 * @since 2026.07.14
 * @version 1.0
 */
@Schema(description = "마이페이지 이미지 변경 요청 모델")
@Getter
@Setter
public class PlatformUserImageUpdateRequestVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "프로필 이미지")
    private String profileImage;

    @Schema(description = "결재 도장 이미지")
    private String stampImage;
}
