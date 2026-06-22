package egovframework.let.platforms.menus.domain.model;

import java.io.Serializable;

import lombok.Getter;
import lombok.Setter;

/**
 * 플랫폼 메뉴 모델 VO
 * @author AI Assistant
 * @since 2026.06.22
 * @version 1.0
 */
@Getter
@Setter
public class PlatformMenuModelVO implements Serializable {

    private static final long serialVersionUID = 1L;

    private String menuId;
    private String menuNm;
    private String menuDc;
    private String parentMenuId;
    private String menuUrl;
    private String useAt;
}
