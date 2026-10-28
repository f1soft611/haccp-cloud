package egovframework.let.organization.users.controller;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class PlatformUserApiControllerResetPasswordTest {

    @DisplayName("업체관리자, 플랫폼관리자만 비밀번호 초기화 가능")
    @Test
    void canResetPassword_onlyAdmins() {
        assertTrue(PlatformUserApiController.canResetPassword("TENANT_ADMIN"));
        assertTrue(PlatformUserApiController.canResetPassword("platform_admin"));
        assertFalse(PlatformUserApiController.canResetPassword("TENANT_USER"));
        assertFalse(PlatformUserApiController.canResetPassword(""));
        assertFalse(PlatformUserApiController.canResetPassword(null));
    }
}