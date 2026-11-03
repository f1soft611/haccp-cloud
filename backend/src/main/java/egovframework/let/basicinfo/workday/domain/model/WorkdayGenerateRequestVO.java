package egovframework.let.basicinfo.workday.domain.model;

import java.io.Serializable;
import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 업무일 연간 생성 요청을 위한 VO 클래스
 * @author SHMT-MES
 * @since 2026.11.03
 * @version 1.0
 */
@Schema(description = "업무일 생성 요청 모델")
@Getter
@Setter
public class WorkdayGenerateRequestVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "연도")
    private Integer year;

    @Schema(description = "기본 휴무 요일 (0=일 ~ 6=토)")
    private List<Integer> weeklyOffDays;

    @Schema(description = "공휴일 API 반영 여부")
    private boolean includePublicHolidays;

    @Schema(description = "기존 데이터 덮어쓰기 여부")
    private boolean overwrite;

    @Schema(hidden = true)
    private String tenantCode;

    @Schema(hidden = true)
    private Long operatorTenantId;

    @Schema(hidden = true)
    private String operatorLoginCode;
}