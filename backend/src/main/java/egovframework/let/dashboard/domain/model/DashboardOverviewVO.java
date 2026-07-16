package egovframework.let.dashboard.domain.model;

import java.io.Serializable;
import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 대시보드 통합 응답을 위한 VO 클래스
 */
@Schema(description = "대시보드 통합 응답 모델")
@Getter
@Setter
public class DashboardOverviewVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "요약 집계")
    private DashboardSummaryVO summary;

    @Schema(description = "할일 목록")
    private List<DashboardTodoVO> todoList;

    @Schema(description = "공지 목록")
    private List<DashboardNoticeVO> noticeList;
}
