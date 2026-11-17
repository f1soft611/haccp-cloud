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

    @Schema(description = "주기 반복 기준(DATE/WEEKDAY), 비면 DATE")
    private String cycleAnchorType;

    @Schema(description = "업무 기준일(yyyy-MM-dd), 일자 기준일 때. 비면 기준 없음")
    private String workStartDate;

    @Schema(description = "시작 연월(yyyy-MM), 주차 기준일 때. 서버가 시작일을 계산한다")
    private String workStartMonth;

    @Schema(description = "주차 기준 주차(1~4, 9=마지막 주)")
    private Integer cycleAnchorWeek;

    @Schema(description = "주차 기준 요일(1=월~7=일)")
    private Integer cycleAnchorWeekday;

    @Schema(description = "사용 여부")
    private Boolean active;

    @Schema(description = "만료일 관리 양식 여부(수시 등록주기만 true 허용)")
    private Boolean expirationApply;

    @Schema(description = "만료일 안내 기준(공통코드 EXPIRY_STATUS: NONE/DAY/MONTH/YEAR, 만료일 관리 양식만 사용)")
    private String expirationNoticeStatus;

    @Schema(description = "만료일 안내 계산숫자(만료일 N일/개월/년 전)")
    private Integer expirationNoticeCount;

    @Schema(description = "결재 적용 여부")
    private Boolean approvalApply;

    @Schema(description = "검토자 로그인 ID")
    private Long reviewerId;

    @Schema(description = "승인자 로그인 ID")
    private Long approverId;

    @Schema(description = "업무 담당자 사번 목록")
    private List<String> assigneeIds;
}
