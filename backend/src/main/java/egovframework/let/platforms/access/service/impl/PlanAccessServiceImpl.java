package egovframework.let.platforms.access.service.impl;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;

import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import egovframework.let.platforms.access.service.PlanAccessService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service("planAccessService")
@RequiredArgsConstructor
public class PlanAccessServiceImpl implements PlanAccessService {

    private static final String ACTIVE_STATUS = "ACTIVE";
    private static final String FEATURE_TYPE_LIMIT = "LIMIT";
    private static final String ENABLED = "Y";

    private final JdbcTemplate jdbcTemplate;

    @Override
    public boolean isFeatureEnabled(Long tenantId, String featureCode) {
        if (tenantId == null || !StringUtils.hasText(featureCode)) {
            return false;
        }

        if (!isPlanSchemaReady()) {
            return true;
        }

        try {
            String sql = "" +
                    "SELECT pf.enabled_at " +
                    "FROM tb_tenant_subscription s " +
                    "JOIN tb_plan_feature pf ON pf.plan_id = s.plan_id " +
                    "WHERE s.tenant_id = ? " +
                    "  AND s.subscription_status = ? " +
                    "  AND s.starts_at <= CURRENT_TIMESTAMP " +
                    "  AND (s.ends_at IS NULL OR s.ends_at > CURRENT_TIMESTAMP) " +
                    "  AND pf.feature_code = ? " +
                    "ORDER BY s.starts_at DESC " +
                    "LIMIT 1";

            List<String> values = jdbcTemplate.query(
                    sql,
                    new Object[]{tenantId, ACTIVE_STATUS, featureCode.trim()},
                    (rs, rowNum) -> rs.getString("enabled_at")
            );

            if (values.isEmpty()) {
                return false;
            }

            return ENABLED.equalsIgnoreCase(values.get(0));
        } catch (DataAccessException ex) {
            log.warn("Plan feature check fallback to allow. tenantId={}, featureCode={}, reason={}",
                    tenantId, featureCode, ex.getMessage());
            return true;
        }
    }

    @Override
    public boolean isWithinLimit(Long tenantId, String featureCode) {
        if (tenantId == null || !StringUtils.hasText(featureCode)) {
            return false;
        }

        if (!isPlanSchemaReady()) {
            return true;
        }

        try {
            String sql = "" +
                    "SELECT pf.limit_value " +
                    "FROM tb_tenant_subscription s " +
                    "JOIN tb_plan_feature pf ON pf.plan_id = s.plan_id " +
                    "WHERE s.tenant_id = ? " +
                    "  AND s.subscription_status = ? " +
                    "  AND s.starts_at <= CURRENT_TIMESTAMP " +
                    "  AND (s.ends_at IS NULL OR s.ends_at > CURRENT_TIMESTAMP) " +
                    "  AND pf.feature_code = ? " +
                    "  AND pf.feature_type = ? " +
                    "  AND pf.enabled_at = ? " +
                    "ORDER BY s.starts_at DESC " +
                    "LIMIT 1";

            List<Long> limits = jdbcTemplate.query(
                    sql,
                    new Object[]{tenantId, ACTIVE_STATUS, featureCode.trim(), FEATURE_TYPE_LIMIT, ENABLED},
                    (rs, rowNum) -> rs.getLong("limit_value")
            );

            if (limits.isEmpty()) {
                return true;
            }

            Long limitValue = limits.get(0);
            long currentUsage = resolveCurrentUsage(tenantId, featureCode.trim());
            return currentUsage < limitValue;
        } catch (DataAccessException ex) {
            log.warn("Plan limit check fallback to allow. tenantId={}, featureCode={}, reason={}",
                    tenantId, featureCode, ex.getMessage());
            return true;
        }
    }

    @Override
    public String resolveActivePlanCode(Long tenantId) {
        if (tenantId == null) {
            return null;
        }

        if (!isPlanSchemaReady()) {
            return null;
        }

        try {
            String sql = "" +
                    "SELECT p.plan_code " +
                    "FROM tb_tenant_subscription s " +
                    "JOIN tb_plan p ON p.plan_id = s.plan_id " +
                    "WHERE s.tenant_id = ? " +
                    "  AND s.subscription_status = ? " +
                    "  AND s.starts_at <= CURRENT_TIMESTAMP " +
                    "  AND (s.ends_at IS NULL OR s.ends_at > CURRENT_TIMESTAMP) " +
                    "ORDER BY s.starts_at DESC " +
                    "LIMIT 1";

            List<String> planCodes = jdbcTemplate.query(
                    sql,
                    new Object[]{tenantId, ACTIVE_STATUS},
                    (rs, rowNum) -> rs.getString("plan_code")
            );

            return planCodes.isEmpty() ? null : planCodes.get(0);
        } catch (DataAccessException ex) {
            log.warn("Failed to resolve plan code. tenantId={}, reason={}", tenantId, ex.getMessage());
            return null;
        }
    }

