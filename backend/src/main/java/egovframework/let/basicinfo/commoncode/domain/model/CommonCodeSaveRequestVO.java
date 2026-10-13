package egovframework.let.basicinfo.commoncode.domain.model;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 공통코드 저장 요청 VO 클래스 (그룹 저장은 groups, 상세 저장은 details만 사용)
 * @author SHMT-MES
 * @since 2026.10.08
 * @version 1.0
 */
@Schema(description = "공통코드 저장 요청 모델")
@Getter
@Setter
public class CommonCodeSaveRequestVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "그룹 목록")
    private List<CommonCodeGroupVO> groups = new ArrayList<CommonCodeGroupVO>();

    @Schema(description = "상세 목록")
    private List<CommonCodeItemVO> details = new ArrayList<CommonCodeItemVO>();

    @Schema(hidden = true)
    private String tenantCode;

    @Schema(hidden = true)
    private Long operatorTenantId;

    @Schema(hidden = true)
    private String operatorLoginCode;
}