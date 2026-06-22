package egovframework.let.platforms.dashboard.domain.model;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

/**
 * 플랫폼 대시보드 모델 VO
 * @author AI Assistant
 * @since 2026.06.22
 * @version 1.0
 */
@Getter
@Setter
public class PlatformDashboardTenantCodeIssuanceVO {

    private int totalIssued;
    private int issuedThisMonth;
    private int issuedThisWeek;
    private List<RecentIssueVO> recentIssues;

    @Getter
    @Setter
    public static class RecentIssueVO {
        private Long tenantId;
        private String tenantCode;
        private String companyName;
        private String issuedAt;
        private String status;
    }
}
