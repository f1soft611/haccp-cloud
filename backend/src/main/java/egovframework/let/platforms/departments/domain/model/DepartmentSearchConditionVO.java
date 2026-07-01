package egovframework.let.platforms.departments.domain.model;

import java.io.Serializable;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DepartmentSearchConditionVO implements Serializable {

    private static final long serialVersionUID = 1L;

    private String tenantCode;
    private String name;
    private String active; // 'Y', 'N', null(전체)
}
