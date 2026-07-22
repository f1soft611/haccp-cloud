package egovframework.let.documents.portal.domain.model;

import java.io.Serializable;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * HACCP 문서포탈 목록 응답 모델
 */
@Schema(description = "HACCP 문서포탈 목록 모델")
@Getter
@Setter
public class HaccpPortalDocumentVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "업무 ID")
    private Long draftingWorkCategoryId;

    @Schema(description = "분류명")
    private String categoryName;

    @Schema(description = "구분명")
    private String divisionName;

    @Schema(description = "주기")
    private String cycle;

    @Schema(description = "담당자 요약")
    private String assigneeSummary;
}
