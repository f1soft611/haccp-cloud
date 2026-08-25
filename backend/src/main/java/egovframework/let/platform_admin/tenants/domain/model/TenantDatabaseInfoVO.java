package egovframework.let.platform_admin.tenants.domain.model;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TenantDatabaseInfoVO {

    @Schema(description = "테넌트 ID")
    private Long tenantId;

    @Schema(description = "DB 식별 키")
    private String dbKey;

    @Schema(description = "JDBC URL")
    private String jdbcUrl;

    @Schema(description = "DB 사용자")
    private String jdbcUsername;

    @Schema(description = "암호 참조 키")
    private String jdbcPasswordSecretRef;

    @Schema(description = "스키마 이름")
    private String schemaName;

    @Schema(description = "프로비저닝 상태")
    private String provisioningStatus;

    @Schema(description = "활성 여부")
    private String useAt;
}
