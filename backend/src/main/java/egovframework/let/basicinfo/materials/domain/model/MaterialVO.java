package egovframework.let.basicinfo.materials.domain.model;

import java.io.Serializable;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 품목 응답을 위한 VO 클래스
 * @author SHMT-MES
 * @since 2026.08.14
 * @version 1.0
 */
@Schema(description = "품목 모델")
@Getter
@Setter
public class MaterialVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "품목 ID")
    private Long materialId;

    @Schema(description = "테넌트 코드")
    private String tenantCode;

    @Schema(description = "품목코드")
    private String materialCode;

    @Schema(description = "품목명")
    private String materialName;

    @Schema(description = "품목계정(제품/상품/원재료/부재료/소모품)")
    private String itemType;

    @Schema(description = "규격")
    private String materialSpec;

    @Schema(description = "중량")
    private Long materialWeight;

    @Schema(description = "단위")
    private String unit;

    @Schema(description = "비고")
    private String etc;
}
