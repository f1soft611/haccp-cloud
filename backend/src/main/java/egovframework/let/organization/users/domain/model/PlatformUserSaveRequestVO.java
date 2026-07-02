package egovframework.let.organization.users.domain.model;

import java.io.Serializable;
import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PlatformUserSaveRequestVO implements Serializable {

    private static final long serialVersionUID = 1L;

    private String name;
    private String email;
    private String department;
    private String roleCode;
    private List<String> roleCodes;
    private Boolean active;
    private String tenantCode;
}
