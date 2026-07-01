package egovframework.let.platforms.departments.domain.model;

import java.io.Serializable;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DepartmentVO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long departmentId;
    private String tenantCode;
    private String name;
    private Long parentId;
    private String parentName;
    private int sortOrder;
    private boolean active;
    private boolean hasChildren;
}
