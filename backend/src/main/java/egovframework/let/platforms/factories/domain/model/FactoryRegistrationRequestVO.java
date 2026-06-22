package egovframework.let.platforms.factories.domain.model;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 플랫폼 공장 요청 VO
 * @author AI Assistant
 * @since 2026.06.22
 * @version 1.0
 */
@Getter
@Setter
public class FactoryRegistrationRequestVO {

    @Schema(description = "업체명", required = true)
    private String factoryNm;

    @Schema(description = "관리자 이메일")
    private String adminEmail;

    @Schema(description = "법인번호")
    private String corporateNumber;

    @Schema(description = "업종")
    private String businessType;

    @Schema(description = "업태")
    private String businessCategory;
}
