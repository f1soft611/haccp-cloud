package egovframework.let.platform_admin.tenants.domain.model;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 테넌트 온보딩 완료 요청 VO
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
@Schema(description = "테넌트 온보딩 완료 요청 VO")
@Getter
@Setter
public class TenantOnboardingCompleteRequestVO {

    @Schema(description = "테넌트 코드", required = true)
    private String tenantCode;

    @Schema(description = "인증 토큰", required = true)
    private String authToken;

    @Schema(description = "비밀번호", required = true)
    private String password;

    @Schema(description = "전화번호")
    private String phoneNumber;

    @Schema(description = "회사 로그인 도메인 (예: f1soft.co.kr)")
    private String loginDomain;

    @Schema(description = "회사 로고 이미지(Base64)")
    private String logoImage;
}
