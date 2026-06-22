package egovframework.let.platforms.tenants.domain.repository;

import java.util.List;

import egovframework.let.platforms.tenants.domain.model.PlatformTenantDashboardItemVO;
import egovframework.let.platforms.tenants.domain.model.PlatformTenantDashboardQueryVO;
import egovframework.let.platforms.tenants.domain.model.SampleTenantVO;

/**
 * 플랫폼 테넌트 DAO
 */
public interface TenantInfoDAO {

    String selectMaxTenantCodeByDatePrefix(String datePrefix);

    int insertTenant(
            String tenantSerialCode,
            String tenantNm,
            String adminEmail,
            String corporateNumber,
            String businessType,
            String businessCategory);

    Long selectTenantIdByCode(String tenantCode);

    int updateOnboardingStatusByTenantCode(String tenantCode, String onboardingStatus);

    int selectTenantCount(PlatformTenantDashboardQueryVO queryVO, String useAtOnly);

    List<PlatformTenantDashboardItemVO> selectDashboardTenantItems(PlatformTenantDashboardQueryVO queryVO);

    List<SampleTenantVO> selectRecentTenants(int limit);
}
