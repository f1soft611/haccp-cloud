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
public class PlatformDashboardCcpDocumentsVO {

    private OverallVO overall;
    private List<ItemVO> items;

    @Getter
    @Setter
    public static class OverallVO {
        private int completionRate;
        private int completedTenants;
        private int totalTenants;
    }

    @Getter
    @Setter
    public static class ItemVO {
        private Long tenantId;
        private String tenantCode;
        private String companyName;
        private int generatedCount;
        private int requiredCount;
        private int completionRate;
        private String updatedAt;
    }
}
