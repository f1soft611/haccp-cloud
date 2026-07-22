package egovframework.let.documents.portal.domain.model;

import java.io.Serializable;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * HACCP 문서포탈 조회 조건 모델
 */
@Schema(description = "HACCP 문서포탈 검색 조건")
@Getter
@Setter
public class HaccpPortalDocumentSearchConditionVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "테넌트 코드")
    private String tenantCode;
}
