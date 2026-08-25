package egovframework.let.organization.users.domain.model;

import egovframework.com.cmm.ComDefaultVO;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 플랫폼 사용자 검색 조건을 위한 VO 클래스
 * @author SHMT-MES
 * @since 2026.07.14
 * @version 1.0
 */
@Schema(description = "플랫폼 사용자 검색 조건 모델")
@Getter
@Setter
public class PlatformUserSearchConditionVO extends ComDefaultVO {

    private static final long serialVersionUID = 1L;

    @Schema(description = "테넌트 ID")
    private Long tenantId;

    @Schema(description = "테넌트 코드")
    private String tenantCode;

    @Schema(description = "검색 키워드")
    private String keyword;

    @Schema(description = "사용 여부 필터")
    private String filterActive = "all";
}
