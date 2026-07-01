package egovframework.let.platform_admin.tenants.domain.model;

import java.util.List;

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
public class PlatformTenantDashboardResultVO {

    private PlatformTenantDashboardSummaryVO summary;
    private List<PlatformTenantDashboardItemVO> items;
}
