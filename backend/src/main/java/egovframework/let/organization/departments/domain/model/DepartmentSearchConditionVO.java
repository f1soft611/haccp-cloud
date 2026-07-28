package egovframework.let.organization.departments.domain.model;

import java.io.Serializable;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 부서 검색 조건을 위한 VO 클래스
 * @author SHMT-MES
 * @since 2026.07.14
 * @version 1.0
 */
@Schema(description = "부서 검색 조건 모델")
@Getter
@Setter
public class DepartmentSearchConditionVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "테넌트 코드")
    private String tenantCode;

    @Schema(description = "부서명")
    private String name;

    @Schema(description = "사용 여부")
    private String active;
}
