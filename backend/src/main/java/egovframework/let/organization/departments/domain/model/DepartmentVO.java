package egovframework.let.organization.departments.domain.model;

import java.io.Serializable;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 부서 응답을 위한 VO 클래스
 * @author SHMT-MES
 * @since 2026.07.14
 * @version 1.0
 */
@Schema(description = "부서 모델")
@Getter
@Setter
public class DepartmentVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "부서 ID")
    private Long departmentId;

    @Schema(description = "테넌트 코드")
    private String tenantCode;

    @Schema(description = "부서명")
    private String name;

    @Schema(description = "상위 부서 ID")
    private Long parentId;

    @Schema(description = "상위 부서명")
    private String parentName;

    @Schema(description = "정렬 순서")
    private int sortOrder;

    @Schema(description = "사용 여부")
    private boolean active;

    @Schema(description = "하위 부서 존재 여부")
    private boolean hasChildren;
}
