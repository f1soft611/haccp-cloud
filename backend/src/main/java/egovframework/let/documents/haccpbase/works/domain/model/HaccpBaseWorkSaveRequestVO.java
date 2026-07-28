package egovframework.let.documents.haccpbase.works.domain.model;

import java.io.Serializable;
import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * HACCP 양식 업무 저장 요청을 위한 VO 클래스
 * @author SHMT-MES
 * @since 2026.07.07
 * @version 1.0
 */
@Schema(description = "HACCP 양식 업무 저장 요청 모델")
@Getter
@Setter
public class HaccpBaseWorkSaveRequestVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "테넌트 코드")
    private String tenantCode;

    @Schema(description = "분류 ID")
    private Long categoryGroupId;

    @Schema(description = "구분코드")
    private String divisionCode;

    @Schema(description = "구분명")
    private String divisionName;

    @Schema(description = "등록주기")
    private String cycle;

    @Schema(description = "사용 여부")
    private Boolean active;

    @Schema(description = "검토자 로그인 ID")
    private Long reviewerId;

    @Schema(description = "승인자 로그인 ID")
    private Long approverId;

    @Schema(description = "업무 담당자 사번 목록")
    private List<String> assigneeIds;
}
