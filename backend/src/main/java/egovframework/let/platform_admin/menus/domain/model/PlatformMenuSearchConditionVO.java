package egovframework.let.platform_admin.menus.domain.model;

import java.io.Serializable;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 플랫폼 메뉴 검색 조건 VO
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
@Schema(description = "플랫폼 메뉴 검색 조건 VO")
@Getter
@Setter
public class PlatformMenuSearchConditionVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "페이지 번호")
    private int pageIndex = 1;

    @Schema(description = "페이지 크기")
    private int pageSize = 10;

    @Schema(description = "검색 필드")
    private String searchField;

    @Schema(description = "검색어")
    private String searchKeyword;

    @Schema(description = "사용 여부")
    private String useAt = "all";

    @Schema(description = "상위 메뉴 ID")
    private String parentMenuId;
}
