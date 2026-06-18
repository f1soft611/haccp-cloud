package egovframework.let.uss.auth.service;

import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class AuthorityInfoPolicyTest {

    @DisplayName("PLATFORM_ADMIN 권한은 비활성화할 수 없다")
    @Test
    void preventPlatformAdminDeactivation() {
        AuthorityInfoVO target = new AuthorityInfoVO();
        target.setAuthorityCode("PLATFORM_ADMIN");
        target.setUseAt("N");

        assertThrows(IllegalArgumentException.class, () -> AuthorityInfoVO.validateUpdatePolicy(target));
    }
}