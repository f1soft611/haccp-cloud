package egovframework.let.documents.portal.domain.model;

import java.io.Serializable;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * HACCP 문서포탈 조회 조건 모델
 */
@Schema(description = "HACCP 문서포탈 검색 조건")
@Getter
@Setter
public class HaccpPortalDocumentSearchConditionVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "테넌트 ID")
    private Long tenantId;

    @Schema(description = "테넌트 코드")
    private String tenantCode;

    @Schema(description = "본인 담당 업무만 조회 여부")
    private boolean onlyAssigned;

    @Schema(description = "로그인 계정 ID")
    private Long actorLoginId;

    @Schema(description = "사용자 ID")
    private Long actorUserId;

    @Schema(description = "로그인 코드")
    private String actorLoginCode;

    @Schema(description = "업무분류 ID")
    private Long categoryId;

    @Schema(description = "분류 미지정(기타문서) 업무만 조회 여부")
    private boolean uncategorized;

    @Schema(description = "등록주기 코드")
    private String cycle;

    @Schema(description = "검색 키워드(업무명, 담당자명)")
    private String keyword;
}
