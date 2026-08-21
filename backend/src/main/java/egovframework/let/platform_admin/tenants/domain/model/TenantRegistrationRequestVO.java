package egovframework.let.platform_admin.tenants.domain.model;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 플랫폼 테넌트 등록 요청 VO
 * @author SHMT-MES
 * @since 2026.06.23
 * @version 1.0
 * @see
 *
 * <pre>
 * << 개정이력(Modification Information) >>
 *
 *   수정일      수정자           수정내용
 *  -------    --------    ---------------------------
 *   2026.06.23 SHMT-MES          최초 생성
 *
 * </pre>
 */
@Schema(description = "플랫폼 테넌트 등록 요청 VO")
@Getter
@Setter
public class TenantRegistrationRequestVO {

    @Schema(description = "테넌트명", required = true)
    private String tenantNm;

    @Schema(description = "관리자 이메일")
    private String adminEmail;

    @Schema(description = "관리자명")
    private String adminName;

    @Schema(description = "법인번호")
    private String corporateNumber;

    @Schema(description = "사업자번호")
    private String businessRegistrationNumber;

    @Schema(description = "업종")
    private String businessType;

    @Schema(description = "업태")
    private String businessCategory;

    @Schema(description = "사업자 등록일")
    private String registrationDate;

    @Schema(description = "플랜 코드")
    private String planCode;
}
