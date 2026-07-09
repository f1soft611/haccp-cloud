package egovframework.let.documents.haccpbase.works.domain.model;

import java.io.Serializable;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * HACCP 양식 업무 응답을 위한 VO 클래스
 * @author SHMT-MES
 * @since 2026.07.07
 * @version 1.0
 */
@Schema(description = "HACCP 양식 업무 모델")
@Getter
@Setter
public class HaccpBaseWorkVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "업무 ID")
    private Long draftingWorkCategoryId;

    @Schema(description = "테넌트 코드")
    private String tenantCode;

    @Schema(description = "분류 ID")
    private Long categoryGroupId;

    @Schema(description = "분류 코드")
    private String categoryCode;

    @Schema(description = "분류명")
    private String categoryName;

    @Schema(description = "구분코드")
    private String divisionCode;

    @Schema(description = "구분명")
    private String divisionName;

    @Schema(description = "등록주기")
    private String cycle;

    @Schema(description = "사용 여부")
    private boolean active;

    @Schema(description = "등록자")
    private String createdBy;

    @Schema(description = "등록일시")
    private String createdAt;

    @Schema(description = "담당자")
    private String owner;

    @Schema(description = "업무 담당자 요약")
    private String assigneeSummary;

    @Schema(description = "업무 담당자 사번 CSV")
    private String assigneeIdsCsv;

    @Schema(description = "검토자 로그인 ID")
    private Long reviewerId;

    @Schema(description = "검토자명")
    private String reviewerName;

    @Schema(description = "승인자 로그인 ID")
    private Long approverId;

    @Schema(description = "승인자명")
    private String approverName;

    @Schema(description = "담당자 세팅 여부")
    private boolean assigneeMapped;

    @Schema(description = "업무 템플릿 JSON 문자열")
    private String templateJson;

    @Schema(description = "업무 템플릿 HTML 문자열")
    private String templateHtml;
}
