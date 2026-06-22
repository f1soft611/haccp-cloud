package egovframework.let.platforms.authorities.domain.model;

import java.io.Serializable;

import lombok.Getter;
import lombok.Setter;

/**
 * 플랫폼 권한 모델 VO
 * @author AI Assistant
 * @since 2026.06.22
 * @version 1.0
 */
@Getter
@Setter
public class PlatformAuthorityModelVO implements Serializable {

    private static final long serialVersionUID = 1L;

    private String authorityCode;
    private String authorityNm;
    private String authorityDc;
    private String useAt;
}
