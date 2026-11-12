package egovframework.let.documents.haccpbase.works.domain.model;

import java.io.Serializable;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * HACCP 양식 업무 조회조건을 위한 VO 클래스
 * @author SHMT-MES
 * @since 2026.07.07
 * @version 1.0
 */
@Schema(description = "HACCP 양식 업무 검색 조건 모델")
@Getter
@Setter
public class HaccpBaseWorkSearchConditionVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "테넌트 ID")
    private Long tenantId;

    @Schema(description = "테넌트 코드")
    private String tenantCode;

    @Schema(description = "사용 여부")
    private String active;

    @Schema(description = "업무분류 ID")
    private Long categoryId;

    @Schema(description = "검색 키워드(업무명, 검토자명, 승인자명)")
    private String keyword;

    @Schema(description = "요청 사용자 로그인 ID")
    private Long actorLoginId;

    @Schema(description = "요청 사용자 사용자ID")
    private Long actorUserId;

    @Schema(description = "요청 사용자 로그인 코드")
    private String actorLoginCode;
}
