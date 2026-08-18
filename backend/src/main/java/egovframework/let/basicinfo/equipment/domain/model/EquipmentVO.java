package egovframework.let.basicinfo.equipment.domain.model;

import java.io.Serializable;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 설비 응답을 위한 VO 클래스
 * @author SHMT-MES
 * @since 2026.08.14
 * @version 1.0
 */
@Schema(description = "설비 모델")
@Getter
@Setter
public class EquipmentVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "설비 ID")
    private Long equipmentId;

    @Schema(description = "테넌트 코드")
    private String tenantCode;

    @Schema(description = "관리코드")
    private String equipSysCd;

    @Schema(description = "설비코드")
    private String equipCd;

    @Schema(description = "설비명")
    private String equipNm;

    @Schema(description = "설비종류")
    private String equipKind;

    @Schema(description = "구입일(YYYY-MM-DD)")
    private String purDate;

    @Schema(description = "구입처")
    private String purCust;

    @Schema(description = "제조사")
    private String makCust;

    @Schema(description = "설비규격")
    private String equipSpec;

    @Schema(description = "설치장소")
    private String location;

    @Schema(description = "비고")
    private String bigo;

    @Schema(description = "사용 여부")
    private boolean active;
}
