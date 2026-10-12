package egovframework.let.basicinfo.commoncode.domain.model;

import java.io.Serializable;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 공통코드 상세 VO 클래스
 * @author SHMT-MES
 * @since 2026.10.08
 * @version 1.0
 */
@Schema(description = "공통코드 상세 모델")
@Getter
@Setter
public class CommonCodeItemVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "그룹코드")
    private String groupCode;

    @Schema(description = "상세코드")
    private String code;

    @Schema(description = "상세코드명")
    private String codeName;

    @Schema(description = "상위코드명 (조회 전용)")
    private String parentCodeName;

    @Schema(description = "사용여부")
    private boolean useAt;

    @Schema(description = "정렬순서")
    private Integer sortOrder;

    @Schema(description = "설명")
    private String codeDesc;
}