package egovframework.let.platform_admin.dashboard.domain.model;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 플랫폼 대시보드 KPI VO
 * @author SHMT-MES
 * @since 2026.06.22
 * @version 1.0
 * @see
 *
 * <pre>
 * << 개정이력(Modification Information) >>
 *
 *   수정일      수정자           수정내용
 *  -------    --------    ---------------------------
 *   2026.06.22 SHMT-MES          최초 생성
 *
 * </pre>
 */
@Schema(description = "플랫폼 대시보드 KPI VO")
@Getter
@Setter
public class PlatformDashboardKpisVO {

    @Schema(description = "활성 테넌트 수")
    private int activeTenants;

    @Schema(description = "최근 7일 신규 테넌트 수")
    private int newTenantsLast7Days;

    @Schema(description = "CCP 문서 완료율")
    private int ccpDocCompletionRate;

    @Schema(description = "CCP 문서 미완료 테넌트 수")
    private int tenantsWithoutCcpDocs;
}
