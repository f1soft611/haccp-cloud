package egovframework.let.uss.auth.service;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FactoryRegistrationRequestVO {

    @Schema(description = "업체명", required = true)
    private String factoryNm;

    @Schema(description = "관리자 이메일")
    private String adminEmail;
}
