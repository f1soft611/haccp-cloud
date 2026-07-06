package egovframework.let.platform_admin.access.service.impl;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;

import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import egovframework.let.platform_admin.access.domain.repository.PlanAccessDAO;
import egovframework.let.platform_admin.access.domain.model.PlanFeatureItemVO;
import egovframework.let.platform_admin.access.domain.model.PlanFeatureStatusVO;
import egovframework.let.platform_admin.access.domain.model.PlanSummaryVO;
import egovframework.let.platform_admin.access.service.PlanAccessService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 플랜 접근 제어 서비스 구현체
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
@Slf4j
@Service("planAccessService")
@RequiredArgsConstructor
public class PlanAccessServiceImpl implements PlanAccessService {

    private static final String ACTIVE_STATUS = "ACTIVE";
    private static final String FEATURE_TYPE_LIMIT = "LIMIT";
    private static final String ENABLED = "Y";

    private final PlanAccessDAO planAccessDAO;

    @Override
    public boolean isFeatureEnabled(Long tenantId, String featureCode) {
        if (tenantId == null || !StringUtils.hasText(featureCode)) {
            return false;
        }

        if (!isPlanSchemaReady()) {
            return true;
        }

        try {
            String enabledAt = planAccessDAO.selectLatestFeatureEnabledAt(
                    tenantId,
                    ACTIVE_STATUS,
                    featureCode.trim());

            if (!StringUtils.hasText(enabledAt)) {
                return false;
            }

            return ENABLED.equalsIgnoreCase(enabledAt);
        } catch (DataAccessException ex) {
            log.warn("Plan feature check fallback to allow. tenantId={}, featureCode={}, reason={}",
                    tenantId, featureCode, ex.getMessage());
            return true;
        } catch (Exception ex) {
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
            Long limitValue = planAccessDAO.selectLatestFeatureLimitValue(
                    tenantId,
                    ACTIVE_STATUS,
                    featureCode.trim(),
                    FEATURE_TYPE_LIMIT,
                    ENABLED);

            if (limitValue == null) {
                return true;
            }

            long currentUsage = resolveCurrentUsage(tenantId, featureCode.trim());
            return currentUsage < limitValue;
        } catch (DataAccessException ex) {
            log.warn("Plan limit check fallback to allow. tenantId={}, featureCode={}, reason={}",
                    tenantId, featureCode, ex.getMessage());
            return true;
        } catch (Exception ex) {
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
            return planAccessDAO.selectActivePlanCode(tenantId, ACTIVE_STATUS);
        } catch (DataAccessException ex) {
            log.warn("Failed to resolve plan code. tenantId={}, reason={}", tenantId, ex.getMessage());
            return null;
        } catch (Exception ex) {
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
            return planAccessDAO.selectTenantIdByTenantCode(tenantCode.trim());
        } catch (DataAccessException ex) {
            log.warn("Failed to resolve tenant id by code. tenantCode={}, reason={}", tenantCode, ex.getMessage());
            return null;
        } catch (Exception ex) {
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
            Map<String, Boolean> featureMap = new LinkedHashMap<String, Boolean>();
            List<PlanFeatureStatusVO> rows = planAccessDAO.selectFeatureEnabledListByTenantId(tenantId, ACTIVE_STATUS);
            for (PlanFeatureStatusVO row : rows) {
                featureMap.put(row.getFeatureCode(), ENABLED.equalsIgnoreCase(row.getEnabledAt()));
            }

            return featureMap;
        } catch (DataAccessException ex) {
            log.warn("Failed to resolve feature map. tenantId={}, reason={}", tenantId, ex.getMessage());
            return Collections.emptyMap();
        } catch (Exception ex) {
            log.warn("Failed to resolve feature map. tenantId={}, reason={}", tenantId, ex.getMessage());
            return Collections.emptyMap();
        }
    }

