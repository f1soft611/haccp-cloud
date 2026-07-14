package egovframework.let.organization.authorities.domain.model;

import java.io.Serializable;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 플랫폼 권한/역할 검색 조건을 위한 VO 클래스
 * @author SHMT-MES
 * @since 2026.07.14
 * @version 1.0
 */
@Schema(description = "플랫폼 권한/역할 검색 조건 모델")
@Getter
@Setter
public class AuthoritySearchConditionVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "페이지 인덱스")
    private int pageIndex = 1;

    @Schema(description = "페이지 크기")
    private int pageSize = 10;

    @Schema(description = "검색 필드")
    private String searchField;

    @Schema(description = "검색 키워드")
    private String searchKeyword;

    @Schema(description = "사용 여부")
    private String useAt = "all";
}
