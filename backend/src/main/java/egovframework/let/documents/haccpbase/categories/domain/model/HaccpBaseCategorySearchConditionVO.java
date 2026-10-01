package egovframework.let.documents.haccpbase.categories.domain.model;

import java.io.Serializable;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * HACCP 양식 업무 분류 조회조건을 위한 VO 클래스
 * @author SHMT-MES
 * @since 2026.07.07
 * @version 1.0
 */
@Schema(description = "HACCP 양식 업무 분류 검색 조건 모델")
@Getter
@Setter
public class HaccpBaseCategorySearchConditionVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "테넌트 ID")
    private Long tenantId;

    @Schema(description = "테넌트 코드")
    private String tenantCode;

    @Schema(description = "사용 여부")
    private String active;
}
