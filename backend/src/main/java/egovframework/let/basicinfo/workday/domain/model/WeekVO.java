package egovframework.let.basicinfo.workday.domain.model;

import java.io.Serializable;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 주차 1건 정보를 위한 VO 클래스
 * @author SHMT-MES
 * @since 2026.11.03
 * @version 1.0
 */
@Schema(description = "주차 모델")
@Getter
@Setter
public class WeekVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "ISO 주 기준 연도")
    private int year;

    @Schema(description = "주차 (1~53)")
    private int week;

    @Schema(description = "시작일 (YYYY-MM-DD, 월요일)")
    private String fromDate;

    @Schema(description = "종료일 (YYYY-MM-DD, 일요일)")
    private String toDate;
}