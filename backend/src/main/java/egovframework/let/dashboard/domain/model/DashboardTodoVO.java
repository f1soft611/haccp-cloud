package egovframework.let.dashboard.domain.model;

import java.io.Serializable;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 대시보드 할일 응답을 위한 VO 클래스
 */
@Schema(description = "대시보드 할일 모델")
@Getter
@Setter
public class DashboardTodoVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "업무 ID")
    private Long draftingWorkCategoryId;

    @Schema(description = "결재 문서 ID")
    private Long electronicApprovalId;

    @Schema(description = "테넌트 코드")
    private String tenantCode;

    @Schema(description = "분류 코드")
    private String categoryCode;

    @Schema(description = "분류명")
    private String categoryName;

    @Schema(description = "분류 정렬순서")
    private Integer categorySortOrder;

    @Schema(description = "구분코드")
    private String divisionCode;

    @Schema(description = "구분명")
    private String divisionName;

    @Schema(description = "등록주기")
    private String cycle;

    @Schema(description = "담당자")
    private String owner;

    @Schema(description = "결재 상태")
    private String todoStatus;

    @Schema(description = "결재 진행 상태 코드")
    private String approvalStatusType;

    @Schema(description = "결재 진행 상태명")
    private String approvalStatusTypeName;

    @Schema(description = "최종 상태 반영 일시")
    private String latestStatusAt;

    @Schema(description = "템플릿 JSON 문자열")
    private String templateJson;

    @Schema(description = "템플릿 HTML 문자열")
    private String templateHtml;

    @Schema(description = "템플릿 저장 여부")
    private boolean hasDocument;

    @Schema(description = "주기 내 작성 여부")
    private boolean writtenInCycle;

    @Schema(description = "결재 알림 대상 여부(arrival_at 있음 + exe_at 없음)")
    private boolean pendingApprovalAlert;

    @Schema(description = "결재 알림 도착 일시")
    private String pendingArrivalAt;
}
