package egovframework.let.documents.haccpbase.works.domain.model;

import java.io.Serializable;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * HACCP 양식 업무 템플릿 저장 요청을 위한 VO 클래스
 */
@Schema(description = "HACCP 양식 업무 템플릿 저장 요청 모델")
@Getter
@Setter
public class HaccpBaseWorkTemplateSaveRequestVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "템플릿 JSON 문자열")
    private String templateJson;

    @Schema(description = "템플릿 HTML 문자열")
    private String templateHtml;
}
