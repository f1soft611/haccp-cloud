package egovframework.let.documents.haccpwork.domain.model;

import java.io.Serializable;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

@Schema(description = "HACCP 결재 댓글 수정 요청 모델")
@Getter
@Setter
public class HaccpWorkApprovalCommentUpdateRequestVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "댓글 내용")
    private String comment;
}