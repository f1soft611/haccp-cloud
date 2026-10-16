package egovframework.let.documents.workorder.domain.model;

import egovframework.com.cmm.ComDefaultVO;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 작업지시 검색 조건을 위한 VO 클래스
 * @author SHMT-MES
 * @since 2026.10.15
 * @version 1.0
 */
@Schema(description = "작업지시 검색 조건 모델")
@Getter
@Setter
public class WorkOrderSearchConditionVO extends ComDefaultVO {

    private static final long serialVersionUID = 1L;

    @Schema(description = "테넌트 코드")
    private String tenantCode;

    @Schema(description = "품명 검색어")
    private String keyword;

    @Schema(description = "생산계획일 시작(yyyy-MM-dd)")
    private String startDate;

    @Schema(description = "생산계획일 종료(yyyy-MM-dd)")
    private String endDate;
}