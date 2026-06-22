package egovframework.let.platforms.tenants.domain.repository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.egovframe.rte.psl.dataaccess.EgovAbstractMapper;
import org.springframework.stereotype.Repository;

import egovframework.let.platforms.tenants.domain.model.PlatformTenantDashboardItemVO;
import egovframework.let.platforms.tenants.domain.model.PlatformTenantDashboardQueryVO;
import egovframework.let.platforms.tenants.domain.model.SampleTenantVO;

@Repository("tenantInfoDAO")
public class TenantInfoJdbcDAO extends EgovAbstractMapper implements TenantInfoDAO {

    @Override
    public String selectMaxTenantCodeByDatePrefix(String datePrefix) {
        return selectOne("TenantInfoDAO.selectMaxTenantCodeByDatePrefix", datePrefix);
    }

    @Override
    public int insertTenant(
            String tenantSerialCode,
            String tenantNm,
            String adminEmail,
            String corporateNumber,
            String businessType,
            String businessCategory) {
        Map<String, Object> param = new HashMap<String, Object>();
        param.put("tenantSerialCode", tenantSerialCode);
        param.put("tenantNm", tenantNm);
        param.put("adminEmail", adminEmail);
        param.put("corporateNumber", corporateNumber);
        param.put("businessType", businessType);
        param.put("businessCategory", businessCategory);
        return insert("TenantInfoDAO.insertTenant", param);
    }

    @Override
    public Long selectTenantIdByCode(String tenantCode) {
        return selectOne("TenantInfoDAO.selectTenantIdByCode", tenantCode);
    }

    @Override
    public int updateOnboardingStatusByTenantCode(String tenantCode, String onboardingStatus) {
        Map<String, Object> param = new HashMap<String, Object>();
        param.put("tenantCode", tenantCode);
        param.put("onboardingStatus", onboardingStatus);
        return update("TenantInfoDAO.updateOnboardingStatusByTenantCode", param);
    }

    @Override
    public int selectTenantCount(PlatformTenantDashboardQueryVO queryVO, String useAtOnly) {
        Map<String, Object> param = new HashMap<String, Object>();
        param.put("searchField", queryVO.getSearchField());
        param.put("searchKeyword", queryVO.getSearchKeyword());
        param.put("status", queryVO.getStatus());
        param.put("onboardingStatus", queryVO.getOnboardingStatus());
        param.put("useAtOnly", useAtOnly);

        Integer count = selectOne("TenantInfoDAO.selectTenantCount", param);
        return count == null ? 0 : count;
    }

    @Override
    public List<PlatformTenantDashboardItemVO> selectDashboardTenantItems(PlatformTenantDashboardQueryVO queryVO) {
        Map<String, Object> param = new HashMap<String, Object>();
        param.put("pageIndex", queryVO.getPageIndex());
        param.put("pageSize", queryVO.getPageSize());
        param.put("searchField", queryVO.getSearchField());
        param.put("searchKeyword", queryVO.getSearchKeyword());
        param.put("status", queryVO.getStatus());
        param.put("onboardingStatus", queryVO.getOnboardingStatus());
        return selectList("TenantInfoDAO.selectDashboardTenantItems", param);
    }

    @Override
    public List<SampleTenantVO> selectRecentTenants(int limit) {
        int safeLimit = limit <= 0 ? 5 : Math.min(limit, 50);

        Map<String, Object> param = new HashMap<String, Object>();
        param.put("limit", safeLimit);
        return selectList("TenantInfoDAO.selectRecentTenants", param);
    }
}
