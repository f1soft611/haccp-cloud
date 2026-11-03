package egovframework.let.basicinfo.workday.domain.model;

import java.io.Serializable;
import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 업무일 일괄 수정 요청을 위한 VO 클래스
 * @author SHMT-MES
 * @since 2026.11.03
 * @version 1.0
 */
@Schema(description = "업무일 일괄 수정 요청 모델")
@Getter
@Setter
public class WorkdaySaveRequestVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "수정할 날짜 목록")
    private List<WorkdayVO> items;

    @Schema(hidden = true)
    private String tenantCode;

    @Schema(hidden = true)
    private Long operatorTenantId;

    @Schema(hidden = true)
    private String operatorLoginCode;
}