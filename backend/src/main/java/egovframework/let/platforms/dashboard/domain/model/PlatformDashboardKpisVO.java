package egovframework.let.platforms.dashboard.domain.model;

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
public class PlatformDashboardKpisVO {

    private int activeTenants;
    private int newTenantsLast7Days;
    private int ccpDocCompletionRate;
    private int tenantsWithoutCcpDocs;
}
