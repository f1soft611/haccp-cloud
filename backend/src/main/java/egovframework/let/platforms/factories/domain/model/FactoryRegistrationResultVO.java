package egovframework.let.platforms.factories.domain.model;

import io.swagger.v3.oas.annotations.media.Schema;
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
public class FactoryRegistrationResultVO {

    @Schema(description = "업체코드(6자리)")
    private String factoryCode;

    @Schema(description = "업체명")
    private String factoryNm;

    @Schema(description = "테넌트코드")
    private String tenantCode;

    @Schema(description = "관리자 이메일")
    private String adminEmail;

    @Schema(description = "법인번호")
    private String corporateNumber;

    @Schema(description = "업종")
    private String businessType;

    @Schema(description = "업태")
    private String businessCategory;

    @Schema(description = "생성일시(ISO)")
    private String createdAt;
}
