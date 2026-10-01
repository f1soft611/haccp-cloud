package egovframework.let.basicinfo.materials.domain.model;

import egovframework.com.cmm.ComDefaultVO;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 품목 검색 조건을 위한 VO 클래스
 * @author SHMT-MES
 * @since 2026.08.14
 * @version 1.0
 */
@Schema(description = "품목 검색 조건 모델")
@Getter
@Setter
public class MaterialSearchConditionVO extends ComDefaultVO {

    private static final long serialVersionUID = 1L;

    @Schema(description = "테넌트 코드")
    private String tenantCode;

    @Schema(description = "검색 키워드")
    private String keyword;
}
