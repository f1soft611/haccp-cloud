package egovframework.let.platforms.users.domain.model;

import egovframework.com.cmm.ComDefaultVO;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PlatformUserSearchConditionVO extends ComDefaultVO {

    private static final long serialVersionUID = 1L;

    private String tenantCode;
    private String keyword;
    private String filterActive = "all";
}
