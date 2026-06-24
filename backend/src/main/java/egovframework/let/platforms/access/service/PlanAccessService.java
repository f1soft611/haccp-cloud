package egovframework.let.platforms.access.service;

import java.util.Map;

public interface PlanAccessService {

    boolean isFeatureEnabled(Long tenantId, String featureCode);

    boolean isWithinLimit(Long tenantId, String featureCode);

    String resolveActivePlanCode(Long tenantId);

    Long resolveTenantIdByTenantCode(String tenantCode);

    Map<String, Boolean> resolveFeatureEnabledMap(Long tenantId);
}
