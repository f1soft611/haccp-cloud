package egovframework.let.organization.authorities.domain.model;

import java.io.Serializable;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 플랫폼 권한/역할 응답을 위한 VO 클래스
 * @author SHMT-MES
 * @since 2026.07.14
 * @version 1.0
 */
@Schema(description = "플랫폼 권한/역할 모델")
@Getter
@Setter
public class AuthorityModelVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "권한 코드")
    private String roleCode;

    @Schema(description = "권한명")
    private String roleNm;

    @Schema(description = "권한 설명")
    private String roleDc;

    @Schema(description = "사용 여부")
    private String useAt;
}
