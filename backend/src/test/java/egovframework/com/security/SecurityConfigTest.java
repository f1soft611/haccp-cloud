package egovframework.com.security;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.lang.reflect.Field;
import java.util.Arrays;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class SecurityConfigTest {

    @DisplayName("공개 온보딩 API는 보안 화이트리스트에 포함되어야 한다")
    @Test
    void onboardingApiShouldBeWhitelisted() throws Exception {
        Field field = SecurityConfig.class.getDeclaredField("AUTH_WHITELIST");
        field.setAccessible(true);

        String[] whitelist = (String[]) field.get(new SecurityConfig());

        assertTrue(Arrays.asList(whitelist).contains("/api/v1/tenants/onboarding/**"));
    }
}