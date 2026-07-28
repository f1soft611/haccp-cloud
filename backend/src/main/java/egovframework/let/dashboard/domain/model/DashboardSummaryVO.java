package egovframework.let.dashboard.domain.model;

import java.io.Serializable;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 대시보드 집계 응답을 위한 VO 클래스
 */
@Schema(description = "대시보드 요약 집계 모델")
@Getter
@Setter
public class DashboardSummaryVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "총 할일 건수")
    private int totalTodoCount;

    @Schema(description = "진행중 건수")
    private int inProgressCount;

    @Schema(description = "미완료 건수")
    private int draftCount;

    @Schema(description = "완료 건수")
    private int activeCount;

    @Schema(description = "즉시 조치 필요 건수")
    private int todayActionCount;

    @Schema(description = "공지 건수")
    private int noticeCount;
}
