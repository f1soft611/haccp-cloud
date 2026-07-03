package egovframework.let.platform_admin.dashboard.domain.model;

import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 플랫폼 대시보드 테넌트 코드 발급 현황 VO
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
@Schema(description = "플랫폼 대시보드 테넌트 코드 발급 현황 VO")
@Getter
@Setter
public class PlatformDashboardTenantCodeIssuanceVO {

    @Schema(description = "총 발급 수")
    private int totalIssued;

    @Schema(description = "이번 달 발급 수")
    private int issuedThisMonth;

    @Schema(description = "이번 주 발급 수")
    private int issuedThisWeek;

    @Schema(description = "최근 이슈 목록")
    private List<RecentIssueVO> recentIssues;

    @Schema(description = "최근 발급 이슈")
    @Getter
    @Setter
    public static class RecentIssueVO {
        @Schema(description = "테넌트 ID")
        private Long tenantId;

        @Schema(description = "테넌트 코드")
        private String tenantCode;

        @Schema(description = "업체명")
        private String companyName;

        @Schema(description = "발급일시")
        private String issuedAt;

        @Schema(description = "상태")
        private String status;
    }
}
