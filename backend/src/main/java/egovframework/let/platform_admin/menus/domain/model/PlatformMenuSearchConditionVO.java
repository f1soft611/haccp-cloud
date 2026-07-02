package egovframework.let.platform_admin.menus.domain.model;

import java.io.Serializable;

import lombok.Getter;
import lombok.Setter;

/**
 * 플랫폼 메뉴 검색 조건 VO
 * @author AI Assistant
 * @since 2026.06.22
 * @version 1.0
 */
@Getter
@Setter
public class PlatformMenuSearchConditionVO implements Serializable {

    private static final long serialVersionUID = 1L;

    private int pageIndex = 1;
    private int pageSize = 10;
    private String searchField;
    private String searchKeyword;
    private String useAt = "all";
    private String parentMenuId;
}
