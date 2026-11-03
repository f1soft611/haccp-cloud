package egovframework.let.basicinfo.workday.domain.model;

import java.io.Serializable;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 업무일 1일 정보를 위한 VO 클래스
 * @author SHMT-MES
 * @since 2026.11.03
 * @version 1.0
 */
@Schema(description = "업무일 모델")
@Getter
@Setter
public class WorkdayVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "날짜 (YYYY-MM-DD)")
    private String workdayDate;

    @Schema(description = "유형 (WORKDAY_TYPE 공통코드)")
    private String dayType;

    @Schema(description = "휴일명")
    private String dayName;

    @Schema(description = "메모")
    private String memo;

    @Schema(description = "출처 (API / PATTERN / MANUAL)")
    private String source;
}