    @Override
    public Long resolveTenantIdByTenantCode(String tenantCode) {
        if (!StringUtils.hasText(tenantCode)) {
            return null;
        }

        try {
            String sql = "SELECT tenant_id FROM tb_tenant WHERE tenant_code = ? LIMIT 1";
            List<Long> rows = jdbcTemplate.query(
                    sql,
                    new Object[]{tenantCode.trim()},
                    (rs, rowNum) -> rs.getLong("tenant_id")
            );
            return rows.isEmpty() ? null : rows.get(0);
        } catch (DataAccessException ex) {
            log.warn("Failed to resolve tenant id by code. tenantCode={}, reason={}", tenantCode, ex.getMessage());
            return null;
        }
    }

    @Override
    public Map<String, Boolean> resolveFeatureEnabledMap(Long tenantId) {
        if (tenantId == null || !isPlanSchemaReady()) {
            return Collections.emptyMap();
        }

        try {
            String sql = "" +
                    "SELECT pf.feature_code, pf.enabled_at " +
                    "FROM tb_tenant_subscription s " +
                    "JOIN tb_plan_feature pf ON pf.plan_id = s.plan_id " +
                    "WHERE s.tenant_id = ? " +
                    "  AND s.subscription_status = ? " +
                    "  AND s.starts_at <= CURRENT_TIMESTAMP " +
                    "  AND (s.ends_at IS NULL OR s.ends_at > CURRENT_TIMESTAMP)";

            Map<String, Boolean> featureMap = new LinkedHashMap<String, Boolean>();
            jdbcTemplate.query(sql, new Object[]{tenantId, ACTIVE_STATUS}, rs -> {
                String featureCode = rs.getString("feature_code");
                String enabledAt = rs.getString("enabled_at");
                featureMap.put(featureCode, ENABLED.equalsIgnoreCase(enabledAt));
            });

            return featureMap;
        } catch (DataAccessException ex) {
            log.warn("Failed to resolve feature map. tenantId={}, reason={}", tenantId, ex.getMessage());
            return Collections.emptyMap();
        }
    }

    @Override
    public List<Map<String, Object>> listPlans() {
        if (!isPlanSchemaReady()) {
            return Collections.emptyList();
        }

        try {
            String sql = "" +
                    "SELECT p.plan_code, p.plan_nm, p.plan_desc, p.use_at, " +
                    "       COUNT(DISTINCT pf.plan_feature_id) AS feature_count, " +
                    "       COUNT(DISTINCT pm.plan_menu_id) AS menu_count " +
                    "FROM tb_plan p " +
                    "LEFT JOIN tb_plan_feature pf ON pf.plan_id = p.plan_id " +
                    "LEFT JOIN tb_plan_menu pm ON pm.plan_id = p.plan_id AND pm.use_at = 'Y' " +
                    "GROUP BY p.plan_code, p.plan_nm, p.plan_desc, p.use_at " +
                    "ORDER BY p.plan_code";

            return jdbcTemplate.query(sql, (rs, rowNum) -> {
                Map<String, Object> row = new LinkedHashMap<String, Object>();
                row.put("planCode", rs.getString("plan_code"));
                row.put("planName", rs.getString("plan_nm"));
                row.put("planDesc", rs.getString("plan_desc"));
                row.put("useAt", rs.getString("use_at"));
                row.put("featureCount", rs.getInt("feature_count"));
                row.put("menuCount", rs.getInt("menu_count"));
                return row;
            });
        } catch (DataAccessException ex) {
            log.warn("Failed to list plans. reason={}", ex.getMessage());
            return Collections.emptyList();
        }
    }

    @Override
    public Map<String, Boolean> resolveFeatureEnabledMapByPlanCode(String planCode) {
        if (!StringUtils.hasText(planCode) || !isPlanSchemaReady()) {
            return Collections.emptyMap();
        }

        try {
            String sql = "" +
                    "SELECT pf.feature_code, pf.enabled_at " +
                    "FROM tb_plan p " +
                    "JOIN tb_plan_feature pf ON pf.plan_id = p.plan_id " +
                    "WHERE p.plan_code = ? " +
                    "ORDER BY pf.feature_code";

            Map<String, Boolean> featureMap = new LinkedHashMap<String, Boolean>();
            jdbcTemplate.query(sql, new Object[]{planCode.trim().toUpperCase()}, rs -> {
                String featureCode = rs.getString("feature_code");
                String enabledAt = rs.getString("enabled_at");
                featureMap.put(featureCode, ENABLED.equalsIgnoreCase(enabledAt));
            });
            return featureMap;
        } catch (DataAccessException ex) {
            log.warn("Failed to resolve plan feature map. planCode={}, reason={}", planCode, ex.getMessage());
            return Collections.emptyMap();
        }
    }

