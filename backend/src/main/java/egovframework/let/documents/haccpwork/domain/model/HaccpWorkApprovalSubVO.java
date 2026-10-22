package egovframework.let.documents.haccpwork.domain.model;

import java.io.Serializable;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * HCP 업무(만료일 관리 양식) 기안 sub 값 VO 클래스
 */
@Schema(description = "HCP 업무 기안 sub 값 모델")
@Getter
@Setter
public class HaccpWorkApprovalSubVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "설비 ID (HCP-CALIB)")
    private Long equipmentId;

    @Schema(description = "품목유형 공통코드 MATERIAL_TYPE item_code (HCP-VALID, HCP-SQI)")
    private String materialType;

    @Schema(description = "증명서 소유 사원 user_id (HCP-HCERT)")
    private Long certificationUserId;

    @Schema(description = "검사일(yyyy-MM-dd)")
    private String inspectedDate;

    @Schema(description = "만료일(yyyy-MM-dd)")
    private String expirationDate;
}