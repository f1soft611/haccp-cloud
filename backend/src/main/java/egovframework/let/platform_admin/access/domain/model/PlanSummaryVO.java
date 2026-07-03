package egovframework.let.platform_admin.access.domain.model;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 플랜 요약 정보 VO
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
@Schema(description = "플랜 요약 정보 VO")
@Getter
@Setter
public class PlanSummaryVO {

    @Schema(description = "플랜 코드")
    private String planCode;

    @Schema(description = "플랜명")
    private String planName;

    @Schema(description = "플랜 설명")
    private String planDesc;

    @Schema(description = "사용 여부")
    private String useAt;

    @Schema(description = "Feature 개수")
    private int featureCount;

    @Schema(description = "메뉴 개수")
    private int menuCount;
}
