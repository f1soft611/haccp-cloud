package egovframework.let.platforms.tenants.domain.model;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;
import java.sql.Timestamp;

/**
 * 테넌트 정보 VO
 * 멀티테넌트 시스템에서 테넌트의 기본 정보를 담는 VO
 * 
 * @author 멀티테넌트팀
 * @since 2026-06-23
 */
@Getter
@Setter
public class TenantVO {

    @Schema(description = "테넌트 ID")
    private Long tenantId;

    @Schema(description = "테넌트 코드")
    private String tenantCode;

    @Schema(description = "테넌트명")
    private String tenantNm;

    @Schema(description = "관리자 이메일")
    private String adminEmail;

    @Schema(description = "법인번호")
    private String corporateNumber;

    @Schema(description = "업종")
    private String businessType;

    @Schema(description = "업태")
    private String businessCategory;

    @Schema(description = "로고 이미지 (Base64)")
    private String logoImage;

    @Schema(description = "온보딩 상태")
    private String onboardingStatus;

    @Schema(description = "생성일시")
    private Timestamp createdAt;

    @Schema(description = "수정일시")
    private Timestamp updatedAt;

    @Schema(description = "생성자 ID")
    private Long createdBy;

    @Schema(description = "사용 여부")
    private String useAt;
}
