package egovframework.let.platform_admin.dashboard.domain.model;

import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 플랫폼 대시보드 CCP 문서 현황 VO
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
@Schema(description = "플랫폼 대시보드 CCP 문서 현황 VO")
@Getter
@Setter
public class PlatformDashboardCcpDocumentsVO {

    @Schema(description = "전체 요약 정보")
    private OverallVO overall;

    @Schema(description = "테넌트별 상세 목록")
    private List<ItemVO> items;

    @Schema(description = "CCP 문서 현황 요약")
    @Getter
    @Setter
    public static class OverallVO {
        @Schema(description = "완료율")
        private int completionRate;

        @Schema(description = "완료 테넌트 수")
        private int completedTenants;

        @Schema(description = "전체 테넌트 수")
        private int totalTenants;
    }

    @Schema(description = "CCP 문서 현황 상세")
    @Getter
    @Setter
    public static class ItemVO {
        @Schema(description = "테넌트 ID")
        private Long tenantId;

        @Schema(description = "테넌트 코드")
        private String tenantCode;

        @Schema(description = "업체명")
        private String companyName;

        @Schema(description = "생성 문서 수")
        private int generatedCount;

        @Schema(description = "필수 문서 수")
        private int requiredCount;

        @Schema(description = "완료율")
        private int completionRate;

        @Schema(description = "최근 갱신일시")
        private String updatedAt;
    }
}
