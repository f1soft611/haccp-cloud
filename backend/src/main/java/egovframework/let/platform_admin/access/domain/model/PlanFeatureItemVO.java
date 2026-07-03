package egovframework.let.platform_admin.access.domain.model;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 플랜 Feature 상세 VO
 * @author SHMT-MES
 * @since 2026.07.03
 * @version 1.0
 * @see
 *
 * <pre>
 * << 개정이력(Modification Information) >>
 *
 *   수정일      수정자           수정내용
 *  -------    --------    ---------------------------
 *   2026.07.03 SHMT-MES          최초 생성
 *
 * </pre>
 */
@Schema(description = "플랜 Feature 상세 VO")
@Getter
@Setter
public class PlanFeatureItemVO {

    @Schema(description = "Feature 코드")
    private String featureCode;

    @Schema(description = "Feature 명")
    private String featureName;

    @Schema(description = "Feature 타입")
    private String featureType;

    @Schema(description = "활성 여부(Y/N)")
    private String enabledAt;

    @Schema(description = "제한 값")
    private Long limitValue;

    @Schema(description = "활성 여부(Boolean)")
    private boolean enabled;
}
