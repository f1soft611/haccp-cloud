package egovframework.let.platforms.users.domain.model;

import java.io.Serializable;
import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PlatformUserVO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long userId;
    private Long loginId;
    private String tenantCode;
    private String userNm;
    private String emailAddr;
    private String departmentNm;
    private String roleCode;
    private List<String> roleCodes;
    private boolean active;
    private String loginCode;
    private String useAt;
    private String loginUseAt;
}
