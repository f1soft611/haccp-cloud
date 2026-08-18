package egovframework.let.basicinfo.customers.domain.model;

import java.io.Serializable;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 거래처 응답을 위한 VO 클래스
 * @author SHMT-MES
 * @since 2026.08.14
 * @version 1.0
 */
@Schema(description = "거래처 모델")
@Getter
@Setter
public class CustomerVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "거래처 ID")
    private Long customerId;

    @Schema(description = "테넌트 코드")
    private String tenantCode;

    @Schema(description = "거래처코드")
    private String customerCode;

    @Schema(description = "거래처명")
    private String customerName;

    @Schema(description = "거래처약어명")
    private String custNameAbbr;

    @Schema(description = "대표자명")
    private String presidentName;

    @Schema(description = "사업자번호(숫자만)")
    private String businessNo;

    @Schema(description = "법인번호(숫자만)")
    private String juridNo;

    @Schema(description = "업태")
    private String businessStatus1;

    @Schema(description = "종목")
    private String businessItem1;

    @Schema(description = "우편번호")
    private String postCode;

    @Schema(description = "주소")
    private String address;

    @Schema(description = "전화번호")
    private String telephoneNo;

    @Schema(description = "팩스번호")
    private String facsimileNo;

    @Schema(description = "비고")
    private String custMemo;

    @Schema(description = "사용 여부")
    private boolean active;
}
