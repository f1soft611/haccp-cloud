package egovframework.let.organization.authorities.domain.model;

import java.io.Serializable;

import lombok.Getter;
import lombok.Setter;

/**
 * 플랫폼 역할 모델 VO
 * @author AI Assistant
 * @since 2026.06.22
 * @version 1.0
 */
@Getter
@Setter
public class AuthorityModelVO implements Serializable {

    private static final long serialVersionUID = 1L;

    private String roleCode;
    private String roleNm;
    private String roleDc;
    private String useAt;
}
