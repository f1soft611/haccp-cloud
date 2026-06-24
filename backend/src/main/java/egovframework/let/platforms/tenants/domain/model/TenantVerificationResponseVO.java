package egovframework.let.platforms.tenants.domain.model;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 테넌트 이메일 토큰 검증 응답 VO
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantVerificationResponseVO {

    @Schema(description = "테넌트 코드")
    private String tenantCode;

    @Schema(description = "테넌트명")
    private String tenantNm;

    @Schema(description = "관리자 이메일")
    private String adminEmail;

    @Schema(description = "로그인 계정 ID")
    private Long loginAccountId;

    @Schema(description = "검증 성공 여부")
    private boolean verified;

    @Schema(description = "메시지")
    private String message;
}
