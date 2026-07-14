package egovframework.let.organization.users.domain.model;

import java.io.Serializable;
import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 플랫폼 사용자 저장 요청을 위한 VO 클래스
 * @author SHMT-MES
 * @since 2026.07.14
 * @version 1.0
 */
@Schema(description = "플랫폼 사용자 저장 요청 모델")
@Getter
@Setter
public class PlatformUserSaveRequestVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "사용자명")
    private String name;

    @Schema(description = "이메일")
    private String email;

    @Schema(description = "부서명")
    private String department;

    @Schema(description = "대표 권한 코드")
    private String roleCode;

    @Schema(description = "권한 코드 목록")
    private List<String> roleCodes;

    @Schema(description = "사용 여부")
    private Boolean active;

    @Schema(description = "테넌트 코드")
    private String tenantCode;
}
