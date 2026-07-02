package egovframework.let.platform_admin.tenants.domain.model;

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
public class SampleTenantVO {

    private Long tenantId;
    private String tenantCode;
    private String companyName;
    private String businessRegistrationNumber;
    private String adminEmail;
    private String issuedAt;
}
