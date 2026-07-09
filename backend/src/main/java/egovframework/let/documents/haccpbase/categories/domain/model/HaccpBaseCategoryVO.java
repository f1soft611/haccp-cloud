package egovframework.let.documents.haccpbase.categories.domain.model;

import java.io.Serializable;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * HACCP 양식 업무 분류 응답을 위한 VO 클래스
 * @author SHMT-MES
 * @since 2026.07.07
 * @version 1.0
 */
@Schema(description = "HACCP 양식 업무 분류 모델")
@Getter
@Setter
public class HaccpBaseCategoryVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "분류 그룹 ID")
    private Long draftingWorkCategoryGroupId;

    @Schema(description = "테넌트 코드")
    private String tenantCode;

    @Schema(description = "분류 코드")
    private String categoryCode;

    @Schema(description = "분류명")
    private String categoryName;

    @Schema(description = "정렬 순서")
    private int sortOrder;

    @Schema(description = "사용 여부")
    private boolean active;

    @Schema(description = "등록자 ID")
    private String createdBy;

    @Schema(description = "등록일시")
    private String createdAt;
}
