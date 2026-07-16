package egovframework.let.dashboard.domain.model;

import java.io.Serializable;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 대시보드 조회조건을 위한 VO 클래스
 */
@Schema(description = "대시보드 검색 조건 모델")
@Getter
@Setter
public class DashboardSearchConditionVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "테넌트 코드")
    private String tenantCode;

    @Schema(description = "요청 사용자 로그인 ID")
    private Long actorLoginId;

    @Schema(description = "요청 사용자 사용자ID")
    private Long actorUserId;

    @Schema(description = "요청 사용자 로그인 코드")
    private String actorLoginCode;
}
