package egovframework.let.platforms.authorities.domain.model;

import java.io.Serializable;

import lombok.Getter;
import lombok.Setter;

/**
 * 플랫폼 권한 검색 조건 VO
 * @author AI Assistant
 * @since 2026.06.22
 * @version 1.0
 */
@Getter
@Setter
public class PlatformAuthoritySearchConditionVO implements Serializable {

    private static final long serialVersionUID = 1L;

    private int pageIndex = 1;
    private int pageSize = 10;
    private String searchField;
    private String searchKeyword;
    private String useAt = "all";
}
