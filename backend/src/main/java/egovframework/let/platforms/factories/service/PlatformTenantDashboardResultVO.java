package egovframework.let.platforms.factories.service;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PlatformTenantDashboardResultVO {

    private PlatformTenantDashboardSummaryVO summary;
    private List<PlatformTenantDashboardItemVO> items;
}
