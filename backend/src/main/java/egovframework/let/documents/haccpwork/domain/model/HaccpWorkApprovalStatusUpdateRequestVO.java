package egovframework.let.documents.haccpwork.domain.model;

import java.io.Serializable;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * HACCP 업무 결재 상태 업데이트 요청을 위한 VO 클래스
 */
@Schema(description = "HACCP 업무 결재 상태 업데이트 요청 모델")
@Getter
@Setter
public class HaccpWorkApprovalStatusUpdateRequestVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "결재 이벤트 코드(review_approve/review_return/final_approve/reference_confirm/submit_cancel)")
    private String eventType;

    @Schema(description = "결재 코멘트")
    private String comment;
}
