package egovframework.let.platforms.factories.service;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TenantIssueCodeRequestVO {

    @Schema(description = "업체명")
    private String companyName;

    @Schema(description = "사업자번호")
    private String businessRegistrationNumber;

    @Schema(description = "법인번호")
    private String corporateNumber;

    @Schema(description = "대표자명")
    private String representativeName;

    @Schema(description = "업종")
    private String businessType;

    @Schema(description = "업태")
    private String businessCategory;

    @Schema(description = "주소")
    private String address;

    @Schema(description = "전화번호")
    private String phoneNumber;

    @Schema(description = "등록일")
    private String registrationDate;

    @Schema(description = "관리자명")
    private String adminName;

    @Schema(description = "관리자 이메일")
    private String adminEmail;
}
