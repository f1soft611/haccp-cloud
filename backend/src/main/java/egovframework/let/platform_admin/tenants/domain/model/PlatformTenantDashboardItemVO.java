package egovframework.let.platform_admin.tenants.domain.model;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 플랫폼 테넌트 대시보드 항목 VO
 * @author SHMT-MES
 * @since 2026.06.22
 * @version 1.0
 * @see
 *
 * <pre>
 * << 개정이력(Modification Information) >>
 *
 *   수정일      수정자           수정내용
 *  -------    --------    ---------------------------
 *   2026.06.22 SHMT-MES          최초 생성
 *
 * </pre>
 */
@Schema(description = "플랫폼 테넌트 대시보드 항목 VO")
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
