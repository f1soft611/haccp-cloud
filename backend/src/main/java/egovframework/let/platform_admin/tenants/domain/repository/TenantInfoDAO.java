package egovframework.let.platform_admin.tenants.domain.repository;

import java.util.List;

import egovframework.let.platform_admin.tenants.domain.model.PlatformTenantDashboardItemVO;
import egovframework.let.platform_admin.tenants.domain.model.PlatformTenantDashboardQueryVO;
import egovframework.let.platform_admin.tenants.domain.model.SampleTenantVO;
import egovframework.let.platform_admin.tenants.domain.model.TenantVO;

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

        String selectOnboardingStatusByTenantCode(String tenantCode);

        String selectTenantNameByCode(String tenantCode);

        String selectAdminEmailByLoginAccountId(Long loginAccountId);

        String selectLoginCodeByLoginAccountId(Long loginAccountId);

        Long selectTenantIdByEmailDomain(String emailDomain);

        String selectAdminEmailByTenantCode(String tenantCode);

        Long selectLatestLoginAccountIdByTenantCode(String tenantCode);

    int updateOnboardingStatusByTenantCode(String tenantCode, String onboardingStatus);

        int updateLoginAccountOnboardingStatus(Long loginAccountId, String onboardingStatus);

        int updateLoginAccountPasswordAndActivate(
            Long loginAccountId,
            String passwordHash,
            String passwordAlgo,
            String useAt,
            String onboardingStatus);

        int updateUserMobileNoByLoginAccountId(Long loginAccountId, String mobileNo);

        int demotePrimaryDomainByTenantId(Long tenantId);

        int activateTenantDomain(Long tenantId, String emailDomain);

        int insertTenantDomain(Long tenantId, String emailDomain);

    int selectActiveTenantCountByCorporateNumber(String normalizedCorporateNumber);

    int selectTenantCount(PlatformTenantDashboardQueryVO queryVO, String useAtOnly);

    List<PlatformTenantDashboardItemVO> selectDashboardTenantItems(PlatformTenantDashboardQueryVO queryVO);

    PlatformTenantDashboardItemVO selectDashboardTenantItemByCode(String tenantCode);

    List<SampleTenantVO> selectRecentTenants(int limit);

    /**
     * 테넌트 도메인 매핑으로 테넌트 조회
     * 예: f1soft.co.kr -> 해당 도메인을 가진 테넌트 반환
     *
     * @param domain 도메인 (예: f1soft.co.kr)
     * @return 테넌트 VO
     */
    TenantVO selectByAdminEmailDomain(String domain);

    /**
     * 테넌트 ID로 테넌트 조회
     * 
     * @param tenantId 테넌트 ID
     * @return 테넌트 VO
     */
    TenantVO selectById(Long tenantId);

    /**
     * 테넌트 로고 이미지 업데이트
     * 
     * @param tenantId 테넌트 ID
     * @param logoImage Base64 인코딩된 이미지
     * @return 업데이트된 행 수
     */
    int updateLogoImage(Long tenantId, String logoImage);
}