    @Override
    public List<Map<String, Object>> resolvePlanFeatureItems(String planCode) {
        if (!StringUtils.hasText(planCode) || !isPlanSchemaReady()) {
            return Collections.emptyList();
        }

        try {
            String sql = "" +
                    "SELECT pf.feature_code, pf.feature_nm, pf.feature_type, pf.enabled_at, pf.limit_value " +
                    "FROM tb_plan p " +
                    "JOIN tb_plan_feature pf ON pf.plan_id = p.plan_id " +
                    "WHERE p.plan_code = ? " +
                    "ORDER BY pf.feature_code";

            return jdbcTemplate.query(sql, new Object[]{planCode.trim().toUpperCase()}, (rs, rowNum) -> {
                Map<String, Object> row = new LinkedHashMap<String, Object>();
                row.put("featureCode", rs.getString("feature_code"));
                row.put("featureName", rs.getString("feature_nm"));
                row.put("featureType", rs.getString("feature_type"));
                row.put("enabled", ENABLED.equalsIgnoreCase(rs.getString("enabled_at")));
                row.put("limitValue", rs.getObject("limit_value"));
                return row;
            });
        } catch (DataAccessException ex) {
            log.warn("Failed to resolve plan feature items. planCode={}, reason={}", planCode, ex.getMessage());
            return Collections.emptyList();
        }
    }

    @Override
    public List<String> resolvePlanMenuCodes(String planCode) {
        if (!StringUtils.hasText(planCode) || !isPlanSchemaReady()) {
            return Collections.emptyList();
        }

        try {
            String sql = "" +
                    "SELECT pm.menu_code " +
                    "FROM tb_plan_menu pm " +
                    "JOIN tb_plan p ON p.plan_id = pm.plan_id " +
                    "WHERE p.plan_code = ? " +
                    "  AND pm.use_at = 'Y' " +
                    "ORDER BY pm.menu_code";

            return jdbcTemplate.query(
                    sql,
                    new Object[]{planCode.trim().toUpperCase()},
                    (rs, rowNum) -> rs.getString("menu_code"));
        } catch (DataAccessException ex) {
            log.warn("Failed to resolve plan menus. planCode={}, reason={}", planCode, ex.getMessage());
            return Collections.emptyList();
        }
    }

    @Override
    public List<String> resolveTenantPlanMenuCodes(String tenantCode) {
        if (!StringUtils.hasText(tenantCode)) {
            return Collections.emptyList();
        }

        Long tenantId = resolveTenantIdByTenantCode(tenantCode);
        if (tenantId == null) {
            return Collections.emptyList();
        }

        String planCode = resolveActivePlanCode(tenantId);
        if (!StringUtils.hasText(planCode)) {
            return Collections.emptyList();
        }

        return resolvePlanMenuCodes(planCode);
    }

    @Override
    public void replacePlanMenus(String planCode, List<String> menuCodes) {
        if (!StringUtils.hasText(planCode) || !isPlanSchemaReady()) {
            return;
        }

        String normalizedPlanCode = planCode.trim().toUpperCase();
        List<String> normalizedMenuCodes = new ArrayList<String>();
        if (menuCodes != null) {
            for (String menuCode : menuCodes) {
                if (StringUtils.hasText(menuCode)) {
                    normalizedMenuCodes.add(menuCode.trim().toUpperCase());
                }
            }
        }

        try {
            String deleteSql = "" +
                    "DELETE FROM tb_plan_menu " +
                    "WHERE plan_id = (SELECT plan_id FROM tb_plan WHERE plan_code = ? LIMIT 1)";
            jdbcTemplate.update(deleteSql, normalizedPlanCode);

            String insertSql = "" +
                    "INSERT INTO tb_plan_menu (plan_id, menu_code, use_at, created_at, updated_at) " +
                    "SELECT p.plan_id, ?, 'Y', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP " +
                    "FROM tb_plan p " +
                    "WHERE p.plan_code = ? " +
                    "ON CONFLICT (plan_id, menu_code) DO UPDATE " +
                    "SET use_at = 'Y', updated_at = CURRENT_TIMESTAMP";

            for (String menuCode : normalizedMenuCodes) {
                jdbcTemplate.update(insertSql, menuCode, normalizedPlanCode);
            }
        } catch (DataAccessException ex) {
            log.warn("Failed to replace plan menus. planCode={}, reason={}", planCode, ex.getMessage());
            throw ex;
        }
    }

    private long resolveCurrentUsage(Long tenantId, String featureCode) {
        if ("LIMIT_USER_COUNT".equals(featureCode)) {
            String sql = "SELECT COUNT(1) FROM tb_user WHERE tenant_id = ? AND use_at = 'Y'";
            Long count = jdbcTemplate.queryForObject(sql, Long.class, tenantId);
            return count == null ? 0L : count;
        }

        return 0L;
    }

    private boolean isPlanSchemaReady() {
        try {
            String sql = "" +
                    "SELECT COUNT(1) " +
                    "FROM information_schema.tables " +
                    "WHERE table_schema = 'public' " +
                    "  AND table_name IN ('tb_plan', 'tb_plan_feature', 'tb_tenant_subscription')";

            Integer count = jdbcTemplate.queryForObject(sql, Integer.class);
            return count != null && count >= 3;
        } catch (DataAccessException ex) {
            return false;
        }
    }
}
