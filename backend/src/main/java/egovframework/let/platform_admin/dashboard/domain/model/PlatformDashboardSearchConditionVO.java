package egovframework.let.platform_admin.dashboard.domain.model;

import java.io.Serializable;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 플랫폼 대시보드 검색 조건 VO
 * @author SHMT-MES
 * @since 2026.06.22
 * @version 1.0
 * @see
 *
 * <pre>
 * << 개정이력(Modification Information) >>
 *
 *   수정일      수정자           수정내용
 *  -------    --------    ---------------------------
 *   2026.06.22 SHMT-MES          최초 생성
 *
 * </pre>
 */
@Schema(description = "플랫폼 대시보드 검색 조건 VO")
@Getter
@Setter
public class PlatformDashboardSearchConditionVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "페이지 인덱스")
    private int pageIndex = 0;

    @Schema(description = "페이지 크기")
    private int pageSize = 10;

    @Schema(description = "검색 필드")
    private String searchField;

    @Schema(description = "검색어")
    private String searchKeyword;

    @Schema(description = "상태 필터")
    private String status = "all";
}
