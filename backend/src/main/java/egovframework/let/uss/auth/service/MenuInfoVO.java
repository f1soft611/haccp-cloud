package egovframework.let.uss.auth.service;

import java.io.Serializable;
import java.util.Date;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 메뉴 정보 VO 클래스
 * @author SHMT-MES
 * @since 2024.01.01
 * @version 1.0
 */
@Schema(description = "메뉴 정보 VO")
@Getter
@Setter
public class MenuInfoVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "메뉴 ID")
    private String menuId = "";

    @Schema(description = "메뉴명")
    private String menuNm = "";

    @Schema(description = "메뉴 설명")
    private String menuDc = "";

    @Schema(description = "상위 메뉴 ID")
    private String parentMenuId = "";

    @Schema(description = "메뉴 순서")
    private int menuOrdr = 0;

    @Schema(description = "메뉴 URL")
    private String menuUrl = "";

    @Schema(description = "아이콘명")
    private String iconNm = "";

    @Schema(description = "사용여부")
    private String useAt = "Y";

    @Schema(description = "최초등록일시")
    private Date frstRegistPnttm;

    @Schema(description = "최초등록자ID")
    private String frstRegisterId = "";

    @Schema(description = "최종수정일시")
    private Date lastUpdtPnttm;

    @Schema(description = "최종수정자ID")
    private String lastUpdusrId = "";

    // 추가 필드 (조회용)
    @Schema(description = "상위 메뉴명")
    private String parentMenuNm = "";

    @Schema(description = "하위 메뉴 여부")
    private boolean hasChildren = false;

    @Schema(description = "권한 레벨")
    private String permissionLevel = "";

    @Schema(description = "접근 가능 여부")
    private boolean accessible = false;
}