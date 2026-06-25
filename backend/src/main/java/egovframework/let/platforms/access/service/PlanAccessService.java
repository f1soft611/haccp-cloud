package egovframework.let.platforms.access.service;

import java.util.Map;
import java.util.List;

public interface PlanAccessService {

    boolean isFeatureEnabled(Long tenantId, String featureCode);

    boolean isWithinLimit(Long tenantId, String featureCode);

    String resolveActivePlanCode(Long tenantId);

    Long resolveTenantIdByTenantCode(String tenantCode);

    Map<String, Boolean> resolveFeatureEnabledMap(Long tenantId);

    List<Map<String, Object>> listPlans();

    Map<String, Boolean> resolveFeatureEnabledMapByPlanCode(String planCode);

    List<Map<String, Object>> resolvePlanFeatureItems(String planCode);

    List<String> resolvePlanMenuCodes(String planCode);

    List<String> resolveTenantPlanMenuCodes(String tenantCode);

    void replacePlanMenus(String planCode, List<String> menuCodes);
}
