package egovframework.let.documents.haccpwork.domain.model;

import java.io.Serializable;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

@Schema(description = "HACCP 결재 댓글 등록 요청 모델")
@Getter
@Setter
public class HaccpWorkApprovalCommentCreateRequestVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "댓글 내용")
    private String comment;

    @Schema(description = "부모 댓글 ID(대댓글 등록 시)")
    private Long parentCommentId;
}
