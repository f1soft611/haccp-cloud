package egovframework.let.organization.users.domain.model;

import java.io.Serializable;
import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 플랫폼 사용자 응답을 위한 VO 클래스
 * @author SHMT-MES
 * @since 2026.07.14
 * @version 1.0
 */
@Schema(description = "플랫폼 사용자 모델")
@Getter
@Setter
public class PlatformUserVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "사용자 ID")
    private Long userId;

    @Schema(description = "로그인 ID")
    private Long loginId;

    @Schema(description = "테넌트 코드")
    private String tenantCode;

    @Schema(description = "사용자명")
    private String userNm;

    @Schema(description = "이메일")
    private String emailAddr;

    @Schema(description = "부서명")
    private String departmentNm;

    @Schema(description = "대표 권한 코드")
    private String roleCode;

    @Schema(description = "권한 코드 목록")
    private List<String> roleCodes;

    @Schema(description = "사용 여부")
    private boolean active;

    @Schema(description = "로그인 코드")
    private String loginCode;

    @Schema(description = "프로필 이미지")
    private String profileImage;

    @Schema(description = "결재 도장 이미지")
    private String stampImage;

    @Schema(description = "결재 서명 이미지")
    private String signatureImage;

    @Schema(description = "사용자 use_at")
    private String useAt;

    @Schema(description = "로그인 use_at")
    private String loginUseAt;
}
