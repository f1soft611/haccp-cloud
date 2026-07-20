package egovframework.let.dashboard.domain.model;

import java.io.Serializable;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 대시보드 공지 응답을 위한 VO 클래스
 */
@Schema(description = "대시보드 공지 모델")
@Getter
@Setter
public class DashboardNoticeVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "공지 ID")
    private Long noticeId;

    @Schema(description = "공지 범위")
    private String scope;

    @Schema(description = "공지 제목")
    private String title;

    @Schema(description = "공지일")
    private String noticeDate;
}
