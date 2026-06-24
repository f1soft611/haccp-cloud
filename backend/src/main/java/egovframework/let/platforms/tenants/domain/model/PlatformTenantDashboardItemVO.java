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
public class PlatformTenantDashboardItemVO {

    private Long tenantId;
    private String tenantCode;
    private String companyName;
    private String adminName;
    private String adminEmail;
    private String status;
    private String onboardingStatus;
    private String planCode;
    private String planName;
    private String createdAt;
    private String corporateNumber;
    private String businessType;
    private String businessCategory;
}
