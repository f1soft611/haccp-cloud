package egovframework.let.platform_admin.tenants.domain.model;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 테넌트 인증 토큰 VO
 */
@Getter
@Setter
@Builder
@AllArgsConstructor
public class TenantAuthTokenVO {

    @Schema(description = "토큰 ID")
    private Long authTokenId;

    @Schema(description = "테넌트 ID")
    private Long tenantId;

    @Schema(description = "로그인 계정 ID")
    private Long loginAccountId;

    @Schema(description = "테넌트 코드")
    private String tenantCode;

    @Schema(description = "인증 토큰", required = true)
    private String authToken;

    @Schema(description = "토큰 타입", example = "EMAIL_VERIFICATION")
    private String tokenType;

    @Schema(description = "만료 시간")
    private LocalDateTime expiresAt;

    @Schema(description = "토큰 사용 시간")
    private LocalDateTime usedAt;

    @Schema(description = "생성 시간")
    private LocalDateTime createdAt;

    public TenantAuthTokenVO() {}

    /**
     * 토큰이 유효한지 확인
     * @return 토큰이 유효하고 미사용 상태면 true
     */
    public boolean isValid() {
        return expiresAt != null && expiresAt.isAfter(LocalDateTime.now()) && usedAt == null;
    }
}
