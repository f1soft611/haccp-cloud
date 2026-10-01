package egovframework.let.documents.haccpwork.domain.model;

import java.io.Serializable;
import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * HACCP 업무 조회조건을 위한 VO 클래스
 * @author SHMT-MES
 * @since 2026.07.16
 * @version 1.0
 */
@Schema(description = "HACCP 업무 검색 조건 모델")
@Getter
@Setter
public class HaccpWorkSearchConditionVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "테넌트 ID")
    private Long tenantId;

    @Schema(description = "테넌트 코드")
    private String tenantCode;

    @Schema(description = "요청 사용자 로그인 ID")
    private Long actorLoginId;

    @Schema(description = "요청 사용자 사용자ID")
    private Long actorUserId;

    @Schema(description = "요청 사용자 로그인 코드")
    private String actorLoginCode;

    @Schema(description = "요청 사용자 역할 코드")
    private String actorRoleCode;

    @Schema(description = "업무 구분")
    private String workType;

    @Schema(description = "업무구분명")
    private String workDivision;

    @Schema(description = "업무구분 ID")
    private String workDivisionId;

    @Schema(description = "기안 번호")
    private String draftNumber;

    @Schema(description = "제목")
    private String title;

    @Schema(description = "작성자")
    private String writer;

    @Schema(description = "참여유형(DRAFTER/APPROVER/REFERENCE)")
    private String participantType;

    @Schema(description = "참여유형 목록(DRAFTER/APPROVER/REFERENCE)")
    private List<String> participantTypes;

    @Schema(description = "상태 코드(pre_apply/in_progress/approved/rejected)")
    private String statusType;

    @Schema(description = "조회 시작일(yyyy-MM-dd)")
    private String startDate;

    @Schema(description = "조회 종료일(yyyy-MM-dd)")
    private String endDate;

    @Schema(description = "현재 페이지(1-base)")
    private int pageIndex = 1;

    @Schema(description = "페이지 크기")
    private int pageSize = 10;

    @Schema(description = "UI 페이지 단위")
    private int pageUnit = 10;

    @Schema(description = "조회 시작 offset")
    private int firstIndex = 0;

    @Schema(description = "조회 종료 offset")
    private int lastIndex = 0;

    @Schema(description = "조회 건수")
    private int recordCountPerPage = 10;
}
