package egovframework.let.uss.auth.service;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

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
}
