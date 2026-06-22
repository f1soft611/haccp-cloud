package egovframework.let.platforms.factories.domain.model;

import lombok.Getter;
import lombok.Setter;

/**
 * 플랫폼 공장 응답 VO
 * @author AI Assistant
 * @since 2026.06.22
 * @version 1.0
 */
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
