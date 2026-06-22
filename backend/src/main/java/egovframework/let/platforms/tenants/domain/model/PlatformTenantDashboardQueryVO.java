package egovframework.let.platforms.tenants.domain.model;

import lombok.Getter;
import lombok.Setter;

/**
 * 플랫폼 공장 모델 VO
 * @author AI Assistant
 * @since 2026.06.22
 * @version 1.0
 */
@Getter
@Setter
public class PlatformTenantDashboardQueryVO {

    private int pageIndex = 0;
    private int pageSize = 10;
    private String searchField;
    private String searchKeyword;
    private String status = "all";
    private String onboardingStatus = "all";
}
