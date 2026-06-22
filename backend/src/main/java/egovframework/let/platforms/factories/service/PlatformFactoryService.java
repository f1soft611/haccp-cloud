package egovframework.let.platforms.factories.service;

import java.util.List;

public interface PlatformFactoryService {

    FactoryRegistrationResultVO registerFactory(FactoryRegistrationRequestVO requestVO);

    PlatformTenantDashboardResultVO listDashboardTenants(PlatformTenantDashboardQueryVO queryVO);

    List<SampleTenantVO> listRecentTenants(int limit);
}
