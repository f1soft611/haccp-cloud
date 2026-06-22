package egovframework.let.platforms.factories.service;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PlatformTenantDashboardQueryVO {

    private int pageIndex = 0;
    private int pageSize = 10;
    private String searchField;
    private String searchKeyword;
    private String status = "all";
}
