package egovframework.let.platform_admin.menus.domain.model;

import java.io.Serializable;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 플랫폼 메뉴 모델 VO
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
@Schema(description = "플랫폼 메뉴 모델 VO")
@Getter
@Setter
public class PlatformMenuModelVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "메뉴 ID")
    private String menuId;

    @Schema(description = "메뉴명")
    private String menuNm;

    @Schema(description = "메뉴 설명")
    private String menuDc;

    @Schema(description = "상위 메뉴 ID")
    private String parentMenuId;

    @Schema(description = "메뉴 URL")
    private String menuUrl;

    @Schema(description = "사용 여부")
    private String useAt;
}
