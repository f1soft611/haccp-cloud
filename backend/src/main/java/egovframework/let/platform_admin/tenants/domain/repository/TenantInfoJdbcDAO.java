package egovframework.let.platform_admin.tenants.domain.repository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.egovframe.rte.psl.dataaccess.EgovAbstractMapper;
import org.springframework.stereotype.Repository;

import egovframework.let.platform_admin.tenants.domain.model.PlatformTenantDashboardItemVO;
import egovframework.let.platform_admin.tenants.domain.model.PlatformTenantDashboardQueryVO;
import egovframework.let.platform_admin.tenants.domain.model.SampleTenantVO;
import egovframework.let.platform_admin.tenants.domain.model.TenantVO;

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
    public String selectOnboardingStatusByTenantCode(String tenantCode) {
        return selectOne("TenantInfoDAO.selectOnboardingStatusByTenantCode", tenantCode);
    }

    @Override
    public String selectTenantNameByCode(String tenantCode) {
        return selectOne("TenantInfoDAO.selectTenantNameByCode", tenantCode);
    }

    @Override
    public String selectAdminEmailByLoginAccountId(Long loginAccountId) {
        return selectOne("TenantInfoDAO.selectAdminEmailByLoginAccountId", loginAccountId);
    }

    @Override
    public String selectAdminEmailByTenantCode(String tenantCode) {
        return selectOne("TenantInfoDAO.selectAdminEmailByTenantCode", tenantCode);
    }

    @Override
    public Long selectLatestLoginAccountIdByTenantCode(String tenantCode) {
        return selectOne("TenantInfoDAO.selectLatestLoginAccountIdByTenantCode", tenantCode);
    }

    @Override
    public int updateOnboardingStatusByTenantCode(String tenantCode, String onboardingStatus) {
        Map<String, Object> param = new HashMap<String, Object>();
        param.put("tenantCode", tenantCode);
        param.put("onboardingStatus", onboardingStatus);
        return update("TenantInfoDAO.updateOnboardingStatusByTenantCode", param);
    }

    @Override
    public int updateLoginAccountOnboardingStatus(Long loginAccountId, String onboardingStatus) {
        Map<String, Object> param = new HashMap<String, Object>();
        param.put("loginAccountId", loginAccountId);
        param.put("onboardingStatus", onboardingStatus);
        return update("TenantInfoDAO.updateLoginAccountOnboardingStatus", param);
    }

    @Override
    public int updateLoginAccountPasswordAndActivate(
            Long loginAccountId,
            String passwordHash,
            String passwordAlgo,
            String useAt,
            String onboardingStatus) {
        Map<String, Object> param = new HashMap<String, Object>();
        param.put("loginAccountId", loginAccountId);
        param.put("passwordHash", passwordHash);
        param.put("passwordAlgo", passwordAlgo);
        param.put("useAt", useAt);
        param.put("onboardingStatus", onboardingStatus);
        return update("TenantInfoDAO.updateLoginAccountPasswordAndActivate", param);
    }

    @Override
    public int updateUserMobileNoByLoginAccountId(Long loginAccountId, String mobileNo) {
        Map<String, Object> param = new HashMap<String, Object>();
        param.put("loginAccountId", loginAccountId);
        param.put("mobileNo", mobileNo);
        return update("TenantInfoDAO.updateUserMobileNoByLoginAccountId", param);
    }

    @Override
    public int selectActiveTenantCountByCorporateNumber(String normalizedCorporateNumber) {
        Integer count = selectOne("TenantInfoDAO.selectActiveTenantCountByCorporateNumber", normalizedCorporateNumber);
        return count == null ? 0 : count;
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
    public PlatformTenantDashboardItemVO selectDashboardTenantItemByCode(String tenantCode) {
        return selectOne("TenantInfoDAO.selectDashboardTenantItemByCode", tenantCode);
    }

    @Override
    public List<SampleTenantVO> selectRecentTenants(int limit) {
        int safeLimit = limit <= 0 ? 5 : Math.min(limit, 50);

        Map<String, Object> param = new HashMap<String, Object>();
        param.put("limit", safeLimit);
        return selectList("TenantInfoDAO.selectRecentTenants", param);
    }

    @Override
    public TenantVO selectByAdminEmailDomain(String domain) {
        return selectOne("TenantInfoDAO.selectByAdminEmailDomain", domain);
    }

    @Override
    public TenantVO selectById(Long tenantId) {
        return selectOne("TenantInfoDAO.selectById", tenantId);
    }

    @Override
    public int updateLogoImage(Long tenantId, String logoImage) {
        Map<String, Object> param = new HashMap<String, Object>();
        param.put("tenantId", tenantId);
        param.put("logoImage", logoImage);
        return update("TenantInfoDAO.updateLogoImage", param);
    }
}
