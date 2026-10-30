package egovframework.let.platform_admin.tenants.domain.model;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 플랫폼 관리자 업체 정보 수정 요청 VO
 */
@Schema(description = "플랫폼 관리자 업체 정보 수정 요청 VO")
@Getter
@Setter
public class TenantUpdateRequestVO {

    private String companyName;
    private String corporateNumber;
    private String businessType;
    private String businessCategory;
    private String registrationDate;

    @Schema(description = "data:image/... data URL. null 이면 로고 변경 없음")
    private String logoImage;

    @Schema(description = "true 면 로고 삭제. logoImage 보다 우선")
    private Boolean removeLogo;
}