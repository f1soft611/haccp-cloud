package egovframework.let.documents.workorder.domain.model;

import java.io.Serializable;
import java.math.BigDecimal;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 작업지시 등록/수정/삭제 요청을 위한 VO 클래스
 * @author SHMT-MES
 * @since 2026.10.15
 * @version 1.0
 */
@Schema(description = "작업지시 저장 요청 모델")
@Getter
@Setter
public class WorkOrderSaveRequestVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "테넌트 코드")
    private String tenantCode;

    @Schema(description = "품목 ID")
    private Long materialId;

    @Schema(description = "생산계획일(yyyy-MM-dd)")
    private String prodPlanDate;

    @Schema(description = "소비기한(yyyy-MM-dd)")
    private String expirationDate;

    @Schema(description = "생산량")
    private BigDecimal prodplanQty;

    @Schema(description = "비고")
    private String prodMemo;

    @Schema(description = "작업자 테넌트 ID (서버에서 설정)", hidden = true)
    private Long operatorTenantId;

    @Schema(description = "작업자 로그인 코드 (서버에서 설정)", hidden = true)
    private String operatorLoginCode;
}