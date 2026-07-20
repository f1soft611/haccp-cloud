package egovframework.let.documents.haccpwork.domain.model;

import java.io.Serializable;
import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * HACCP 업무 기안 결재신청 요청을 위한 VO 클래스
 */
@Schema(description = "HACCP 업무 기안 결재신청 요청 모델")
@Getter
@Setter
public class HaccpWorkDraftSubmitRequestVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "기안 제목")
    private String title;

    @Schema(description = "기안 본문 JSON 문자열")
    private String templateJson;

    @Schema(description = "기안 본문 HTML 문자열")
    private String templateHtml;

    @Schema(description = "결재신청 코멘트")
    private String submitComment;

    @Schema(description = "참조자 ID 목록(userId/loginId)")
    private List<String> referenceIds;
}
