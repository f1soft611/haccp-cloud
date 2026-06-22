package egovframework.let.platforms.factories.service;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PlatformTenantDashboardItemVO {

    private String tenantCode;
    private String companyName;
    private String adminName;
    private String adminEmail;
    private String status;
    private String createdAt;
    private String corporateNumber;
    private String businessType;
    private String businessCategory;
}
