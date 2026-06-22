package egovframework.let.platforms.factories.domain.model;

import lombok.Getter;
import lombok.Setter;

/**
 * 플랫폼 공장 모델 VO
 * @author AI Assistant
 * @since 2026.06.22
 * @version 1.0
 */
@Getter
@Setter
public class PlatformTenantDashboardSummaryVO {

    private int total;
    private int active;
    private int inactive;
}
