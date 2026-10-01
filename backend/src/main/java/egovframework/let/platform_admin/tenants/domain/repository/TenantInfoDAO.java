package egovframework.let.platform_admin.tenants.domain.repository;

import java.util.List;

import egovframework.let.platform_admin.tenants.domain.model.PlatformTenantDashboardItemVO;
import egovframework.let.platform_admin.tenants.domain.model.PlatformTenantDashboardQueryVO;
import egovframework.let.platform_admin.tenants.domain.model.SampleTenantVO;
import egovframework.let.platform_admin.tenants.domain.model.TenantDatabaseInfoVO;
import egovframework.let.platform_admin.tenants.domain.model.TenantVO;

/**
 * 플랫폼 테넌트 DAO
 * @author SHMT-MES
 * @since 2026.06.22
 * @version 1.0
 * @see
 *
 * <pre>
 * << 개정이력(Modification Information) >>
 *
 *   수정일      수정자           수정내용
 *  -------    --------    ---------------------------
 *   2026.06.22 SHMT-MES          최초 생성
 *
 * </pre>
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

        int insertTenantWithBusinessInfo(
            String tenantSerialCode,
            String tenantNm,
            String adminEmail,
            String businessRegistrationNumber,
            String corporateNumber,
            String businessType,
            String businessCategory,
            String registrationDate);

    int insertTenantDatabase(Long tenantId, String dbKey, String dbName, String schemaName);

    int updateTenantDatabaseProvisioningStatus(Long tenantId, String provisioningStatus);

    Long selectTenantIdByCode(String tenantCode);

    int selectTenantDatabaseCountByDbName(String dbName);

    String selectOnboardingStatusByTenantCode(String tenantCode);

    String selectTenantNameByCode(String tenantCode);

    String selectAdminEmailByLoginAccountId(Long loginAccountId);

    String selectLoginCodeByLoginAccountId(Long loginAccountId);

    Long selectTenantIdByEmailDomain(String emailDomain);

    String selectAdminEmailByTenantCode(String tenantCode);

    Long selectLatestLoginAccountIdByTenantCode(String tenantCode);

    int expireActiveTenantSubscription(Long tenantId);

    int insertActiveTenantSubscriptionByPlanCode(Long tenantId, String planCode);

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

    int selectActiveTenantCountByBusinessRegistrationNumber(String normalizedBusinessRegistrationNumber);

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

    TenantDatabaseInfoVO selectTenantDatabaseByTenantId(Long tenantId);

    TenantDatabaseInfoVO selectTenantDatabaseByDomainHost(String domainHost);

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
