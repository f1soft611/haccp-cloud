package egovframework.let.platform_admin.loginhistory.domain.model;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class LoginHistoryTest {

    @Test
    @DisplayName("로그인 이력은 tenantId를 함께 유지해 실패 로그에서도 테넌트 컨텍스트를 보존한다")
    void loginHistory_keepsTenantIdForFailedLogin() {
        LoginHistory loginHistory = new LoginHistory();
        loginHistory.setTenantCode("TENANT_0007");
        loginHistory.setTenantId(7L);
        loginHistory.setUserId("tenant.admin.menucheck");
        loginHistory.setRoleCode("TENANT_ADMIN");

        assertEquals(7L, loginHistory.getTenantId());
        assertEquals("TENANT_0007", loginHistory.getTenantCode());
        assertEquals("tenant.admin.menucheck", loginHistory.getUserId());
    }
}
