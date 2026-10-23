package egovframework.let.documents.workorder.domain.model;

import java.io.Serializable;
import java.math.BigDecimal;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 작업지시 응답을 위한 VO 클래스
 * @author SHMT-MES
 * @since 2026.10.15
 * @version 1.0
 */
@Schema(description = "작업지시 모델")
@Getter
@Setter
public class WorkOrderVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "작업지시 ID")
    private Long workdirectId;

    @Schema(description = "테넌트 코드")
    private String tenantCode;

    @Schema(description = "작업지시번호")
    private String workdtNo;

    @Schema(description = "작업등록일(yyyy-MM-dd)")
    private String workdtDate;

    @Schema(description = "품목 ID")
    private Long materialId;

    @Schema(description = "품목명")
    private String materialName;

    @Schema(description = "규격")
    private String materialSpec;

    @Schema(description = "단위")
    private String unit;

    @Schema(description = "생산계획일(yyyy-MM-dd)")
    private String prodPlanDate;

    @Schema(description = "소비기한(yyyy-MM-dd)")
    private String expirationDate;

    @Schema(description = "생산량")
    private BigDecimal prodplanQty;

    @Schema(description = "비고")
    private String prodMemo;

    @Schema(description = "품목 소비기한 기준 (NONE/DAY/MONTH/YEAR)")
    private String expiryedStatus;

    @Schema(description = "품목 소비기한 계산숫자")
    private Integer expiryedCount;
}