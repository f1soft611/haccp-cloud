package egovframework.let.organization.departments.domain.model;

import java.io.Serializable;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DepartmentSaveRequestVO implements Serializable {

    private static final long serialVersionUID = 1L;

    private String tenantCode;
    private String name;
    private Long parentId;
    private int sortOrder;
    private Boolean active;
}
