package egovframework.let.platforms.factories.service;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TenantIssueCodeResponseVO {

    private String tenantCode;
    private String companyName;
    private String businessRegistrationNumber;
    private String corporateNumber;
    private String adminEmail;
    private String createdAt;
    private String mailDispatchStatus;
}
