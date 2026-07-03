package egovframework.let.platform_admin.tenants.domain.model;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 테넌트 이메일 토큰 검증 응답 VO
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
@Schema(description = "테넌트 이메일 토큰 검증 응답 VO")
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

    @Schema(description = "관리자 로그인 아이디")
    private String adminLoginCode;

    @Schema(description = "검증 성공 여부")
    private boolean verified;

    @Schema(description = "메시지")
    private String message;
}
