package egovframework.let.platform_admin.tenants.domain.model;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 플랫폼 테넌트 등록 요청 VO
 */
@Getter
@Setter
public class TenantRegistrationRequestVO {

    @Schema(description = "테넌트명", required = true)
    private String tenantNm;

    @Schema(description = "관리자 이메일")
    private String adminEmail;

    @Schema(description = "법인번호")
    private String corporateNumber;

    @Schema(description = "업종")
    private String businessType;

    @Schema(description = "업태")
    private String businessCategory;
}