    @Override
    public List<PlanSummaryVO> listPlans() {
        if (!isPlanSchemaReady()) {
            return Collections.emptyList();
        }

        try {
            return planAccessDAO.selectPlanList();
        } catch (DataAccessException ex) {
            log.warn("Failed to list plans. reason={}", ex.getMessage());
            return Collections.emptyList();
        } catch (Exception ex) {
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
            Map<String, Boolean> featureMap = new LinkedHashMap<String, Boolean>();
            List<PlanFeatureStatusVO> rows = planAccessDAO.selectFeatureEnabledListByPlanCode(planCode.trim().toUpperCase());
            for (PlanFeatureStatusVO row : rows) {
                featureMap.put(row.getFeatureCode(), ENABLED.equalsIgnoreCase(row.getEnabledAt()));
            }
            return featureMap;
        } catch (DataAccessException ex) {
            log.warn("Failed to resolve plan feature map. planCode={}, reason={}", planCode, ex.getMessage());
            return Collections.emptyMap();
        } catch (Exception ex) {
            log.warn("Failed to resolve plan feature map. planCode={}, reason={}", planCode, ex.getMessage());
            return Collections.emptyMap();
        }
    }

    @Override
    public List<PlanFeatureItemVO> resolvePlanFeatureItems(String planCode) {
        if (!StringUtils.hasText(planCode) || !isPlanSchemaReady()) {
            return Collections.emptyList();
        }

        try {
            List<PlanFeatureItemVO> rows = planAccessDAO.selectPlanFeatureItems(planCode.trim().toUpperCase());
            for (PlanFeatureItemVO row : rows) {
                row.setEnabled(ENABLED.equalsIgnoreCase(row.getEnabledAt()));
            }
            return rows;
        } catch (DataAccessException ex) {
            log.warn("Failed to resolve plan feature items. planCode={}, reason={}", planCode, ex.getMessage());
            return Collections.emptyList();
        } catch (Exception ex) {
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
            return planAccessDAO.selectPlanMenuCodes(planCode.trim().toUpperCase());
        } catch (DataAccessException ex) {
            log.warn("Failed to resolve plan menus. planCode={}, reason={}", planCode, ex.getMessage());
            return Collections.emptyList();
        } catch (Exception ex) {
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
    @Transactional
    public void replacePlanMenus(String planCode, List<String> menuCodes) {
        if (!StringUtils.hasText(planCode) || !isPlanSchemaReady()) {
            return;
        }

        String normalizedPlanCode = planCode.trim().toUpperCase();
        LinkedHashSet<String> normalizedMenuCodeSet = new LinkedHashSet<String>();
        if (menuCodes != null) {
            for (String menuCode : menuCodes) {
                if (StringUtils.hasText(menuCode)) {
                    normalizedMenuCodeSet.add(menuCode.trim().toUpperCase());
                }
            }
        }
        List<String> normalizedMenuCodes = new ArrayList<String>(normalizedMenuCodeSet);

        try {
            planAccessDAO.deletePlanMenusByPlanCode(normalizedPlanCode);

            for (String menuCode : normalizedMenuCodes) {
                planAccessDAO.upsertPlanMenu(normalizedPlanCode, menuCode);
            }
        } catch (DataAccessException ex) {
            log.warn("Failed to replace plan menus. planCode={}, reason={}", planCode, ex.getMessage());
            throw ex;
        } catch (Exception ex) {
            log.warn("Failed to replace plan menus. planCode={}, reason={}", planCode, ex.getMessage());
            throw new RuntimeException(ex);
        }
    }

    private long resolveCurrentUsage(Long tenantId, String featureCode) {
        if ("LIMIT_USER_COUNT".equals(featureCode)) {
            try {
                return planAccessDAO.selectActiveUserCountByTenantId(tenantId);
            } catch (Exception ex) {
                log.warn("Failed to resolve current usage. tenantId={}, featureCode={}, reason={}",
                        tenantId, featureCode, ex.getMessage());
                return 0L;
            }
        }

        return 0L;
    }

    private boolean isPlanSchemaReady() {
        try {
            return planAccessDAO.selectPlanSchemaTableCount() >= 3;
        } catch (DataAccessException ex) {
            return false;
        } catch (Exception ex) {
            return false;
        }
    }
}
