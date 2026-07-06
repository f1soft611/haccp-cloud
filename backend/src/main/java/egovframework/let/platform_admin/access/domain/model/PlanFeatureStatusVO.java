package egovframework.let.platform_admin.access.domain.model;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 플랜 Feature 활성 상태 VO
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
@Schema(description = "플랜 Feature 활성 상태 VO")
@Getter
@Setter
public class PlanFeatureStatusVO {

    @Schema(description = "Feature 코드")
    private String featureCode;

    @Schema(description = "활성 여부(Y/N)")
    private String enabledAt;
}
