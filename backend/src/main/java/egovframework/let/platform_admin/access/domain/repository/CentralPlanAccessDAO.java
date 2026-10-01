package egovframework.let.platform_admin.access.domain.repository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.egovframe.rte.psl.dataaccess.EgovAbstractMapper;
import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Repository;

import egovframework.let.platform_admin.access.domain.model.PlanFeatureItemVO;
import egovframework.let.platform_admin.access.domain.model.PlanFeatureStatusVO;
import egovframework.let.platform_admin.access.domain.model.PlanSummaryVO;

@Repository("centralPlanAccessDAO")
public class CentralPlanAccessDAO extends EgovAbstractMapper {

    @Autowired
    public void setCentralSqlSessionTemplate(@Qualifier("egovCentralSqlSessionTemplate") SqlSessionTemplate sqlSessionTemplate) {
        super.setSqlSessionTemplate(sqlSessionTemplate);
    }

    public int selectPlanSchemaTableCount() throws Exception {
        Integer count = selectOne("PlanAccessDAO.selectPlanSchemaTableCount");
        return count == null ? 0 : count;
    }

    public String selectLatestFeatureEnabledAt(Long tenantId, String subscriptionStatus, String featureCode) throws Exception {
        Map<String, Object> param = new HashMap<String, Object>();
        param.put("tenantId", tenantId);
        param.put("subscriptionStatus", subscriptionStatus);
        param.put("featureCode", featureCode);
        return selectOne("PlanAccessDAO.selectLatestFeatureEnabledAt", param);
    }

    public Long selectLatestFeatureLimitValue(
            Long tenantId,
            String subscriptionStatus,
            String featureCode,
            String featureType,
            String enabledAt) throws Exception {
        Map<String, Object> param = new HashMap<String, Object>();
        param.put("tenantId", tenantId);
        param.put("subscriptionStatus", subscriptionStatus);
        param.put("featureCode", featureCode);
        param.put("featureType", featureType);
        param.put("enabledAt", enabledAt);
        return selectOne("PlanAccessDAO.selectLatestFeatureLimitValue", param);
    }

    public String selectActivePlanCode(Long tenantId, String subscriptionStatus) throws Exception {
        Map<String, Object> param = new HashMap<String, Object>();
        param.put("tenantId", tenantId);
        param.put("subscriptionStatus", subscriptionStatus);
        return selectOne("PlanAccessDAO.selectActivePlanCode", param);
    }

    public Long selectTenantIdByTenantCode(String tenantCode) throws Exception {
        return selectOne("PlanAccessDAO.selectTenantIdByTenantCode", tenantCode);
    }

    public List<PlanFeatureStatusVO> selectFeatureEnabledListByTenantId(Long tenantId, String subscriptionStatus) throws Exception {
        Map<String, Object> param = new HashMap<String, Object>();
        param.put("tenantId", tenantId);
        param.put("subscriptionStatus", subscriptionStatus);
        return selectList("PlanAccessDAO.selectFeatureEnabledListByTenantId", param);
    }

    public List<PlanSummaryVO> selectPlanList() throws Exception {
        return selectList("PlanAccessDAO.selectPlanList");
    }

    public List<PlanFeatureStatusVO> selectFeatureEnabledListByPlanCode(String planCode) throws Exception {
        return selectList("PlanAccessDAO.selectFeatureEnabledListByPlanCode", planCode);
    }

    public List<PlanFeatureItemVO> selectPlanFeatureItems(String planCode) throws Exception {
        return selectList("PlanAccessDAO.selectPlanFeatureItems", planCode);
    }

    public List<String> selectPlanMenuCodes(String planCode) throws Exception {
        return selectList("PlanAccessDAO.selectPlanMenuCodes", planCode);
    }

    public void deletePlanMenusByPlanCode(String planCode) throws Exception {
        delete("PlanAccessDAO.deletePlanMenusByPlanCode", planCode);
    }

    public void upsertPlanMenu(String planCode, String menuCode) throws Exception {
        Map<String, Object> param = new HashMap<String, Object>();
        param.put("planCode", planCode);
        param.put("menuCode", menuCode);
        insert("PlanAccessDAO.upsertPlanMenu", param);
    }

    public Long selectActiveUserCountByTenantId(Long tenantId) throws Exception {
        Long count = selectOne("PlanAccessDAO.selectActiveUserCountByTenantId", tenantId);
        return count == null ? 0L : count;
    }
}
