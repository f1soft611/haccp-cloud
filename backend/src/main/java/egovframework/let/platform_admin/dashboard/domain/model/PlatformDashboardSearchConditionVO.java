package egovframework.let.platform_admin.dashboard.domain.model;

import java.io.Serializable;

import lombok.Getter;
import lombok.Setter;

/**
 * 플랫폼 대시보드 검색 조건 VO
 * @author AI Assistant
 * @since 2026.06.22
 * @version 1.0
 */
@Getter
@Setter
public class PlatformDashboardSearchConditionVO implements Serializable {

    private static final long serialVersionUID = 1L;

    private int pageIndex = 0;
    private int pageSize = 10;
    private String searchField;
    private String searchKeyword;
    private String status = "all";
}
