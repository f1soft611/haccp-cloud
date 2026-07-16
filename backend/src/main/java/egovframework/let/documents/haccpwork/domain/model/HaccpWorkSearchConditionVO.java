package egovframework.let.documents.haccpwork.domain.model;

import java.io.Serializable;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * HACCP 업무 조회조건을 위한 VO 클래스
 * @author SHMT-MES
 * @since 2026.07.16
 * @version 1.0
 */
@Schema(description = "HACCP 업무 검색 조건 모델")
@Getter
@Setter
public class HaccpWorkSearchConditionVO implements Serializable {

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
