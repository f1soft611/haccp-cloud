package egovframework.let.platforms.tenants.service;

import java.util.List;

import egovframework.let.platforms.tenants.domain.model.PlatformTenantDashboardQueryVO;
import egovframework.let.platforms.tenants.domain.model.PlatformTenantDashboardResultVO;
import egovframework.let.platforms.tenants.domain.model.SampleTenantVO;
import egovframework.let.platforms.tenants.domain.model.TenantRegistrationRequestVO;
import egovframework.let.platforms.tenants.domain.model.TenantRegistrationResultVO;

/**
 * 플랫폼 테넌트 서비스
 */
public interface PlatformTenantService {

    TenantRegistrationResultVO registerTenant(TenantRegistrationRequestVO requestVO);

    void updateOnboardingStatusByTenantCode(String tenantCode, String onboardingStatus);

    PlatformTenantDashboardResultVO listDashboardTenants(PlatformTenantDashboardQueryVO queryVO);

    List<SampleTenantVO> listRecentTenants(int limit);
}
