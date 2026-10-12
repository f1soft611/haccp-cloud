package egovframework.let.basicinfo.commoncode.domain.model;

import java.io.Serializable;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 공통코드 그룹 VO 클래스
 * @author SHMT-MES
 * @since 2026.10.08
 * @version 1.0
 */
@Schema(description = "공통코드 그룹 모델")
@Getter
@Setter
public class CommonCodeGroupVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "그룹코드")
    private String groupCode;

    @Schema(description = "그룹명")
    private String groupName;

    @Schema(description = "그룹 설명")
    private String groupDesc;
}