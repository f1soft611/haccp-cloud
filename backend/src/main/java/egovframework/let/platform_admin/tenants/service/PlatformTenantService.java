package egovframework.let.platform_admin.tenants.service;

import java.util.List;

import egovframework.let.platform_admin.tenants.domain.model.PlatformTenantDashboardQueryVO;
import egovframework.let.platform_admin.tenants.domain.model.PlatformTenantDashboardItemVO;
import egovframework.let.platform_admin.tenants.domain.model.PlatformTenantDashboardResultVO;
import egovframework.let.platform_admin.tenants.domain.model.SampleTenantVO;
import egovframework.let.platform_admin.tenants.domain.model.TenantRegistrationRequestVO;
import egovframework.let.platform_admin.tenants.domain.model.TenantRegistrationResultVO;
import egovframework.let.platform_admin.tenants.domain.model.TenantVO;

/**
 * 플랫폼 테넌트 서비스
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
public interface PlatformTenantService {

    TenantRegistrationResultVO registerTenant(TenantRegistrationRequestVO requestVO);

    void updateOnboardingStatusByTenantCode(String tenantCode, String onboardingStatus);

    PlatformTenantDashboardResultVO listDashboardTenants(PlatformTenantDashboardQueryVO queryVO);

    PlatformTenantDashboardItemVO findDashboardTenantByCode(String tenantCode);

    List<SampleTenantVO> listRecentTenants(int limit);

    /**
     * 테넌트 도메인 매핑으로 테넌트 조회
     * 예: f1soft.co.kr -> 해당 도메인을 가진 테넌트 반환
     *
     * @param domain 도메인 (예: f1soft.co.kr)
     * @return 테넌트 VO
     * @throws IllegalArgumentException 테넌트를 찾을 수 없는 경우
     */
    TenantVO findByAdminEmailDomain(String domain);

    /**
     * 테넌트 ID로 테넌트 조회
     * 
     * @param tenantId 테넌트 ID
     * @return 테넌트 VO
     */
    TenantVO findById(Long tenantId);

    /**
     * 테넌트 로고 이미지 업데이트
     * 
     * @param tenantId 테넌트 ID
     * @param logoImage Base64 인코딩된 이미지
     */
    void updateLogoImage(Long tenantId, String logoImage);
}
