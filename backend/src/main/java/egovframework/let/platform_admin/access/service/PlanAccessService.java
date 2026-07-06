package egovframework.let.platform_admin.access.service;

import java.util.Map;
import java.util.List;

import egovframework.let.platform_admin.access.domain.model.PlanFeatureItemVO;
import egovframework.let.platform_admin.access.domain.model.PlanSummaryVO;

/**
 * 플랜 접근 제어 서비스
 * @author SHMT-MES
 * @since 2026.07.03
 * @version 1.0
 * @see
 *
 * <pre>
 * << 개정이력(Modification Information) >>
 *
 *   수정일      수정자           수정내용
 *  -------    --------    ---------------------------
 *   2026.07.03 SHMT-MES          최초 생성
 *
 * </pre>
 */
public interface PlanAccessService {

    boolean isFeatureEnabled(Long tenantId, String featureCode);

    boolean isWithinLimit(Long tenantId, String featureCode);

    String resolveActivePlanCode(Long tenantId);

    Long resolveTenantIdByTenantCode(String tenantCode);

    Map<String, Boolean> resolveFeatureEnabledMap(Long tenantId);

    List<PlanSummaryVO> listPlans();

    Map<String, Boolean> resolveFeatureEnabledMapByPlanCode(String planCode);

    List<PlanFeatureItemVO> resolvePlanFeatureItems(String planCode);

    List<String> resolvePlanMenuCodes(String planCode);

    List<String> resolveTenantPlanMenuCodes(String tenantCode);

    void replacePlanMenus(String planCode, List<String> menuCodes);
}
